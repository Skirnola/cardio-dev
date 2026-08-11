import { describe, expect, it } from "vitest";
import { transitionOrder } from "../../../src/exercises/day-03/027-transition-order";

describe("transitionOrder", () => {
  it("applies valid status changes, appends notes immutably, and ignores invalid transitions", () => {
    const order = {
      id: "ord-1",
      status: "draft" as const,
      notes: ["created"],
      shippedAt: null,
    };

    const placed = transitionOrder(order, { type: "place" });
    expect(placed).toEqual({
      id: "ord-1",
      status: "placed",
      notes: ["created"],
      shippedAt: null,
    });

    const noted = transitionOrder(placed, { type: "note", note: "packed" });
    expect(noted.notes).toEqual(["created", "packed"]);
    expect(noted.notes).not.toBe(placed.notes);

    const shipped = transitionOrder(placed, { type: "ship", shippedAt: "2024-01-02T10:00:00Z" });
    expect(shipped).toEqual({
      id: "ord-1",
      status: "shipped",
      notes: ["created"],
      shippedAt: "2024-01-02T10:00:00Z",
    });

    expect(transitionOrder(order, { type: "ship", shippedAt: "2024-01-02T10:00:00Z" })).toBe(order);
  });
});
