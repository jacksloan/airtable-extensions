# AirtableExtensions

3rd party extensions for [airtable](https://airtable.com/)

[Example usage](./apps/airkit)

Quickly create typesafe APIs for your airtable bases:

### Create API Example:

```typescript
import { createApi } from 'jbs-airtable-api-extensions';
import type { AirtableEntity } from 'jbs-airtable-api-extensions';

const modelSpec = {
  places: {
    name: 'string',
    lat: 'number',
    long: 'number',
    active: 'boolean',
  },
  people: {
    firstName: 'string',
    lastName: 'string',
    age: 'number',
  },
} as const;

export type Person = AirtableEntity<typeof modelSpec['people']>;
export type Place = AirtableEntity<typeof modelSpec['places']>;

export const api = createApi({
  apiKey: AIRTABLE_KEY,
  baseId: AIRTABLE_BASE,
  spec: modelSpec,
});

// api is typesafe and will autocomplete available tables and field names
(async () => {
  const places = api.places.findAll({
    // field names autocomplete based on the spec above
    fields: [
      'nam', // ts error! -  type '"nam"' is not assignable to type '"name" | "lat" | "long" | "active"'
      'active',
    ],

    sort: [
      {
        field: 'activ', // ts error! -  type '"activ"' is not assignable to type '"name" | "lat" | "long" | "active"'
        direction: 'asc',
      },
    ],
  });
})();
```
