import {User, IUsersDB} from "../types";

export class UsersService {
    private users: IUsersDB;

    public constructor(users: IUsersDB) {
        this.users = users;
    }

    public async getUsers() {
        return await this.users.getAll();
    }

    public async getUser(id: string) {
        return await this.users.get(id);
    }

    public async hasUser(id: string) {
        return await this.users.has(id)
    }

    public async addUser(id: string, user: User) {
        await this.users.set(id, user);
    }

    public async deleteUser(id: string) {
        await this.users.delete(id);
    }

    public async updateUser(id: string, user: User) {
        await this.users.set(id, user);
    }
}