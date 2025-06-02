import { analyzeProject } from "$lib/server/services/tsAnalysisService";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ url }) => {
	const projectPath = url.searchParams.get("projectPath");
	if (!projectPath) {
		error(400, "No projectPath provided");
	}
	const project = analyzeProject(projectPath);
	if (!project) {
		error(500, "Failed to analyze project");
	}
	return json(project);
};
