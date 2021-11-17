import airtable from 'airtable';

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

  const handler = {
    get: function (target: any, prop: string, receiver: any) {
      return {
        async findAll(options?: { sort?: any }) {
          const records = await base
            .table(prop as string)
            .select(options)
            .all();
          return records.map((r) => {
            return Object.keys((spec as any)[prop]).reduce((acc, curr) => {
              acc[curr] = r.get(curr) ?? null;
              return acc;
            }, {} as any);
          });
        },
      };
    },
  };

  return new Proxy({}, handler);
}
