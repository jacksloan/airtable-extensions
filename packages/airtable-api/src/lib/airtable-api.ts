import airtable, { FieldSet, Record as AirtableRecord } from 'airtable';
import { QueryParams } from 'airtable/lib/query_params';
import {
  AirtableCacheOptions,
  AirtableQueueStrategy,
  AirtableRateLimitingCache,
} from '..';

type booleanType = 'boolean';
type stringType = 'string';
type numberType = 'number';
type lookupType<T> = T extends booleanType
  ? boolean
  : T extends stringType
  ? string
  : T extends numberType
  ? number
  : T;

export type AirtableEntity<Model> = {
  [key in keyof Model]: lookupType<Model[key]>;
} & { id: string };

type AirtableOptions<T> = {
  fields?: Array<keyof T>;
  maxRecords?: number;
  pageSize?: number;
  view?: string;
  cellFormat?: 'json' | 'string';
  timeZone?: string;
  userLocale?: string;
  sort?: Array<{ field: keyof T; direction: 'asc' | 'desc' }>;
};

type AirtableApi<Spec> = {
  [key in keyof Spec]: {
    findAll(
      options?: AirtableOptions<Spec[key]>
    ): Promise<Array<AirtableEntity<Spec[key]>>>;
    findById(recordId: string): Promise<AirtableEntity<Spec[key]> | null>;
    update(entity: Partial<AirtableEntity<Spec[key]>> & { id: string });
    create(items: Array<Omit<AirtableEntity<Spec[key]>, 'id'>>);
  };
} & {
  expireCacheKey(key: string): void;
};

export function createApi<S>(options: {
  spec: S;
  apiKey: string;
  baseId: string;
}): AirtableApi<S> {
  const { spec, apiKey, baseId } = options;
  const base = new airtable({ apiKey }).base(baseId);
  const rateLimitingCache = new AirtableRateLimitingCache({
    throttleTime: 200,
  });

  function recordToEntity(record: AirtableRecord<any>, entitySpec) {
    return {
      id: record.getId(),
      ...Object.keys(entitySpec).reduce((acc, curr) => {
        acc[curr] = record.get(curr) ?? null;
        return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as any),
    };
  }

  const handler = {
    get: function (_target: AirtableApi<S>, prop: string) {
      const entitySpec = spec[prop];
      const findAllCacheKey = `findAll-${prop}`;

      function getFindByIdCacheKey(recordId: string): string {
        return `findById-${prop}-${recordId}`;
      }

      return {
        async findAll(options: QueryParams<FieldSet>) {
          const findAllRequest = async () =>
            base
              .table(prop)
              .select(options)
              .all()
              .then((records) =>
                records.map((record) => recordToEntity(record, entitySpec))
              );

          const findAllCacheConfig: AirtableCacheOptions = {
            cacheKey: findAllCacheKey,
            getExpiration: () => new Date().getTime() + 10_000, // cache item expires in 10 seconds
            queueStrategy: AirtableQueueStrategy.EXPIRED, // only queue requests if an item is expired
          };

          return rateLimitingCache.schedule(findAllCacheConfig, findAllRequest);
        },
        async findById(recordId: string) {
          const findByIdRequest = async () =>
            base(prop)
              .find(recordId)
              .then((it) => (it ? recordToEntity(it, entitySpec) : null));

          const findByIdCacheConfig: AirtableCacheOptions = {
            cacheKey: getFindByIdCacheKey(recordId),
            getExpiration: () => new Date().getTime() + 10_000, // cache item expires in 10 seconds
            queueStrategy: AirtableQueueStrategy.EXPIRED, // only queue requests if an item is expired
          };
          return rateLimitingCache.schedule(
            findByIdCacheConfig,
            findByIdRequest
          );
        },
        async update(entity: AirtableEntity<any>) {
          const cacheKey = getFindByIdCacheKey(entity.id);

          // immediately expire this item in the cache
          rateLimitingCache.expireCacheItem(cacheKey);

          const updateRequest = async () =>
            base(prop)
              .update(entity.id, entity)
              .then((maybeRecord) =>
                maybeRecord ? recordToEntity(maybeRecord, entitySpec) : null
              );

          const updateCacheConfig: AirtableCacheOptions = {
            cacheKey,
            getExpiration: () => new Date().getTime() + 10_000, // cache item expires in 10 seconds
            queueStrategy: AirtableQueueStrategy.ALWAYS, // always queue updates
          };

          return rateLimitingCache.schedule(updateCacheConfig, updateRequest);
        },
        async create(items: Array<Omit<AirtableEntity<any>, 'id'>>) {
          // immediately expire "findAll" cache records associated with this table
          rateLimitingCache.expireCacheItem(findAllCacheKey);

          const createRequest = async () => {
            const created: Array<AirtableEntity<any>> = await base(prop)
              .create(items.map((item) => ({ fields: item })))
              .then((records) =>
                records.map((record) => recordToEntity(record, entitySpec))
              );

            // cache each item individually after they are created
            created.forEach((item) =>
              rateLimitingCache.setCacheItem(getFindByIdCacheKey(item.id), {
                expires: new Date().getTime() + 10_000,
                value: item,
              })
            );

            return created;
          };

          const createCacheConfig: AirtableCacheOptions = {
            cacheKey: null, // do not cache this response
            queueStrategy: AirtableQueueStrategy.ALWAYS, // always queue updates
          };

          rateLimitingCache.schedule(createCacheConfig, createRequest);
        },
      };
    },
  };

  // TODO insteaed of using a proxy, maybe generate a complete object
  // this would allow other use cases like an express api generator that emits a swagger/openapi spec
  return new Proxy({} as AirtableApi<S>, handler);
}
