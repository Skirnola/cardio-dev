import type { ReactElement } from 'react';

export type InventoryRecord = {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly category: string;
  readonly featured: boolean;
  readonly updatedAt: string;
};

export type InventoryTableProps = {
  readonly records: readonly InventoryRecord[];
};

export function InventoryTable(_props: InventoryTableProps): ReactElement {
  throw new Error("Not implemented");
}
