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

<h1>US Folk Schools</h1>

{#each locations as loc}
	<h3>{loc.name}</h3>
	<p>{loc.description}</p>
{/each}
