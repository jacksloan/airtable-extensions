import airtable, { FieldSet, Record as AirtableRecord } from 'airtable';
import { QueryParams } from 'airtable/lib/query_params';
import { AirtableQueueStrategy, AirtableRateLimitingCache } from '..';

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

  const recordToEntity = (record: AirtableRecord<any>, entitySpec) => ({
    id: record.getId(),
    ...Object.keys(entitySpec).reduce((acc, curr) => {
      acc[curr] = record.get(curr) ?? null;
      return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any),
  });

  const handler = {
    get: function (_target: AirtableApi<S>, prop: string) {
      return {
        async findAll(options: QueryParams<FieldSet>) {
          const request = async () => {
            const records = await base.table(prop).select(options).all();
            return records.map((record) => recordToEntity(record, spec[prop]));
          };

          const response = await rateLimitingCache.schedule(
            {
              cacheKey: `findAll-${prop}`,
              getExpiration: () => new Date().getTime() + 10_000, // cache item expires in 10 seconds
              queueStrategy: AirtableQueueStrategy.EXPIRED, // only queue requests if an item is expired
            },
            request
          );

          return response;
        },
        async findById(recordId: string) {
          const maybeRecord = base(prop).find(recordId);
          return maybeRecord || null;
        },
        async update(entity: AirtableEntity<any>) {
          const maybeRecord = await base(prop).update(entity.id, entity);
          return maybeRecord ? recordToEntity(maybeRecord, spec[prop]) : null;
        },
        async create(items: Array<AirtableEntity<any>>) {
          const withFielsProp = (item: Record<string, any>) => ({
            fields: item,
          });
          const records = await base(prop).create(items.map(withFielsProp));
          return (
            records.map((record) => recordToEntity(record, spec[prop])) || []
          );
        },
      };
    },
  };

  return new Proxy({} as AirtableApi<S>, handler);
}
