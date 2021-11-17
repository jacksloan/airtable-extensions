# AirtableExtensions

3rd party extensions for [airtable](https://airtable.com/)

[Example usage](./apps/airkit)

## Airtable Cache

Use decorators to automatically cache and rate limit api requests to airtable

### Typescript Example:

```
import {AirtableCache, AirtableQueueStrategy} from '@airtable-extensions/airtable-cache';
import {AirtableBase} from 'airtable'

export class Api {

    constructor(
        private airtable: AirtableBase
    )

    @AirtableCache({
        cacheKey: 'apartments',

        // cache will expire after 20 seconds
        getExpiration: () => new Date().getTime() + 20_000


        // only make a new request if this key has expired
        queueStrategy: AirtableQueueStrategy.EXPIRED

    })
    findAllApartments(): Promise<Array<Apartments>> {
		return this.airtable('apartments')
			.select({ view: 'Grid view' })
			.all()
    }
}
```
