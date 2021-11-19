import type { AirtableEntity } from 'jbs-airtable-api-extensions';
import { createApi } from 'jbs-airtable-api-extensions';

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
	apiKey: process.env.AIRTABLE_KEY,
	baseId: process.env.AIRTABLE_BASE,
	spec: modelSpec
});
