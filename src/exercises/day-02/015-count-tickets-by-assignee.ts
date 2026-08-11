export type Ticket = {
  id: string;
  assignee: string | null | undefined;
};

export function countTicketsByAssignee(tickets: readonly Ticket[]): Map<string, number> {
  throw new Error("Not implemented");
}
