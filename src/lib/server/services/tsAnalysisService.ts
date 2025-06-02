import ts from "typescript";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid"; // For generating UUIDs

// --- Interfaces based on Data_Model.md (subset for this task) ---

interface FileNodeData {
  id: string;
  name: string;
  path: string; // Relative to project root
  language: "typescript" | "javascript" | "json" | "svelte" | "other";
  createdAt: string; // ISO string
  directoryId: string | null; // UUID of parent DirectoryNode, or null if in project root
}

interface DirectoryNodeData {
  id: string;
  name: string;
  path: string; // Relative to project root
  parentId: string | null; // UUID of parent DirectoryNode, or null if top-level
  createdAt: string; // ISO string
  childFileNodes: FileNodeData[];
  childDirectoryNodes: DirectoryNodeData[];
}

interface ProjectStructureData {
  id: string;
  name: string;
  rootPath: string; // Absolute path provided to analyzeProject
  createdAt: string; // ISO string
  // For simplicity in this task, top-level files/dirs are directly in the root DirectoryNode
  // or we can represent the project itself as the root conceptual directory.
  // Let's create a single root DirectoryNodeData that represents the project's root.
  rootDirectory: DirectoryNodeData;
}

// --- Helper Functions ---

function getFileLanguage(filePath: string): FileNodeData["language"] {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
    case ".mjs":
    case ".cjs":
      return "javascript";
    case ".json":
      return "json";
    case ".svelte":
      return "svelte";
    default:
      return "other";
  }
}

function ensureTrailingSlash(dirPath: string): string {
  return dirPath.endsWith(path.sep) ? dirPath : dirPath + path.sep;
}

// --- Main Analysis Function ---

export function analyzeProject(
  projectPath: string,
): ProjectStructureData | null {
  try {
    const absoluteProjectPath = path.resolve(projectPath);
    if (
      !fs.existsSync(absoluteProjectPath) ||
      !fs.lstatSync(absoluteProjectPath).isDirectory()
    ) {
      console.error(
        `Error: Project path ${absoluteProjectPath} does not exist or is not a directory.`,
      );
      return null;
    }

    const projectName = path.basename(absoluteProjectPath);
    const projectCreatedAt = new Date().toISOString();
    const projectRootId = uuidv4();

    // Compiler options
    const defaultCompilerOptions: ts.CompilerOptions = {
      allowJs: true,
      resolveJsonModule: true,
      esModuleInterop: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler, // Or NodeNext / Classic depending on typical project
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true, // We are only analyzing, not emitting
      // Include .svelte files if you want TS to be aware of them,
      // though for pure structure, fs traversal is primary.
      // For svelte, we'd need a preprocessor for TS to truly understand its script blocks.
      // Here, we'll just list them as files.
    };

    // Attempt to read tsconfig.json from the target project
    let compilerOptionsToUse = defaultCompilerOptions;
    const targetTsConfigPath = path.join(absoluteProjectPath, "tsconfig.json");
    if (fs.existsSync(targetTsConfigPath)) {
      const tsconfigContent = fs.readFileSync(targetTsConfigPath, "utf8");
      const parsedTsConfig = ts.parseConfigFileTextToJson(
        targetTsConfigPath,
        tsconfigContent,
      );
      if (parsedTsConfig.error) {
        console.warn(
          "Warning: Could not parse tsconfig.json from target project. Using defaults.",
          parsedTsConfig.error,
        );
      } else {
        const { options, errors } = ts.convertCompilerOptionsFromJson(
          parsedTsConfig.config.compilerOptions,
          absoluteProjectPath,
        );
        if (errors.length > 0) {
          console.warn(
            "Warning: Errors converting compiler options from target project tsconfig.json. Using defaults.",
            errors,
          );
        } else {
          compilerOptionsToUse = {
            ...defaultCompilerOptions,
            ...options,
            noEmit: true,
          };
        }
      }
    }

    // Collect all relevant files for the program (TS, JS, JSON)
    // For a robust solution, this should respect .gitignore and tsconfig include/exclude
    const filePathsForProgram: string[] = [];
    const collectedFiles: { filePath: string; stat: fs.Stats }[] = [];

    function collectFilesRecursively(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue; // Skip node_modules and hidden files/dirs
        }
        if (entry.isDirectory()) {
          collectFilesRecursively(fullPath);
        } else {
          // For program creation, only include files TS/JS can typically process.
          // For overall structure, we'll list all files later.
          if (/\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(entry.name)) {
            filePathsForProgram.push(fullPath);
          }
          collectedFiles.push({
            filePath: fullPath,
            stat: fs.statSync(fullPath),
          });
        }
      }
    }
    collectFilesRecursively(absoluteProjectPath);

    // Create the TS Program
    // Note: program.getSourceFiles() will only return files that are part of the compilation
    // according to tsconfig include/exclude and import chains from entry points.
    // If no entry points are given, and tsconfig has no files/include, it might be empty.
    // Giving all found files can be slow for large projects.
    // A common strategy is to use ts.findConfigFile and ts.parseJsonConfigFileContent
    // to get the file names as per the project's own tsconfig.

    // For this task, let's try creating a program with all found script/json files.
    // This might not be the most performant or accurate way for TS-specific analysis
    // but will give us a list of files TS is aware of.
    const program = ts.createProgram(filePathsForProgram, compilerOptionsToUse);
    const sourceFiles = program.getSourceFiles(); // Files TS processed

    // Build the hierarchical structure using fs traversal first for completeness
    // then enrich with program info if needed (though for this task, fs is enough for structure)

    const directoriesMap = new Map<string, DirectoryNodeData>();
    const filesMap = new Map<string, FileNodeData>();

    // Helper to build the tree
    function buildTree(
      currentPath: string,
      parentId: string | null,
    ): { files: FileNodeData[]; dirs: DirectoryNodeData[] } {
      const localFiles: FileNodeData[] = [];
      const localDirs: DirectoryNodeData[] = [];

      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }

        const fullEntryPath = path.join(currentPath, entry.name);
        const relativeEntryPath = path.relative(
          absoluteProjectPath,
          fullEntryPath,
        );
        const entryId = uuidv4();
        const createdAt = fs.statSync(fullEntryPath).birthtime.toISOString();

        if (entry.isDirectory()) {
          const dirNode: DirectoryNodeData = {
            id: entryId,
            name: entry.name,
            path: relativeEntryPath,
            parentId: parentId,
            createdAt: createdAt,
            childFileNodes: [],
            childDirectoryNodes: [],
          };
          const children = buildTree(fullEntryPath, entryId);
          dirNode.childFileNodes = children.files;
          dirNode.childDirectoryNodes = children.dirs;

          localDirs.push(dirNode);
          directoriesMap.set(relativeEntryPath, dirNode);
        } else {
          const fileNode: FileNodeData = {
            id: entryId,
            name: entry.name,
            path: relativeEntryPath,
            language: getFileLanguage(entry.name),
            createdAt: createdAt,
            directoryId: parentId,
          };
          localFiles.push(fileNode);
          filesMap.set(relativeEntryPath, fileNode);
        }
      }
      return { files: localFiles, dirs: localDirs };
    }

    const rootTree = buildTree(absoluteProjectPath, projectRootId);

    const rootDirectoryNode: DirectoryNodeData = {
      id: projectRootId,
      name: projectName,
      path: "", // Root path is empty relative to itself
      parentId: null,
      createdAt: fs.statSync(absoluteProjectPath).birthtime.toISOString(),
      childFileNodes: rootTree.files,
      childDirectoryNodes: rootTree.dirs,
    };

    const projectData: ProjectStructureData = {
      id: uuidv4(),
      name: projectName,
      rootPath: absoluteProjectPath,
      createdAt: projectCreatedAt,
      rootDirectory: rootDirectoryNode,
    };

    return projectData;
  } catch (error) {
    console.error("Error analyzing project:", error);
    return null;
  }
}

// Example Usage (for testing within this file if run directly, e.g. with ts-node)
/*
if (require.main === module) {
  const sampleProjectPath = './test-project'; // Adjust if needed
  // Ensure the test-project exists at this relative path or provide absolute
  if (!fs.existsSync(sampleProjectPath)) {
    console.error(`Test project path "${sampleProjectPath}" not found. Please create it.`);
    console.log('Expected structure:');
    console.log(`
    test-project/
    ├── src/
    │   ├── components/
    │   │   └── Button.svelte
    │   ├── services/
    │   │   └── api.ts
    │   └── app.ts
    ├── static/
    │   └── images/
    │       └── logo.png
    ├── package.json
    └── tsconfig.json
    `);
  } else {
    console.log(\`Analyzing project: \${path.resolve(sampleProjectPath)}...\`);
    const structure = analyzeProject(sampleProjectPath);
    if (structure) {
      console.log(JSON.stringify(structure, null, 2));
    } else {
      console.log("Failed to analyze project.");
    }
  }
}
*/
