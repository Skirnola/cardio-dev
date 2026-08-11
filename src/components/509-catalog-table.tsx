import type { ReactElement } from 'react';

export type CatalogRecord = {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly category: string;
  readonly priceCents: number;
  readonly featured: boolean;
  readonly inStock: boolean;
  readonly updatedAt: string;
};

export type CatalogTableProps = {
  readonly products: readonly CatalogRecord[];
};

export function CatalogTable(_props: CatalogTableProps): ReactElement {
  throw new Error("Not implemented");
}
