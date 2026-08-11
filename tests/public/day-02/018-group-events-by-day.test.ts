import { expect, it } from "vitest";
import { groupEventsByDay, type AuditEvent } from "../../../src/exercises/day-02/018-group-events-by-day";

it("groups events by UTC day, sorts the day keys, and keeps the original order within each day", () => {
  const events: AuditEvent[] = [
    { id: "e1", kind: "comment", timestamp: "2024-05-02T23:30:00.000Z" },
    { id: "e2", kind: "status", timestamp: "2024-05-01T10:00:00.000Z" },
    { id: "e3", kind: "comment", timestamp: "2024-05-02T12:00:00.000Z" },
  ];
  const snapshot = JSON.parse(JSON.stringify(events)) as AuditEvent[];

  const result = groupEventsByDay(events);

  expect(Object.keys(result)).toEqual(["2024-05-01", "2024-05-02"]);
  expect(result["2024-05-01"]).toEqual([
    { id: "e2", kind: "status", timestamp: "2024-05-01T10:00:00.000Z" },
  ]);
  expect(result["2024-05-02"]).toEqual([
    { id: "e1", kind: "comment", timestamp: "2024-05-02T23:30:00.000Z" },
    { id: "e3", kind: "comment", timestamp: "2024-05-02T12:00:00.000Z" },
  ]);
  expect(events).toEqual(snapshot);
});
