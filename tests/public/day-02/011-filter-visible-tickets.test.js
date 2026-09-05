import { expect, it } from "vitest";
import { getVisibleTickets } from "../../../src/exercises/day-02/011-filter-visible-tickets";
it("returns only unarchived tickets in their original order without mutating the input", () => {
    const tickets = [
        { id: "T-1", subject: "Reset password", archived: false },
        { id: "T-2", subject: "Update billing", archived: true },
        { id: "T-3", subject: "Cancel subscription", archived: false },
    ];
    const snapshot = JSON.parse(JSON.stringify(tickets));
    expect(getVisibleTickets(tickets)).toEqual([
        { id: "T-1", subject: "Reset password", archived: false },
        { id: "T-3", subject: "Cancel subscription", archived: false },
    ]);
    expect(tickets).toEqual(snapshot);
});
