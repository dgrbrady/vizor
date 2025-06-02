# **Data Model for Interactive Code Visualization and REPL Environment**

## **1. Introduction**

This document defines the comprehensive data model for the "Interactive Code Visualization and REPL Environment" project. It outlines all primary data entities, their attributes, data types, constraints, and inter-relationships. This model is designed to support all features described in the Implementation_Plan.md, including code structure analysis, dependency visualization, REPL state management, debugging, and external system representation.

## **2. Core Entities**

### **2.1. Project**

- **Purpose:** Represents the root of the user's codebase being analyzed.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the project.
  - name: string \- User-defined name for the project (e.g., directory name).
  - rootPath: string (Required) \- Absolute file system path to the project's root directory on the server.
  - createdAt: datetime (Required) \- Timestamp of when the project was first analyzed.
  - lastAnalyzedAt: datetime \- Timestamp of when the project was last analyzed.
- **Relationships:**
  - Has one-to-many DirectoryNodes (representing top-level directories in the project).
  - Has one-to-many FileNodes (representing top-level files in the project).

### **2.2. DirectoryNode**

- **Purpose:** Represents a directory within the project structure.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the directory.
  - projectId: string (Foreign Key referencing Project.id, Required) \- ID of the project this directory belongs to.
  - parentId: string (Foreign Key referencing DirectoryNode.id, Nullable) \- ID of the parent directory (null if it's a root directory within the project).
  - name: string (Required) \- Name of the directory.
  - path: string (Required, Unique within project) \- Relative path from the project root.
  - createdAt: datetime (Required) \- Timestamp of creation.
  - viz_posX: number (Nullable) \- X position for visualization.
  - viz_posY: number (Nullable) \- Y position for visualization.
  - viz_isExpanded: boolean (Default: false) \- Visual state for UI.
- **Relationships:**
  - Belongs to one Project.
  - Can have one parent DirectoryNode (many-to-one).
  - Can contain many child DirectoryNodes (one-to-many, self-referencing).
  - Can contain many FileNodes (one-to-many).

### **2.3. FileNode (also represents a Module)**

- **Purpose:** Represents a file within the project, typically a source code file (e.g., .ts, .js). It also serves as the representation of a module.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the file.
  - projectId: string (Foreign Key referencing Project.id, Required) \- ID of the project this file belongs to.
  - directoryId: string (Foreign Key referencing DirectoryNode.id, Nullable) \- ID of the directory containing this file (null if in project root).
  - name: string (Required) \- Name of the file (e.g., utils.ts).
  - path: string (Required, Unique within project) \- Relative path from the project root.
  - language: string (Enum: typescript, javascript, json, other) \- Detected language of the file.
  - contentHash: string (Nullable) \- Hash of the file content to detect changes.
  - lastParsedAt: datetime (Nullable) \- Timestamp of when the file was last successfully parsed.
  - createdAt: datetime (Required) \- Timestamp of creation.
  - viz_posX: number (Nullable) \- X position for visualization.
  - viz_posY: number (Nullable) \- Y position for visualization.
- **Relationships:**
  - Belongs to one Project.
  - Belongs to one DirectoryNode (if not in project root).
  - Contains many CodeConstructs (one-to-many).
  - Can have many outgoing ImportLinks (one-to-many).
  - Can have many incoming ImportLinks (one-to-many, from other files importing this one).
  - Can have many ExportLinks (one-to-many).

### **2.4. CodeConstruct (Base Entity)**

- **Purpose:** A base representation for various structural elements within a source code file (e.g., functions, classes, variables). Specific types will inherit from this.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the code construct.
  - fileId: string (Foreign Key referencing FileNode.id, Required) \- ID of the file containing this construct.
  - constructType: string (Enum: FunctionDefinition, ClassDefinition, VariableDeclaration, InterfaceDefinition, TypeAliasDefinition, EnumDefinition, GenericConstruct, Required) \- The specific type of code construct.
  - name: string (Nullable) \- Name of the construct (e.g., function name, class name). Anonymous constructs might not have a name.
  - startLine: number (Required) \- Starting line number in the source file.
  - startColumn: number (Required) \- Starting column number in the source file.
  - endLine: number (Required) \- Ending line number in the source file.
  - endColumn: number (Required) \- Ending column number in the source file.
  - jsDocRaw: string (Nullable) \- Raw JSDoc comment block associated with this construct.
  - parentId: string (Foreign Key referencing CodeConstruct.id, Nullable) \- For nested constructs (e.g. method within a class).
- **Relationships:**
  - Belongs to one FileNode.
  - Can have one parent CodeConstruct (many-to-one, self-referencing for nesting).
  - Can have many child CodeConstructs (one-to-many, self-referencing).
  - Can be linked to many ExternalSystemLinks (one-to-many).

#### **2.4.1. FunctionDefinition (inherits/extends CodeConstruct)**

- **Purpose:** Represents a function or method definition.
- **Specific Attributes:**
  - isAsync: boolean (Default: false)
  - isGenerator: boolean (Default: false)
  - parameters: array of object (e.g., { name: string, type: string, isOptional: boolean }) \- List of parameters.
  - returnType: string (Nullable) \- Return type of the function.

#### **2.4.2. ClassDefinition (inherits/extends CodeConstruct)**

- **Purpose:** Represents a class definition.
- **Specific Attributes:**
  - constructorDef: object (Nullable, similar to FunctionDefinition structure) \- Details of the constructor.
  - extendsClass: string (Nullable) \- Name of the class it extends.
  - implementsInterfaces: array of string (Nullable) \- Names of interfaces it implements.

#### **2.4.3. VariableDeclaration (inherits/extends CodeConstruct)**

- **Purpose:** Represents a variable, constant, or property declaration.
- **Specific Attributes:**
  - declarationType: string (Enum: var, let, const, property, enumMember)
  - dataType: string (Nullable) \- Inferred or declared type of the variable.
  - initializer: string (Nullable) \- String representation of the initial value, if any.

#### **2.4.4. InterfaceDefinition (inherits/extends CodeConstruct)**

- **Purpose:** Represents an interface definition.
- **Specific Attributes:**
  - extendsInterfaces: array of string (Nullable) \- Names of interfaces it extends.

#### **2.4.5. TypeAliasDefinition (inherits/extends CodeConstruct)**

- **Purpose:** Represents a type alias definition.
- **Specific Attributes:**
  - aliasedType: string (Required) \- The type definition string.

#### **2.4.6. EnumDefinition (inherits/extends CodeConstruct)**

- **Purpose:** Represents an enum definition.
- **Specific Attributes:**
  - (Members are typically VariableDeclarations with declarationType: 'enumMember' linked via parentId)

### **2.5. ImportLink**

- **Purpose:** Represents an import relationship between two files/modules.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the import link.
  - importingFileId: string (Foreign Key referencing FileNode.id, Required) \- The file that contains the import statement.
  - importedFileId: string (Foreign Key referencing FileNode.id, Nullable) \- The file being imported (if resolved within the project).
  - moduleSpecifier: string (Required) \- The original string used in the import statement (e.g., './utils', 'lodash').
  - resolvedPath: string (Nullable) \- Absolute path if the module specifier is resolved to a file within the project.
  - isExternal: boolean (Computed, Default: false) \- True if importedFileId is null and moduleSpecifier refers to an external package.
  - importedConstructs: array of object (e.g., { name: string, alias?: string }) \- Specific named imports.
  - startLine: number (Required) \- Line number of the import statement.
  - startColumn: number (Required) \- Column number of the import statement.
- **Relationships:**
  - Many-to-one with FileNode (as importingFileId).
  - Many-to-one with FileNode (as importedFileId, if internal).

### **2.6. ExportLink**

- **Purpose:** Represents an export statement from a file/module.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the export link.
  - exportingFileId: string (Foreign Key referencing FileNode.id, Required) \- The file that contains the export statement.
  - exportedConstructId: string (Foreign Key referencing CodeConstruct.id, Nullable) \- The specific code construct being exported, if a named export directly linked to a construct.
  - exportedName: string (Required) \- The name under which the construct is exported (e.g., myFunction, default).
  - sourceFileForReExport: string (Nullable) \- If it's a re-export (e.g., export \* from './other'), this stores './other'.
  - isDefaultExport: boolean (Default: false)
  - startLine: number (Required) \- Line number of the export statement.
  - startColumn: number (Required) \- Column number of the export statement.
- **Relationships:**
  - Many-to-one with FileNode (as exportingFileId).
  - Many-to-one with CodeConstruct (as exportedConstructId, if applicable).

### **2.7. REPLSession**

- **Purpose:** Represents an active REPL session.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the REPL session.
  - projectId: string (Foreign Key referencing Project.id, Nullable) \- The project context for this REPL session, if any.
  - createdAt: datetime (Required) \- Timestamp of when the session was started.
  - lastActivityAt: datetime (Required) \- Timestamp of the last interaction.
  - status: string (Enum: active, closed, error, Default: active)
  - environmentVariables: object (Nullable) \- Key-value pairs of environment variables for the session.
- **Relationships:**
  - Optionally belongs to one Project.
  - Has many REPLHistoryEntrys (one-to-many).

### **2.8. REPLHistoryEntry**

- **Purpose:** Represents a single command executed in a REPL session and its output.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the history entry.
  - sessionId: string (Foreign Key referencing REPLSession.id, Required) \- ID of the REPL session this entry belongs to.
  - timestamp: datetime (Required) \- Timestamp of when the command was executed.
  - command: string (Required) \- The code/command input by the user.
  - output: string (Nullable) \- stdout from the command.
  - errorOutput: string (Nullable) \- stderr from the command.
  - result: string (Nullable) \- String representation of the command's return value.
  - executionTimeMs: number (Nullable) \- Time taken to execute the command.
- **Relationships:**
  - Belongs to one REPLSession.

### **2.9. Breakpoint**

- **Purpose:** Represents a breakpoint set by the user for debugging.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the breakpoint.
  - fileId: string (Foreign Key referencing FileNode.id, Required) \- The file where the breakpoint is set.
  - lineNumber: number (Required) \- The line number in the file.
  - columnNumber: number (Nullable) \- The column number (for more precise breakpoints).
  - condition: string (Nullable) \- Conditional expression for the breakpoint.
  - logMessage: string (Nullable) \- Message to log when breakpoint is hit (if not pausing).
  - isEnabled: boolean (Default: true)
  - createdAt: datetime (Required)
- **Relationships:**
  - Belongs to one FileNode.
  - Can be associated with a REPLSession implicitly if set during a REPL debugging context.

### **2.10. ExecutionStep**

- **Purpose:** Represents a specific point of execution during debugging (e.g., when paused at a breakpoint or after a step).
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the execution step.
  - replSessionId: string (Foreign Key referencing REPLSession.id, Required) \- The REPL session this execution step belongs to.
  - timestamp: datetime (Required) \- Timestamp when this execution state was captured.
  - fileId: string (Foreign Key referencing FileNode.id, Required) \- The file where execution is paused.
  - lineNumber: number (Required) \- The current line number.
  - columnNumber: number (Nullable) \- The current column number.
  - reason: string (Enum: breakpoint, step, exception, pause) \- Why execution paused.
- **Relationships:**
  - Belongs to one REPLSession.
  - Refers to one FileNode.
  - Has many CallStackFrames (one-to-many, ordered).
  - Has many ScopeVariables (one-to-many, representing variables in the current top frame's scope).

### **2.11. CallStackFrame**

- **Purpose:** Represents a single frame in the call stack at an ExecutionStep.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the call stack frame.
  - executionStepId: string (Foreign Key referencing ExecutionStep.id, Required) \- The execution step this frame belongs to.
  - frameOrder: number (Required) \- Order in the call stack (0 is top).
  - functionName: string (Nullable) \- Name of the function for this frame.
  - fileId: string (Foreign Key referencing FileNode.id, Required) \- File associated with this frame.
  - lineNumber: number (Required) \- Line number in the file for this frame.
  - columnNumber: number (Nullable) \- Column number.
- **Relationships:**
  - Belongs to one ExecutionStep.
  - Refers to one FileNode.

### **2.12. ScopeVariable**

- **Purpose:** Represents a variable within a specific scope (e.g., local, closure, global) at an ExecutionStep.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the scope variable.
  - executionStepId: string (Foreign Key referencing ExecutionStep.id, Required) \- The execution step this variable belongs to.
  - callStackFrameId: string (Foreign Key referencing CallStackFrame.id, Nullable) \- If specific to a frame, otherwise general to the step.
  - scopeType: string (Enum: local, closure, global, block, catch) \- Type of scope.
  - name: string (Required) \- Name of the variable.
  - value: string (Required) \- String representation of the variable's value.
  - dataType: string (Nullable) \- Type of the variable (e.g., string, number, object).
- **Relationships:**
  - Belongs to one ExecutionStep.
  - Optionally belongs to one CallStackFrame.

### **2.13. ExternalSystemNode**

- **Purpose:** Represents an external system or service (e.g., S3 bucket, Lambda function, API) that the codebase interacts with, typically identified via JSDoc tags.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the external system node.
  - projectId: string (Foreign Key referencing Project.id, Required) \- Project this definition belongs to.
  - name: string (Required) \- User-defined or parsed name of the external system (e.g., "UserAuth API", "Primary S3 Bucket").
  - type: string (Required, e.g., S3, Lambda, APIGateway, SQS, Database, GenericAPI) \- Type of external system.
  - description: string (Nullable) \- Description parsed from JSDoc or user-provided.
  - properties: object (Nullable) \- Key-value pairs for additional properties (e.g., region, bucket name).
  - viz_posX: number (Nullable) \- X position for visualization.
  - viz_posY: number (Nullable) \- Y position for visualization.
- **Relationships:**
  - Belongs to one Project.
  - Can be linked by many ExternalSystemLinks (one-to-many).

### **2.14. ExternalSystemLink**

- **Purpose:** Represents a directed link from a CodeConstruct within the project to an ExternalSystemNode, indicating an interaction or dependency.
- **Attributes:**
  - id: string (UUID, Primary Key, Unique) \- Unique identifier for the link.
  - sourceConstructId: string (Foreign Key referencing CodeConstruct.id, Required) \- The code construct that initiates the interaction.
  - targetSystemId: string (Foreign Key referencing ExternalSystemNode.id, Required) \- The external system being interacted with.
  - interactionType: string (Nullable, e.g., read, write, invoke, publish, subscribe) \- Nature of the interaction.
  - description: string (Nullable) \- Description of the link/interaction from JSDoc.
- **Relationships:**
  - Many-to-one with CodeConstruct (source).
  - Many-to-one with ExternalSystemNode (target).

## **3\. General Design Considerations**

- **Identifiers (id):** All primary entities use a string UUID for their id. This ensures global uniqueness and simplifies database management and API design.
- **Timestamps:** createdAt, lastAnalyzedAt, timestamp, etc., are crucial for tracking changes, caching, and history. These should be stored in UTC.
- **Extensibility:**
  - The use of CodeConstruct as a base entity with specific types allows for new code structures to be added more easily.
  - ExternalSystemNode.properties (object/JSONB type) allows for flexible storage of system-specific attributes without altering the schema.
  - Enum types (constructType, language, scopeType, etc.) can be expanded as needed.
- **Nullability:** Attributes are marked as Nullable where appropriate to allow for flexibility (e.g., parentId for root nodes, importedFileId for external imports). Required fields are essential for the integrity of the entity.
- **Visualization Attributes (viz\_ prefix):** Attributes like viz_posX, viz_posY, viz_isExpanded are included directly in relevant entities (DirectoryNode, FileNode, ExternalSystemNode) to store layout information persisted by the visualization component. This simplifies state management for the graph.
- **Relationships and Cardinality:** Described textually for each entity. Foreign keys are specified to enforce referential integrity where applicable.
- **Data Flow:** This model is designed to support the flow of data from static analysis (populating Project, DirectoryNode, FileNode, CodeConstruct, ImportLink, ExportLink, ExternalSystemNode, ExternalSystemLink) to REPL interactions (REPLSession, REPLHistoryEntry) and debugging (Breakpoint, ExecutionStep, CallStackFrame, ScopeVariable).

## **4\. Future Considerations / Potential Enhancements**

- **User Accounts/Authentication:** If multi-user support is added, entities would need to be scoped by userId.
- **Project Versioning/Snapshots:** For tracking changes over time or allowing rollback.
- **More Granular Code Constructs:** Depending on analysis depth, more specific CodeConstruct types might be needed (e.g., Decorator, JsxElement).
- **Type System Information:** More detailed storage of resolved type information from TypeScript for richer analysis.
- **Configuration Entity:** A dedicated entity for storing user preferences or project-specific settings for the tool.

This data model provides a solid foundation for the "Interactive Code Visualization and REPL Environment" project. It will be refined as needed during development.
