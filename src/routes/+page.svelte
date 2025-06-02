<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import CodeGraph from '$lib/components/CodeGraph.svelte';
</script>

<SvelteFlowProvider>
	<CodeGraph />
</SvelteFlowProvider>
