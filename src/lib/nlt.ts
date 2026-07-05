// NLT (the internal "Trust & IP Holder") is internal-only and must never surface
// in any list, map, or Present view. Shared filter for data rows across modules.
export const NLT_PATTERN = /\bNLT\b/i;

export function isNlt(value: string | undefined | null): boolean {
  return NLT_PATTERN.test(value ?? "");
}
