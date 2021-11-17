import airtable from 'airtable';
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

type AirtableApi<Spec> = {
  [key in keyof Spec]: {
    findAll(options?: {
      sort?: Array<{ field: keyof Spec[key]; direction: 'asc' | 'desc' }>;
    }): Promise<Array<AirtableEntity<Spec[key]>>>;
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

  const handler = {
    get: function (_target: any, prop: string, _receiver: any) {
      return {
        async findAll(options?: { sort?: any }) {
          const request = async () => {
            const records = await base
              .table(prop as string)
              .select(options)
              .all();

            return records.map((r) => ({
              id: r.getId(),
              ...Object.keys((spec as any)[prop]).reduce((acc, curr) => {
                acc[curr] = r.get(curr) ?? null;
                return acc;
              }, {} as any),
            }));
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
      };
    },
  };

  return new Proxy({}, handler);
}
