<script lang="ts">
	import { SvelteFlow, MarkerType, Background, useSvelteFlow } from '@xyflow/svelte';
	import type { Node, Edge, NodeEventWithPointer } from '@xyflow/svelte';
	// import '@xyflow/svelte/dist/style.css';
	import { untrack } from 'svelte';

	// --- Interfaces based on Data_Model.md / tsAnalysisService.ts output ---
	interface FileNodeData {
		id: string;
		name: string;
		path: string;
		language: 'typescript' | 'javascript' | 'json' | 'svelte' | 'other';
		createdAt: string;
		directoryId: string | null;
		// viz_posX?: number;
		// viz_posY?: number;
	}

	interface DirectoryNodeData {
		id: string;
		name: string;
		path: string;
		parentId: string | null;
		createdAt: string;
		childFileNodes: FileNodeData[];
		childDirectoryNodes: DirectoryNodeData[];
		// viz_posX?: number;
		// viz_posY?: number;
		// viz_isExpanded?: boolean;
	}

	interface ProjectStructureData {
		id: string;
		name: string;
		rootPath: string;
		createdAt: string;
		rootDirectory: DirectoryNodeData;
	}

	// --- Component State using Svelte 5 Runes ---
	let fullProjectData = $state<ProjectStructureData | null>(null);
	let currentDirectoryId = $state<string | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	const { fitView } = useSvelteFlow();
	async function fetchData() {
		isLoading = true;
		error = null;
		try {
			// Using provided sample JSON directly for now.
			// Replace with actual fetch call when API is ready.
			const response = await fetch('/api/project-structure?projectPath=./test-project');
			if (!response.ok) {
				throw new Error(`Failed to fetch project structure: ${response.statusText}`);
			}
			const projectData: ProjectStructureData = await response.json();
			if (!projectData || !projectData.rootDirectory) {
				throw new Error('Project data or root directory is missing.');
			}
			fullProjectData = projectData;
			currentDirectoryId = projectData.rootDirectory.id; // Start at root
		} catch (e: any) {
			console.error('Error fetching or processing project structure:', e);
			error = e.message || 'An unknown error occurred.';
			fullProjectData = null;
			currentDirectoryId = null;
		} finally {
			isLoading = false;
		}
	}

	// --- Data Fetching ---
	// $effect(() => {
	//
	// 	fetchData();
	// });

	// --- Helper function to find a directory by ID in the full structure ---
	function findDirectoryById(dir: DirectoryNodeData | null, id: string): DirectoryNodeData | null {
		if (!dir) return null;
		if (dir.id === id) return dir;
		for (const childDir of dir.childDirectoryNodes) {
			const found = findDirectoryById(childDir, id);
			if (found) return found;
		}
		return null;
	}

	// --- Reactive generation of nodes and edges for the current view ---
	function generateGraphForCurrentView(
		projectData: ProjectStructureData | null,
		currentDirId: string | null
	) {
		if (!projectData || !currentDirId) {
			nodes = [];
			edges = [];
			return;
			// return { nodes: [], edges: [] };
		}

		const currentDirectory = findDirectoryById(projectData.rootDirectory, currentDirId);
		if (!currentDirectory) {
			console.error(`Directory with ID ${currentDirId} not found in project data.`);
			// Attempt to reset to root if current is somehow invalid and not root
			if (currentDirId !== projectData.rootDirectory.id) {
				console.warn(`Attempting to reset view to root directory.`);
				// This assignment within a derived-like function is tricky.
				// It's better to handle this upstream or ensure currentDirId is always valid.
				// For now, returning empty graph for invalid currentDirId.
			}
			nodes = [];
			edges = [];
			return; //{ nodes: [], edges: [] };
		}

		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];
		const xSpacing = 210; // Increased spacing
		const ySpacing = 150; // Increased spacing for better readability

		// Add the current directory node (parent)
		newNodes.push({
			id: currentDirectory.id,
			// type: 'default',
			data: {
				label: `${currentDirectory.name}`,
				type: 'directory',
				isCurrent: true,
				path: currentDirectory.path
			},
			position: { x: 0, y: 0 }, // Centered
			class: 'current-node',
			style: 'width: 200px; text-align: center;'
		});

		const children = [...currentDirectory.childDirectoryNodes, ...currentDirectory.childFileNodes];
		const totalChildren = children.length;
		let currentX = -((totalChildren - 1) * xSpacing) / 2; // Calculate starting X to center children

		// Process child directories
		currentDirectory.childDirectoryNodes.forEach((childDir) => {
			newNodes.push({
				id: childDir.id,
				// type: 'default',
				data: {
					label: childDir.name,
					type: 'directory',
					parentId: currentDirectory.id,
					path: childDir.path
				},
				position: { x: currentX, y: ySpacing },
				class: 'child-directory',
				style: 'width: 180px; text-align: center; font-medium'
			});
			newEdges.push({
				id: `e-${currentDirectory.id}-${childDir.id}`,
				source: currentDirectory.id,
				target: childDir.id,
				markerEnd: { type: MarkerType.ArrowClosed },
				style: 'stroke-width: 2; stroke: #9ca3af;' // gray-400
			});
			currentX += xSpacing;
		});

		// Process child files
		currentDirectory.childFileNodes.forEach((file) => {
			newNodes.push({
				id: file.id,
				// type: 'default',
				data: { label: file.name, type: 'file', parentId: currentDirectory.id, path: file.path },
				position: { x: currentX, y: ySpacing },
				class: 'child-file',
				style: 'width: 180px; text-align: center;'
			});
			newEdges.push({
				id: `e-${currentDirectory.id}-${file.id}`,
				source: currentDirectory.id,
				target: file.id,
				markerEnd: { type: MarkerType.ArrowClosed },
				style: 'stroke-width: 2; stroke: #9ca3af;' // gray-400
			});
			currentX += xSpacing;
		});

		nodes = newNodes;
		edges = newEdges;
	}

	// Svelte 5 derived state for graph elements
	let nodes: Node[] = $state.raw([]);
	let edges: Edge[] = $state.raw([]);

	$effect(() => {
		fetchData();
	});

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		[fullProjectData, currentDirectoryId];
		untrack(() => {
			generateGraphForCurrentView(fullProjectData, currentDirectoryId);
			fitView({ padding: '50px', duration: 100 });
		});
	});

	// --- Event Handlers ---
	const onNodeClick: NodeEventWithPointer<MouseEvent | TouchEvent, Node> = (event) => {
		const node = event.node;
		if (node.data?.type === 'directory') {
			// Check if it's not the current directory to avoid redundant updates
			// or if it is current, it means we might want to "re-focus" (though not strictly needed here)
			if (node.id !== currentDirectoryId) {
				// Check if the clicked directory exists in the full project data
				const clickedDirData = findDirectoryById(fullProjectData!.rootDirectory, node.id);
				if (clickedDirData) {
					currentDirectoryId = node.id;
				} else {
					console.warn(`Clicked directory ${node.id} not found in full data. Ignoring click.`);
				}
			}
		}
		// Optionally, handle file clicks here (e.g., show info panel)
		// console.log('Clicked node:', node.data?.label, 'Type:', node.data?.type);
	};

	function goUp() {
		if (!fullProjectData || !currentDirectoryId || !fullProjectData.rootDirectory) {
			return;
		}
		if (currentDirectoryId === fullProjectData.rootDirectory.id) {
			return; // Already at root
		}

		const currentDirData = findDirectoryById(fullProjectData.rootDirectory, currentDirectoryId);
		if (currentDirData && currentDirData.parentId) {
			currentDirectoryId = currentDirData.parentId;
		} else if (currentDirData && !currentDirData.parentId) {
			// Should be root, but if somehow parentId is null for a non-root, go to actual root.
			currentDirectoryId = fullProjectData.rootDirectory.id;
		}
	}

	const isNotRoot = $derived(
		fullProjectData !== null &&
			currentDirectoryId !== null &&
			fullProjectData.rootDirectory !== null &&
			currentDirectoryId !== fullProjectData.rootDirectory.id
	);

	const currentPathDisplay = $derived.by(() => {
		if (!fullProjectData || !currentDirectoryId) return 'Loading path...';
		const dir = findDirectoryById(fullProjectData.rootDirectory, currentDirectoryId);
		return dir
			? dir.path
				? `${fullProjectData.name}/${dir.path}`
				: fullProjectData.name
			: 'Unknown Path';
	});
</script>

<div id="code-graph" style="height: 100vh; width: 100%;" class="relative bg-gray-800 text-white">
	{#if isLoading}
		<p class="p-6 text-center text-xl text-gray-400">Loading project structure...</p>
	{:else if error}
		<p class="p-6 text-center text-xl text-red-400">Error: {error}</p>
	{:else if !fullProjectData || (nodes.length === 0 && currentDirectoryId === fullProjectData?.rootDirectory?.id && fullProjectData?.rootDirectory?.childDirectoryNodes.length === 0 && fullProjectData?.rootDirectory?.childFileNodes.length === 0)}
		<div class="bg-opacity-80 absolute top-0 left-0 z-20 rounded-br-lg bg-gray-700 p-4">
			<p class="mb-1 text-lg font-semibold">Current: {currentPathDisplay}</p>
			{#if isNotRoot}
				<button
					onclick={goUp}
					class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-md transition-colors hover:bg-blue-700"
				>
					Go Up
				</button>
			{/if}
		</div>
		<p class="p-6 pt-20 text-center text-xl text-gray-400">Project root is empty.</p>
		<SvelteFlow {nodes} {edges} fitView minZoom={0.1} maxZoom={2}>
			<Background gap={20} />
		</SvelteFlow>
	{:else if nodes.length === 0}
		<p class="p-6 text-center text-xl text-gray-400">No items to display in this directory.</p>
		<div class="bg-opacity-80 absolute top-0 left-0 z-20 rounded-br-lg bg-gray-700 p-4">
			<p class="mb-1 text-lg font-semibold">Current: {currentPathDisplay}</p>
			{#if isNotRoot}
				<button
					onclick={goUp}
					class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-md transition-colors hover:bg-blue-700"
				>
					Go Up
				</button>
			{/if}
		</div>
		<SvelteFlow {nodes} {edges} fitView minZoom={0.1} maxZoom={2}>
			<Background gap={20} />
		</SvelteFlow>
	{:else}
		<div class="bg-opacity-80 absolute top-0 left-0 z-20 rounded-br-lg bg-gray-700 p-4">
			<p class="mb-1 text-lg font-semibold">Current: {currentPathDisplay}</p>
			{#if isNotRoot}
				<button
					onclick={goUp}
					class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-md transition-colors hover:bg-blue-700"
				>
					Go Up
				</button>
			{/if}
		</div>
		<SvelteFlow
			bind:nodes
			bind:edges
			onnodeclick={onNodeClick}
			fitView
			minZoom={0.1}
			maxZoom={2}
			elementsSelectable={true}
			nodesDraggable={true}
			nodesConnectable={false}
		>
			<Background gap={20} />
		</SvelteFlow>
	{/if}
</div>
