import { timeToolDeclaration, getCurrentTime } from "./timeTool";
import { weatherToolDeclaration, getCurrentWeather } from "./weatherTool";

// Central registry — add a new tool by declaring its schema + handler
// here ONLY. Nothing else in the app needs to know tools exist.
export const TOOL_DECLARATIONS = [timeToolDeclaration, weatherToolDeclaration];

const HANDLERS = {
  get_current_time: async () => getCurrentTime(),
  get_current_weather: async () => await getCurrentWeather(),
};

// Human-readable labels for the "EXECUTING" UI state (spec section 1).
export const TOOL_EXECUTING_LABELS = {
  get_current_time: "Checking the time...",
  get_current_weather: "Checking weather...",
};

export async function executeTool(name, args) {
  const handler = HANDLERS[name];
  if (!handler) return { error: `Unknown tool: ${name}` };
  try {
    return await handler(args || {});
  } catch (err) {
    return { error: err.message || "Tool execution failed" };
  }
}