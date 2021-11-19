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
    findById(): Promise<AirtableEntity<Spec[key]> | null>;
    update(entity: Partial<AirtableEntity<Spec[key]>> & { id: string });
    create(items: Array<Omit<AirtableEntity<Spec[key]>, 'id'>>);
  };
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
            cacheKey: `findAll-${prop}`,
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
          // TODO - immediately expire cached records matching this entity id
          // TODO - immediately expire "findAll" cache records for this table
          const updateRequest = async () =>
            base(prop)
              .update(entity.id, entity)
              .then((maybeRecord) =>
                maybeRecord ? recordToEntity(maybeRecord, entitySpec) : null
              );

          const updateCacheConfig: AirtableCacheOptions = {
            cacheKey: getFindByIdCacheKey(entity.id),
            getExpiration: () => new Date().getTime() + 10_000, // cache item expires in 10 seconds
            queueStrategy: AirtableQueueStrategy.ALWAYS, // always queue updates!
          };

          return rateLimitingCache.schedule(updateCacheConfig, updateRequest);
        },
        // TODO - schedule "create" on the rate limiting cache and set each record in the cache
        // TODO - immediately expire "findAll" cache records associated with this table
        async create(items: Array<AirtableEntity<any>>) {
          const withFielsProp = (item: Record<string, any>) => ({
            fields: item,
          });
          const records = await base(prop).create(items.map(withFielsProp));
          return (
            records.map((record) => recordToEntity(record, entitySpec)) || []
          );
        },
      };
    },
  };

  return new Proxy({} as AirtableApi<S>, handler);
}
