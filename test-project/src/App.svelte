<script lang="ts">
	import svelteLogo from './assets/svelte.svg';
	import viteLogo from '/vite.svg';
	import Button from './lib/components/Button.svelte';
	import { fetchData } from './lib/services/api';
	fetchData('/api/data').then((data) => console.log(data));
</script>

<main>
	<Button label="click me" />
</main>
