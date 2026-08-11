export type AuditEvent = {
  id: string;
  kind: string;
  timestamp: string;
};

export function groupEventsByDay(events: readonly AuditEvent[]): Record<string, AuditEvent[]> {
  throw new Error("Not implemented");
}
