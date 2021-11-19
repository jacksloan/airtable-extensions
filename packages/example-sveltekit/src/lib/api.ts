// NOTE: even though this app is part of the nx workspace,
// use the published versoin of the jbs-airtable-api-extensions library.
// This avoids a multitude of issues with imports and vite
import { createApi } from 'jbs-airtable-api-extensions';
import type { AirtableEntity } from 'jbs-airtable-api-extensions';
import { AIRTABLE_BASE, AIRTABLE_KEY } from './secrets';

// TODO - create an "infer types" page for easily creating a model spec
// TODO - use the meta data API once airtable makes it available again
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
export type FolkSchool = AirtableEntity<typeof modelSpec['locations']>;

export const api = createApi({
	apiKey: AIRTABLE_KEY,
	baseId: AIRTABLE_BASE,
	spec: modelSpec
});
