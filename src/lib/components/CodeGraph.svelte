<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { SvelteFlow, Position, MarkerType, Background } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';

	// --- Interfaces based on Data_Model.md / tsAnalysisService.ts output ---
	// These should ideally be in a shared types file, e.g., $lib/types/project.ts
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
	let nodes = $state.raw<Node[]>([]);
	let edges = $state.raw<Edge[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// --- Data Fetching and Processing ---
	$effect(() => {
		// This effect will run once after the component is first rendered, similar to onMount for initial data load.
		// If projectPath were a reactive prop, this effect would re-run when it changes.
		async function fetchData() {
			isLoading = true;
			error = null;
			try {
				// The User needs to ensure this API endpoint is working and serves ProjectStructureData.
				// For now, using a hardcoded example path for the API call.
				const response = await fetch('/api/project-structure?projectPath=./test-project');
				if (!response.ok) {
					throw new Error(`Failed to fetch project structure: ${response.statusText}`);
				}
				const projectData: ProjectStructureData = await response.json();
				transformDataToGraph(projectData);
			} catch (e: any) {
				console.error('Error fetching project structure:', e);
				error = e.message || 'An unknown error occurred.';
			} finally {
				isLoading = false;
			}
		}

		fetchData();

		return () => {
			// Cleanup logic if needed when the component is destroyed or effect re-runs
			// For a simple one-time fetch, this might not be necessary
		};
	});

	function transformDataToGraph(projectData: ProjectStructureData | null) {
		if (!projectData) {
			nodes = [];
			edges = [];
			return;
		}

		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];
		let yOffset = 0;
		const xSpacing = 200;
		const ySpacing = 100;

		function processDirectory(
			dir: DirectoryNodeData,
			parentNodeId: string | null,
			currentX: number,
			depth: number
		) {
			newNodes.push({
				id: dir.id,
				type: 'default',
				data: { label: dir.name, type: 'directory' },
				position: { x: currentX, y: yOffset },
				sourcePosition: Position.Right,
				targetPosition: Position.Left,
				class: 'border-2 border-blue-500 bg-blue-100 p-2 rounded-md shadow-lg',
				style: 'width: 150px; text-align: center;'
			});
			yOffset += ySpacing;

			if (parentNodeId && dir.parentId === parentNodeId) {
				// Check if dir.parentId matches the processing parent's ID
				// This condition was `if (dir.parentId)` before.
				// For the root node, `dir.parentId` is `null`. `parentNodeId` would also be `null` in the initial call.
				// The crucial part is `dir.parentId` being the ID of the actual parent node in the graph.
				// So, an edge is from `dir.parentId` to `dir.id`.
				if (dir.parentId) {
					// Ensures we only create edges for non-root directories to their explicit parents
					newEdges.push({
						id: `e-${dir.parentId}-${dir.id}`,
						source: dir.parentId,
						target: dir.id,
						markerEnd: { type: MarkerType.ArrowClosed }
					});
				}
			}

			let childXOffset =
				currentX -
				((dir.childDirectoryNodes.length + dir.childFileNodes.length - 1) * xSpacing) / 2;

			dir.childDirectoryNodes.forEach((childDir) => {
				processDirectory(childDir, dir.id, childXOffset, depth + 1);
				childXOffset += xSpacing;
			});

			const initialFileYOffset = yOffset; // Store yOffset before processing files to align them horizontally if needed

			dir.childFileNodes.forEach((file) => {
				newNodes.push({
					id: file.id,
					type: 'default',
					data: { label: file.name, type: 'file' },
					position: { x: childXOffset, y: initialFileYOffset },
					sourcePosition: Position.Right,
					targetPosition: Position.Left,
					class: 'border-2 border-green-500 bg-green-100 p-2 rounded-md shadow',
					style: 'width: 150px; text-align: center;'
				});
				newEdges.push({
					id: `e-${dir.id}-${file.id}`,
					source: dir.id,
					target: file.id,
					markerEnd: { type: MarkerType.ArrowClosed }
				});
				childXOffset += xSpacing;
			});
			if (dir.childFileNodes.length > 0) {
				yOffset = initialFileYOffset + ySpacing; // Move yOffset down after all files in the current directory are placed
			}
		}

		if (projectData.rootDirectory) {
			processDirectory(projectData.rootDirectory, null, 0, 0);
		}

		// Update $state variables
		nodes = newNodes;
		edges = newEdges;
	}
</script>

<div style="height: 100vh; width: 100%;" class="bg-gray-50">
	{#if isLoading}
		<p class="p-4 text-center text-gray-500">Loading project structure...</p>
	{:else if error}
		<p class="p-4 text-center text-red-500">Error: {error}</p>
	{:else if nodes.length === 0}
		<p class="p-4 text-center text-gray-500">
			No project structure data to display. Ensure the API endpoint is working and returns data.
		</p>
	{:else}
		<SvelteFlow bind:nodes bind:edges fitView>
			<Background />
		</SvelteFlow>
	{/if}
</div>
