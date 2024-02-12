import {IUsersDB, User} from "../types";

export default class UsersDB implements IUsersDB {
    private users: Map<string, User>;

    constructor() {
        this.users = new Map();
    }

    public getAll() {
        return Promise.resolve(Array.from(this.users.values()));
    }

    public has(id: string) {
        return Promise.resolve(this.users.has(id));
    }

    public get(id: string) {
        return Promise.resolve(this.users.get(id));
    }

    public set(id: string, user: User) {
        this.users.set(id, user);

        return Promise.resolve();
    }

    public delete(id: string) {
        this.users.delete(id);

        return Promise.resolve();
    }
}