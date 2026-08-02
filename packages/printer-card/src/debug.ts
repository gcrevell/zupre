// Temporary bring-up logging while wiring up config -> entity resolution.
// Remove once the editor/card round-trip is confirmed working end-to-end.
export const log = (...args: unknown[]) => {
  // console.debug maps to DevTools' "Verbose" level, which is hidden by
  // default — console.log so it shows up without changing the console's
  // level filter.
  console.log('[printer-card]', ...args);
};
