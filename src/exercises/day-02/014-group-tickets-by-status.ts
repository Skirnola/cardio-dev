export type TicketStatus = "open" | "pending" | "resolved";

export type Ticket = {
  id: string;
  subject: string;
  status: TicketStatus;
};

export function groupTicketsByStatus(tickets: readonly Ticket[]): Record<TicketStatus, Ticket[]> {
  throw new Error("Not implemented");
}
