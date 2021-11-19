import type { Location } from '$lib/api';
import { api } from '$lib/api';

export async function get(): Promise<{ body: Location[] }> {
	const body = await api.locations.findAll();
	return { body };
}
