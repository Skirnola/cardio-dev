import type { ReactElement } from 'react';

export type SearchableProduct = {
  readonly id: string;
  readonly name: string;
  readonly inStock: boolean;
};

export type SearchableProductListProps = {
  readonly products: readonly SearchableProduct[];
};

export function SearchableProductList(_props: SearchableProductListProps): ReactElement {
  throw new Error("Not implemented");
}
