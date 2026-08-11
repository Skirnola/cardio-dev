export type UseCompareSelectionResult = {
  readonly selectedIds: readonly string[];
  readonly toggleSelected: (id: string) => void;
  readonly clearSelected: () => void;
  readonly isSelected: (id: string) => boolean;
};

export function useCompareSelection(_initialIds: readonly string[] = []): UseCompareSelectionResult {
  throw new Error("Not implemented");
}
