export type CatalogFilterProduct = {
  readonly id: string;
  readonly name: string;
  readonly featured: boolean;
};

export type UseCatalogFiltersResult = {
  readonly query: string;
  readonly setQuery: (nextQuery: string) => void;
  readonly onlyFeatured: boolean;
  readonly toggleOnlyFeatured: () => void;
  readonly visibleProducts: readonly CatalogFilterProduct[];
};

export function useCatalogFilters(_products: readonly CatalogFilterProduct[]): UseCatalogFiltersResult {
  throw new Error("Not implemented");
}
