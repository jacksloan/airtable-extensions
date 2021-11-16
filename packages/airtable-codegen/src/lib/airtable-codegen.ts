import 'reflect-metadata';

import * as _ from 'lodash';
import airtable from 'airtable';

const allowedPropTypes = ['String', 'Boolean', 'Number'] as const;
type allowedPropType = typeof allowedPropTypes[number];

function airProp(target: any, key: string): void {
  const t = Reflect.getMetadata('design:type', target, key);
  registerProperty(target, key);
  const type: allowedPropType | string = t.name;
  if (!allowedPropTypes.includes(type as any)) {
    throw new Error(
      `Invalid airtable property ${key}. Only types \`string\`, \`number\`, or \`boolean\` are valid`
    );
  }
  if (delete target[key]) {
    const prop = `_${key}`;
    Object.defineProperty(target, key, {
      get: () => target[prop],
      set: (value: unknown) => {
        switch (type) {
          case 'Boolean':
            if (_.isBoolean(value)) {
              target[prop] = value;
            }
            break;
          case 'Number':
            if (_.isNumber(value)) {
              target[prop] = value;
            }
            break;
          case 'String':
            if (_.isString(value)) {
              target[prop] = value;
            }
            break;
        }
      },
      enumerable: false,
      configurable: true,
    });
  }
}

const fieldsMetadataKey = Symbol('airtableFields');

function registerProperty(
  target: Record<string, unknown>,
  propertyKey: string
): void {
  let properties: string[] = Reflect.getMetadata(fieldsMetadataKey, target);

  if (properties) {
    properties.push(propertyKey);
  } else {
    properties = [propertyKey];
    Reflect.defineMetadata(fieldsMetadataKey, properties, target);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
function AirtableEntity(constructor: Function) {
  constructor.prototype.fromRecord = function (record: {
    get: (property: string) => string | boolean | number;
  }) {
    const fieldNames: string[] = Reflect.getMetadata(fieldsMetadataKey, this);
    fieldNames.forEach((field) => (this[field] = record.get(field)));
  };
}

@AirtableEntity
class TestClass {
  @airProp stringProp?: string;
  @airProp boolProp?: boolean;
  @airProp numberProp?: number;
  // @airProp arrayProp?: any[];
}

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

type Api<spec> = {
  [tableKey in keyof spec]: {
    findAll(options?: {
      sort?: Array<{ field: keyof spec[tableKey]; direction: 'asc' | 'desc' }>;
    }): Promise<
      Array<{
        [fieldKey in keyof spec[tableKey]]: lookupType<
          spec[tableKey][fieldKey]
        >;
      }>
    >;
  };
};

function createApi<S>(options: {
  spec: S;
  apiKey: string;
  baseId: string;
}): Api<S> {
  const { spec, apiKey, baseId } = options;
  const base = new airtable({ apiKey }).base(baseId);

  const handler = {
    get: function (target: any, prop: string, receiver: any) {
      return {
        async findAll(options?: { sort: any }) {
          const records = await base
            .table(prop as string)
            .select()
            .all();
          return records.map((r) => {
            return Object.keys((spec as any)[prop]).reduce((acc, curr) => {
              acc[curr] = r.get(curr);
              return acc;
            }, {} as any);
          });
        },
      };
    },
  };

  return new Proxy({}, handler);
}

const api = createApi({
  apiKey: 'TODO',
  baseId: 'TODO',
  spec: {
    places: {
      name: 'string',
      lat: 'number',
      long: 'number',
      active: 'boolean',
    },
    locations: {
      name: 'string',
      description: 'string',
      latitude: 'number',
      longitude: 'number',
    },
    people: {
      firstName: 'string',
      lastName: 'string',
      age: 'number',
    },
  } as const,
});

(async () => {
  const places = await api.places.findAll();
  const locations = await api.locations.findAll();
  const people = await api.people.findAll();
  console.log({
    places,
    locations,
    people,
  });
})();
