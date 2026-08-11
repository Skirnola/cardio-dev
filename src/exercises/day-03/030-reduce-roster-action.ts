export type TeamRole = "owner" | "editor" | "viewer";

export type TeamMember = {
  readonly id: string;
  readonly name: string;
  readonly role: TeamRole;
  readonly active: boolean;
};

export type TeamState = {
  readonly members: readonly TeamMember[];
};

export type TeamAction =
  | { readonly type: "upsert"; readonly member: TeamMember }
  | { readonly type: "deactivate"; readonly id: string }
  | { readonly type: "remove"; readonly id: string };

export function reduceRosterAction(state: TeamState, action: TeamAction): TeamState {
  throw new Error("Not implemented");
}
