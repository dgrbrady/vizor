# Implementation Plan

Project Goal: Develop a SvelteKit-based web application that combines interactive code visualization (inspired by the C4 model) with a REPL environment for any TypeScript/JavaScript project, enabling developers to explore, understand, and dynamically interact with code.

## General Project Notes

**Memory Bank System:**
Based on the project's phased structure (8 phases) and multiple complex tasks, a multi-file Memory Bank system has been agreed upon. This will involve:

1.  A root directory named `Memory/`.
2.  Inside `Memory/`, a `README.md` file explaining the structure.
3.  Subdirectories within `Memory/` corresponding to each Phase (e.g., `Memory/Phase_1_Core_Project_Setup_Static_Code_Analysis_Foundation/`).
4.  Within each phase subdirectory, individual Markdown log files for key tasks (e.g., `Task_1.1_SvelteKit_Setup_Log.md`).
    This structure adheres to `apm/prompts/01_Manager_Agent_Core_Guides/02_Memory_Bank_Guide.md`.

---

## Phase 1: Core Project Setup & Static Code Analysis Foundation - Agent Group: Setup_Analysis (Agent_System_Architect, Agent_Svelte_Setup, Agent_TS_Analysis)

Objective: Define the comprehensive data model for the entire application, establish the SvelteKit project, integrate the TypeScript Compiler API, and develop the initial capability to parse a target JavaScript/TypeScript project to extract basic structural information.

### Task 1.0 - Agent_System_Architect: Comprehensive Data Model Design

Objective: Define the complete data model that will underpin the entire application, covering code structure, dependencies, REPL state, debugging information, and external system representations.

1.  Identify Core Entities.
    - List all primary data entities required across all planned phases (e.g., Project, Directory, File, Module, Function, Class, ImportExportLink, REPLSession, Breakpoint, ExecutionStep, ExternalSystemNode).
2.  Define Attributes and Relationships for Each Entity.
    - For each entity, specify its attributes, data types, and constraints.
    - Define relationships between entities (e.g., one-to-many, many-to-many, parent-child).
    * Guidance: Consider how data will flow between the TypeScript analysis backend, the visualization frontend, the REPL, and the debugging components.
3.  Design for Extensibility.
    - Ensure the data model can accommodate future enhancements or slight pivots in requirements with minimal disruption.
4.  Document the Data Model.
    - Create a clear document (e.g., a section in this plan, or a separate `Data_Model.md` referenced here) detailing all entities, attributes, and relationships.
    * Guidance: Use diagrams (e.g., ERD-like sketches) and clear descriptions. This document will be a key reference for all subsequent development tasks.
    - This model should inform the initial data model for parsed code structure in Task 1.2 and be referred to in subsequent phases.

### Task 1.1 - Agent_Svelte_Setup: Initial SvelteKit Project Setup

Objective: Create and configure the foundational SvelteKit application.

1.  Initialize SvelteKit Project.
    - Use the latest SvelteKit CLI command (e.g., `npm create svelte@latest my-app`).
    - Select appropriate options (e.g., TypeScript, ESLint, Prettier, Playwright for testing if desired early).
    * Guidance: Ensure Svelte 5 is used if available through CLI options, or plan for manual upgrade if necessary.
2.  Integrate TailwindCSS.
    - Follow the official SvelteKit + TailwindCSS integration guide.
    - Configure `tailwind.config.js` and `postcss.config.js`.
    - Create a basic `app.html` and `+layout.svelte` with Tailwind base styles.
3.  Basic Project Structure and Configuration.
    - Organize `src/lib` for components, services, types.
    - Set up path aliases in `svelte.config.js` and `tsconfig.json` (e.g., `$lib/`, `$components/`).
    - Implement a basic global layout component (`+layout.svelte`).
    - Create a simple placeholder home page (`+page.svelte`).

### Task 1.2 - Agent_TS_Analysis: TypeScript Compiler API Integration & Basic Parsing

Objective: Integrate the TypeScript Compiler API to analyze a target project and extract its file/directory structure, adhering to the defined comprehensive data model from Task 1.0.

1.  Develop TypeScript Analysis Service.
    - Create a new service/module (e.g., `src/lib/server/services/tsAnalysisService.ts`) to encapsulate TS Compiler API logic.
    * Guidance: This service will run on the SvelteKit backend/server-side.
2.  Implement Project Loading Functionality.
    - Add a mechanism (e.g., an API endpoint called by the frontend) to specify a target project's root directory path on the server.
    * Guidance: For initial local development, this could be a hardcoded path or an environment variable, with plans for user input later.
    - Use TS Compiler API (`ts.createProgram` or similar) to load and analyze the specified project.
3.  Extract File and Directory Structure.
    - Traverse the source files of the loaded program (`program.getSourceFiles()`).
    - Identify unique directories and files.
    - Create an initial data model/interface to represent this structure (e.g., `interface ProjectNode { path: string; type: 'file' | 'directory'; children?: ProjectNode[]; }`), ensuring it is a subset or initial implementation of the comprehensive model defined in Task 1.0.
    * Guidance: Focus on a hierarchical representation.
4.  Expose Parsed Structure via API.
    - Create a SvelteKit API endpoint (e.g., `GET /api/project-structure?path=/path/to/project`) that uses the `tsAnalysisService` to get the structure and returns it as JSON.

---

## Phase 2: Basic Visualization Layer - Agent Group: Frontend_Viz (Agent_Svelte_Viz)

Objective: Implement the first layer of visualization using `@xyflow/svelte`, displaying the parsed directory and file structure as an interactive graph, based on the comprehensive data model.

### Task 2.1 - Agent_Svelte_Viz: @xyflow/svelte Integration & Initial Graph Display

Objective: Integrate the graph visualization library and display the basic project structure.

1.  Install and Configure @xyflow/svelte.
    - Add `@xyflow/svelte` package to the project.
    - Import necessary styles for the SvelteFlow component.
2.  Create Graph Visualization Component.
    - Develop a Svelte component (e.g., `src/lib/components/CodeGraph.svelte`) that uses `<SvelteFlow>`.
    - Fetch project structure data from the `/api/project-structure` endpoint created in Task 1.2.
3.  Transform Project Data to Graph Nodes and Edges.
    - Write logic to convert the hierarchical project structure (from Task 1.2, adhering to the model from Task 1.0) into an array of nodes (for files/directories) and edges (representing parent-child relationships) suitable for `@xyflow/svelte`.
    * Guidance: Initially, focus on simple nodes for directories and files. Edges will connect directories to their contents.
4.  Implement Basic Graph Interactivity.
    - Ensure default pan and zoom functionality of `@xyflow/svelte` is working.
    - Style nodes for directories and files distinctively.

### Task 2.2 - Agent_Svelte_Viz: Basic Drill-Down Functionality

Objective: Allow users to "drill down" into directory nodes to see their contents.

1.  Implement Node Click Handler.
    - Add event handling for node clicks within the `CodeGraph.svelte` component.
2.  Develop Drill-Down Logic.
    - When a directory node is clicked, update the graph to show its immediate children (files and sub-directories).
    * Guidance: This might involve fetching more detailed data for that subdirectory or filtering the existing dataset. Consider how to manage the state of "open" or "expanded" directories.
    - Implement a "go up" or "back" mechanism to navigate back to the parent directory view.
3.  Visual Cues for Expandable Nodes.
    - Provide visual indication on directory nodes that they can be expanded/drilled into.

---

## Phase 3: Enhanced Visualization - Dependencies & Relationships - Agent Group: Analysis_Viz (Agent_TS_Analysis, Agent_Svelte_Viz)

Objective: Enhance the visualization to show import/export dependencies between modules/files, consistent with the comprehensive data model.

### Task 3.1 - Agent_TS_Analysis: Extracting Import/Export Dependencies

Objective: Use the TypeScript Compiler API to identify import and export statements within files.

1.  Extend `tsAnalysisService`.
    - Add new functions to parse individual source files for `import` and `export` declarations.
    * Guidance: Use `ts.forEachChild` and check `node.kind` for `ts.SyntaxKind.ImportDeclaration`, `ts.SyntaxKind.ExportDeclaration`, etc.
2.  Resolve Module Specifiers.
    - For each import/export, attempt to resolve the module specifier (e.g., './utils', 'lodash') to an absolute path within the project or identify it as an external library.
    * Guidance: This is a complex step. Start with relative paths. `program.getResolvedModuleWithFailedLookupLocationsFromCache()` or similar might be useful.
3.  Update Data Model for Dependencies.
    - Ensure the dependency information (e.g., `ImportExportLink` entity from Task 1.0) is correctly populated. (e.g., `interface FileNode extends ProjectNode { imports: { source: string, resolvedPath?: string }[]; exports: { name: string }[]; }` - this specific interface might be superseded by the comprehensive model).
4.  Update API Endpoint.
    - Modify the `/api/project-structure` endpoint (or create a new one) to include this dependency information, structured according to the comprehensive data model.

### Task 3.2 - Agent_Svelte_Viz: Visualizing Dependencies as Edges

Objective: Display the identified import/export relationships as edges in the graph.

1.  (Agent_Svelte_Viz) Update Graph Data Transformation.
    - Modify the logic that converts project data to graph nodes/edges to include edges representing imports/exports.
    * Guidance: Edges should connect files that import/export from/to each other. Style these dependency edges differently from structural (parent-child) edges. Use information from the `ImportExportLink` entity.
2.  (Agent_Svelte_Viz) Implement Focus/Highlight Mode.
    - Allow users to select a file node and have its direct dependencies (imports and exports) highlighted or prominently displayed, potentially fading out unrelated nodes/edges.
3.  (Agent_TS_Analysis & Agent_Svelte_Viz) Consider Performance for Large Graphs.
    - Discuss and implement strategies for handling large numbers of nodes and edges if performance becomes an issue (e.g., virtualization, level-of-detail rendering).

---

## Phase 4: REPL Environment & Basic Interaction - Agent Group: Backend_REPL (Agent_Node_REPL, Agent_WebSocket)

Objective: Develop the backend WebSocket server and integrate a Node.js REPL. Implement basic capabilities for the user to execute simple JavaScript/TypeScript code snippets.

### Task 4.1 - Agent_WebSocket: SvelteKit WebSocket Server Setup

Objective: Establish real-time bidirectional communication.

1.  Implement SvelteKit WebSocket Handler.
    - Create a WebSocket server endpoint within SvelteKit (e.g., using `vite-plugin-svelte-kit-ws` or a custom adapter).
    * Guidance: Refer to SvelteKit documentation or community examples for setting up WebSockets.
2.  Define Basic Message Protocol.
    - Define simple JSON message types for communication (e.g., `{ type: 'execute_code', payload: 'console.log("hello")' }`, `{ type: 'execution_result', payload: 'hello' }`). Consider entities like `REPLSession` from Task 1.0.
3.  Frontend WebSocket Client.
    - Create a Svelte store or service on the frontend to manage the WebSocket connection and message handling.

### Task 4.2 - Agent_Node_REPL: Node.js REPL Integration (Backend)

Objective: Set up a sandboxed Node.js REPL instance on the server.

1.  Integrate Node.js `repl` Module.
    - In a backend SvelteKit server module, create an instance of the Node.js `repl.REPLServer`.
    * Guidance: Ensure this REPL instance is sandboxed or runs in a separate, controlled process for security. Consider using `vm2` or a similar sandboxing library.
2.  Pipe WebSocket Messages to REPL.
    - When an `execute_code` message is received via WebSocket, send the code payload to the REPL instance for execution.
3.  Capture REPL Output.
    - Capture stdout, stderr, and return values from the REPL execution.
    - Send these results back to the frontend via WebSocket using the defined message protocol.
    * Guidance: Handle asynchronous results and potential errors/exceptions gracefully.

### Task 4.3 - Agent_Svelte_Viz: Frontend REPL Interface

Objective: Create a UI for users to input code and see results.

1.  Develop REPL Input Component.
    - Create a Svelte component with a text area for code input and a submit button.
2.  Develop REPL Output Component.
    - Create a Svelte component to display formatted output (stdout, stderr, results) received from the backend.
3.  Connect UI to WebSocket Service.
    - On submit, send the input code via the WebSocket service.
    - Display results received via WebSocket.

---

## Phase 5: Project Code Interaction via REPL - Agent Group: REPL_Integration (Agent_Node_REPL, Agent_TS_Analysis)

Objective: Enable the REPL to import and interact with functions/modules from the user's analyzed project.

### Task 5.1 - Agent_Node_REPL: Module Resolution in REPL Context

Objective: Allow the backend REPL to resolve and import modules from the target project.

1.  Configure REPL's Module Paths.
    - When a target project is loaded (from Phase 1), configure the REPL's environment or use Node.js `module.createRequire()` to allow it to resolve `import` or `require` statements relative to the target project's root and `node_modules`.
    * Guidance: This is critical. The REPL needs to "see" the target project's files and dependencies.
2.  Handle ESM vs. CommonJS.
    - Investigate and implement robust handling for both ESM (`import`) and CommonJS (`require`) modules within the target project, as the REPL will need to bridge these if the target project uses ESM.
    * Guidance: Node.js has specific behaviors for this. Consider using dynamic `import()` for ESM.
3.  Security Considerations for Dynamic Loading.
    - Re-evaluate and reinforce sandboxing if user code can now directly import arbitrary project files.

### Task 5.2 - Agent_TS_Analysis & Agent_Node_REPL: Transpilation for REPL (If Necessary)

Objective: Transpile TypeScript code from the target project on-the-fly if the REPL executes JavaScript.

1.  (Agent_TS_Analysis) Develop On-the-Fly Transpilation Service.
    - If the REPL environment primarily executes JavaScript, create a service using `ts.transpileModule` or similar to transpile TypeScript code snippets or referenced TS files from the target project before execution in the REPL.
2.  (Agent_Node_REPL) Integrate Transpilation into REPL Workflow.
    - Before executing user code or imported project code in the REPL, pass it through the transpilation service if it's TypeScript.
    * Guidance: Manage source maps if full debugging fidelity is desired later.

---

## Phase 6: Debugging Capabilities - Agent Group: Debugging (Agent_Node_REPL, Agent_Svelte_Viz)

Objective: Integrate step-through debugging capabilities with breakpoints into the REPL.

### Task 6.1 - Agent_Node_REPL: Backend Debugging Logic

Objective: Implement core debugging functionalities on the server-side REPL.

1.  Integrate Node.js Inspector API.
    - Utilize the Node.js `inspector` module (`require('inspector')`) to enable debugging of the code executed in the REPL.
    * Guidance: This allows programmatic control over the V8 inspector.
2.  Implement Breakpoint Management.
    - Develop logic to set and clear breakpoints at specified lines in the (potentially transpiled) code being executed.
    - Store breakpoint information (potentially using the `Breakpoint` entity from Task 1.0).
3.  Implement Debugger Controls.
    - Expose functions to control execution: step over, step into, step out, continue.
    - These will be triggered by WebSocket messages from the frontend.
4.  Communicate Debugger State.
    - Send messages to the frontend about debugger state (e.g., paused, current line, call stack, variable scopes). This data should align with entities like `ExecutionStep` from Task 1.0.

### Task 6.2 - Agent_Svelte_Viz: Frontend Debugger Interface

Objective: Create UI elements for debugging.

1.  Breakpoint UI.
    - Allow users to set/clear breakpoints in their REPL input code or potentially by clicking on visualized code elements (future enhancement).
2.  Debugger Control Buttons.
    - Add buttons for step over, step into, step out, continue, resume.
3.  Display Debugger State.
    - Show current execution line (highlight in REPL input or linked visualization).
    - Display call stack.
    - Display local variables and scope information.
    * Guidance: This will require careful data structuring and UI design, drawing from the debugger state information.

---

## Phase 7: Real-Time Analysis & Visualization Link (Execution Path) - Agent Group: Full_Stack_Sync (Agent_Svelte_Viz, Agent_Node_REPL)

Objective: Link the REPL execution/debugging with the visualization, showing the execution path or currently active code elements in the graph.

### Task 7.1 - Agent_Node_REPL & Agent_Svelte_Viz: Tracking and Communicating Execution State

Objective: Send information from the debugger/REPL about the current execution point to the frontend.

1.  (Agent_Node_REPL) Emit Execution/Debug Events.
    - When the debugger pauses or steps, or when a function from the visualized project is called, emit WebSocket events containing information about the active file and line number/function name (align with `ExecutionStep` entity).
2.  (Agent_Svelte_Viz) Receive and Process Execution Events.
    - The frontend WebSocket client listens for these events.

### Task 7.2 - Agent_Svelte_Viz: Highlighting Active Code in Visualization

Objective: Visually indicate the current execution point on the code graph.

1.  Map Execution Point to Graph Node.
    - Develop logic to map the file/line or function information from the backend event to a specific node or element in the `@xyflow/svelte` graph.
2.  Implement Visual Highlighting.
    - Change the style (e.g., color, border, size) of the active node/edge in the graph.
    - Potentially draw an "execution path" if stepping through code.
    * Guidance: Ensure this is performant and doesn't clutter the UI excessively.

---

## Phase 8: JSDoc-Based External System Visualization (Nice-to-have) - Agent Group: Extensibility (Agent_TS_Analysis, Agent_Svelte_Viz)

Objective: Implement the feature to parse JSDoc tags for representing external systems, consistent with the `ExternalSystemNode` entity from Task 1.0.

### Task 8.1 - Agent_TS_Analysis: JSDoc Parsing for External System Tags

Objective: Extract custom metadata from JSDoc comments.

1.  Define Custom JSDoc Tags.
    - Specify a set of custom JSDoc tags (e.g., `@apm-external-system`, `@apm-connects-to`) and their expected value formats for describing external systems and their links to codebase elements.
2.  Extend `tsAnalysisService` for JSDoc.
    - Use the TypeScript Compiler API's JSDoc parsing capabilities (`ts.getJSDocTags`, `ts.JSDoc`) to find and extract information from these custom tags associated with functions, classes, or variables.
    * Guidance: Store this metadata, structured according to the `ExternalSystemNode` entity and its relationships from Task 1.0.
3.  Update API to Include JSDoc Metadata.
    - Modify the relevant API endpoint(s) to include this external system information.

### Task 8.2 - Agent_Svelte_Viz: Visualizing External Systems

Objective: Represent these external systems and their connections in the graph.

1.  Create New Node/Edge Types.
    - Design visual representations (nodes) for different types of external systems (e.g., S3 bucket, Lambda, external API) as defined by `ExternalSystemNode` types.
    - Design edges to represent connections from code elements to these external system nodes.
2.  Update Graph Data Transformation.
    - Incorporate the JSDoc-derived external system data into the graph nodes and edges.
3.  Display External Systems in Graph.
    - Render these new nodes and edges, ensuring they are visually distinct and clearly convey the relationships.

---

## Ongoing: UI/UX Refinement, Error Handling, Performance Optimization - Agent Group: All (All Agents)

Objective: Continuously improve the application's usability, stability, and responsiveness.

### Task X.1 - All Agents: Iterative UI/UX Improvements

Objective: Refine the user interface and experience based on testing and feedback.

1.  Gather User Feedback (Self-testing initially).
    - Regularly test the application from a user's perspective.
2.  Implement UI Enhancements.
    - Improve layout, styling, interactivity, and clarity of information.
    * Guidance: Focus on intuitive navigation and reducing cognitive load, aligning with the project's core philosophy.

### Task X.2 - All Agents: Robust Error Handling

Objective: Ensure the application handles errors gracefully.

1.  Identify Potential Error Cases.
    - For each feature, consider potential errors (e.g., invalid project path, parsing errors, REPL execution errors, API failures, WebSocket disconnections).
2.  Implement Graceful Error Handling.
    - Provide clear error messages to the user.
    - Prevent application crashes.
    - Log errors appropriately (server-side and potentially client-side for diagnostics).

### Task X.3 - All Agents: Performance Monitoring and Optimization

Objective: Ensure the application remains responsive, especially with large codebases.

1.  Identify Performance Bottlenecks.
    - Profile code analysis, graph rendering, and REPL execution.
2.  Implement Optimizations.
    - Optimize algorithms, data structures, and rendering techniques (e.g., memoization, virtualization, debouncing).
    * Guidance: Pay special attention to the TS Compiler API usage and `@xyflow/svelte` rendering with large datasets.

---

## Note on Handover Protocol

For long-running projects or situations requiring context transfer (e.g., exceeding LLM context limits, changing specialized agents), the APM Handover Protocol should be initiated. This ensures smooth transitions and preserves project knowledge. Detailed procedures are outlined in the framework guide:

`apm/prompts/01_Manager_Agent_Core_Guides/05_Handover_Protocol_Guide.md`

The current Manager Agent or the User should initiate this protocol as needed.
