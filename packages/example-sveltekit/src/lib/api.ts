import { createApi } from 'jbs-airtable-api-extensions';
import type { AirtableEntity } from 'jbs-airtable-api-extensions';
import { AIRTABLE_BASE, AIRTABLE_KEY } from './secrets';

const modelSpec = {
	places: {
		name: 'string',
		lat: 'number',
		long: 'number',
		active: 'boolean'
	},
	locations: {
		name: 'string',
		description: 'string',
		latitude: 'number',
		longitude: 'number'
	},
	people: {
		firstName: 'string',
		lastName: 'string',
		age: 'number'
	}
} as const;

export type Person = AirtableEntity<typeof modelSpec['people']>;
export type Place = AirtableEntity<typeof modelSpec['places']>;
export type Location = AirtableEntity<typeof modelSpec['locations']>;

export const api = createApi({
	apiKey: AIRTABLE_KEY,
	baseId: AIRTABLE_BASE,
	spec: modelSpec
});
