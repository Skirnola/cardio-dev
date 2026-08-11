export type BoardLane = "backlog" | "active" | "done";

export type BoardCard = {
  readonly id: string;
  readonly title: string;
};

export type BoardState = {
  readonly backlog: readonly BoardCard[];
  readonly active: readonly BoardCard[];
  readonly done: readonly BoardCard[];
};

export type BoardAction =
  | { readonly type: "move"; readonly id: string; readonly from: BoardLane; readonly to: BoardLane }
  | { readonly type: "rename"; readonly id: string; readonly title: string };

export function applyBoardAction(state: BoardState, action: BoardAction): BoardState {
  throw new Error("Not implemented");
}
