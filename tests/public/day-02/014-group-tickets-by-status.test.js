import { expect, it } from "vitest";
import { groupTicketsByStatus } from "../../../src/exercises/day-02/014-group-tickets-by-status";
it("groups tickets into every status bucket and preserves the source order inside each bucket", () => {
    const tickets = [
        { id: "T-1", subject: "Login issue", status: "open" },
        { id: "T-2", subject: "Refund request", status: "resolved" },
        { id: "T-3", subject: "Password reset", status: "open" },
    ];
    const snapshot = JSON.parse(JSON.stringify(tickets));
    expect(groupTicketsByStatus(tickets)).toEqual({
        open: [
            { id: "T-1", subject: "Login issue", status: "open" },
            { id: "T-3", subject: "Password reset", status: "open" },
        ],
        pending: [],
        resolved: [
            { id: "T-2", subject: "Refund request", status: "resolved" },
        ],
    });
    expect(tickets).toEqual(snapshot);
});
