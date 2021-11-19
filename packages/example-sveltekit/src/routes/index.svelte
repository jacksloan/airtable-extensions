<script context="module" lang="ts">
	export const load = async ({ fetch }) => {
		const res = await fetch('index.json');
		const json = await res.json();
		return {
			props: {
				locations: json
			}
		};
	};
</script>

<script lang="ts">
	import type { Location } from '$lib/api';
	export let locations: Location[];
</script>

<table>
	<thead>
		<tr>
			<td> Airtable ID </td>
			<td> Name </td>
			<td> Description </td>
		</tr>
	</thead>
	<tbody>
		{#each locations as l}
			<tr>
				<td>{l.id}</td>
				<td>{l.name}</td>
				<td>{l.description}</td>
			</tr>
		{/each}
	</tbody>
</table>
