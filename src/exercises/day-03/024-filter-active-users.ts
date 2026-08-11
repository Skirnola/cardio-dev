export type User = {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
};

export function filterActiveUsers(users: readonly User[], query: string): User[] {
  throw new Error("Not implemented");
}
