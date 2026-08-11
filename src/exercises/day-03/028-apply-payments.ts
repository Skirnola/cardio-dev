export type Account = {
  readonly id: string;
  readonly balance: number;
};

export type Payment = {
  readonly accountId: string;
  readonly amount: number;
};

export function applyPayments(accounts: readonly Account[], payments: readonly Payment[]): Account[] {
  throw new Error("Not implemented");
}
