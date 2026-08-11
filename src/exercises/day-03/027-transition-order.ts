export type OrderStatus = "draft" | "placed" | "shipped" | "cancelled";

export type Order = {
  readonly id: string;
  readonly status: OrderStatus;
  readonly notes: readonly string[];
  readonly shippedAt: string | null;
};

export type OrderEvent =
  | { readonly type: "place" }
  | { readonly type: "ship"; readonly shippedAt: string }
  | { readonly type: "cancel" }
  | { readonly type: "note"; readonly note: string };

export function transitionOrder(order: Order, event: OrderEvent): Order {
  throw new Error("Not implemented");
}
