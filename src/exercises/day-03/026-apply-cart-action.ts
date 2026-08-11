export type CartItem = {
  readonly id: string;
  readonly quantity: number;
};

export type CartState = {
  readonly items: readonly CartItem[];
};

export type CartAction =
  | { readonly type: "add"; readonly id: string; readonly quantity: number }
  | { readonly type: "set"; readonly id: string; readonly quantity: number }
  | { readonly type: "remove"; readonly id: string };

export function applyCartAction(state: CartState, action: CartAction): CartState {
  throw new Error("Not implemented");
}
