import type { ReactElement } from 'react';

export type AsyncProduct = {
  readonly id: string;
  readonly name: string;
};

export type AsyncProductListProps = {
  readonly loadProducts: () => Promise<readonly AsyncProduct[]>;
};

export function AsyncProductList(_props: AsyncProductListProps): ReactElement {
  throw new Error("Not implemented");
}
