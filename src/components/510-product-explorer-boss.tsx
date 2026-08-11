import type { ReactElement } from 'react';

export type ExplorerProductRecord = {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly category: string;
  readonly priceCents: number;
  readonly featured: boolean;
  readonly inStock: boolean;
  readonly updatedAt: string;
};

export type ProductExplorerBossProps = {
  readonly searchProducts: (query: string) => Promise<readonly ExplorerProductRecord[]>;
};

export function ProductExplorerBoss(_props: ProductExplorerBossProps): ReactElement {
  throw new Error("Not implemented");
}
