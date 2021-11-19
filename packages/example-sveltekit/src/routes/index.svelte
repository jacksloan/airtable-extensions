<script context="module" lang="ts">
	export const load = async ({ fetch }) => {
		const res = await fetch('index.json');
		const locations = await res.json();
		return { props: { locations } };
	};
</script>

<script lang="ts">
	import type { FolkSchool } from '$lib/api';
	export let locations: FolkSchool[];
</script>

<h1>US Folk Schools</h1>

{#each locations as loc}
	<h3>{loc.name}</h3>
	<p>{loc.description}</p>
{/each}
