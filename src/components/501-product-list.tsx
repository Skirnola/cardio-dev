import type { ReactElement } from 'react';

export type ProductListItem = {
  readonly id: string;
  readonly name: string;
  readonly priceCents: number;
  readonly inStock: boolean;
};

export type ProductListProps = {
  readonly products: readonly ProductListItem[];
};

export function ProductList(_props: ProductListProps): ReactElement {
  throw new Error("Not implemented");
}
