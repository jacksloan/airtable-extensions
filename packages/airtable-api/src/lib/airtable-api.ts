import airtable from 'airtable';
import {
  AirtableCache,
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
};

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
    get: function (target: any, prop: string, receiver: any) {
      return {
        async findAll(options?: { sort?: any }) {
          const request = base
            .table(prop as string)
            .select(options)
            .all()
            .then((records) =>
              records.map((r) =>
                Object.keys((spec as any)[prop]).reduce((acc, curr) => {
                  acc[curr] = r.get(curr) ?? null;
                  return acc;
                }, {} as any)
              )
            );

          return rateLimitingCache.schedule(
            {
              cacheKey: `findAll-${prop}-${JSON.stringify(options || {})}`,
              getExpiration: () => new Date().getTime() + 10_000,
              queueStrategy: AirtableQueueStrategy.NONE_PENDING,
            },
            request
          );
        },
      };
    },
  };

  return new Proxy({}, handler);
}
