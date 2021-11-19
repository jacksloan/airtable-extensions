import type { FolkSchool } from '$lib/api';
import { api } from '$lib/api';

export async function get(): Promise<{ body: FolkSchool[] }> {
	const body = await api.locations.findAll();
	return { body };
}
