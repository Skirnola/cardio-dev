export type ProductSearchResult = {
  readonly id: string;
  readonly name: string;
};

export type ProductSearch = (query: string) => Promise<readonly ProductSearchResult[]>;

export type UseDebouncedProductSearchResult = {
  readonly query: string;
  readonly setQuery: (nextQuery: string) => void;
  readonly results: readonly ProductSearchResult[];
  readonly loading: boolean;
  readonly error: string | null;
};

export function useDebouncedProductSearch(
  _searchProducts: ProductSearch,
  _delayMs = 300,
): UseDebouncedProductSearchResult {
  throw new Error("Not implemented");
}
