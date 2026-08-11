import type { ReactElement } from 'react';

export type SortableCatalogProduct = {
  readonly id: string;
  readonly name: string;
};

export type SortableCatalogProps = {
  readonly products: readonly SortableCatalogProduct[];
};

export function SortableCatalog(_props: SortableCatalogProps): ReactElement {
  throw new Error("Not implemented");
}
