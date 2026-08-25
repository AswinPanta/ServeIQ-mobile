/**
 * Launch-path instrumentation.
 * Logs time since module load to pinpoint startup bottlenecks.
 * Gated behind __DEV__ — silent in production builds.
 */
const T0 = Date.now();

function log(msg: string): void {
  // eslint-disable-next-line no-console
  console.log(msg);
}

export function mark(name: string): void {
  if (!__DEV__) return;
  log(`[perf] +${Date.now() - T0}ms ${name}`);
}

export function markStart(name: string): void {
  if (!__DEV__) return;
  log(`[perf] +${Date.now() - T0}ms START ${name}`);
}

export function markEnd(name: string): void {
  if (!__DEV__) return;
  log(`[perf] +${Date.now() - T0}ms END   ${name}`);
}
