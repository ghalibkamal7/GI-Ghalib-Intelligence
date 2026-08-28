// Time/date tool — the model calls this instead of guessing "today"
// from its training data, which would be wrong/stale.
export const timeToolDeclaration = {
  name: "get_current_time",
  description: "Get the current date, time, and the user's timezone. Always use this for any question about what time or date it is right now, or anything depending on 'today'/'now'/'tonight'.",
  parameters: { type: "OBJECT", properties: {} },
};

export function getCurrentTime() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    localTime: now.toLocaleTimeString(),
    localDate: now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}