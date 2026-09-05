export class LatestSearchStore {
    fetchUsers;
    constructor(fetchUsers) {
        this.fetchUsers = fetchUsers;
    }
    getState() {
        throw new Error("Not implemented");
    }
    async search(query) {
        throw new Error("Not implemented");
    }
}
