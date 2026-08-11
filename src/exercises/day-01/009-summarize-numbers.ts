export type NumberSummary = {
  count: number;
  sum: number;
  min: number | undefined;
  max: number | undefined;
};

export function summarizeNumbers(values: number[]): NumberSummary {
  throw new Error("Not implemented");
}
