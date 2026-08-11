export type Ticket = {
  id: string;
  subject: string;
  archived: boolean;
};

export function getVisibleTickets(tickets: readonly Ticket[]): Ticket[] {
  throw new Error("Not implemented");
}
