# AirtableExtensions

3rd party extensions for [airtable](https://airtable.com/)

[Example usage](./apps/airkit)

Quickly create typesafe APIs for your airtable bases:

API requests are automatically rate-limited and queued if the request would exceed the max of 5 requests per second.

### Airtable client example:

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
  // don't expose secrets in git or client app!
  apiKey: process.env.AIRTABLE_KEY,
  baseId: process.env.AIRTABLE_BASE,
  spec: modelSpec,
});

// api is typesafe and will autocomplete available tables and field names
(async () => {
  const places: Place[] = await api.places.findAll({
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
