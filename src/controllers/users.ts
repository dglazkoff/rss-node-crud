import { v4 as uuid, validate } from "uuid";
import { UsersService } from "../services/users";
import {Controller, User} from "../types";
import {ServerError} from "../ServerError";
import http from "node:http";

export default class UsersController implements Controller {
    service: UsersService;

    constructor(usersService: UsersService) {
        this.service = usersService;
    }

    async getUser(id: string) {
        if (!validate(id)) {
            throw new ServerError('Wrong format of ID', 400);
        }

        const user = await this.service.getUser(id);

        if (!user) {
            throw new ServerError(`Not Found user with id: ${id}`, 404);
        }

        return user;
    }

    getUsers = async (id?: string) => {
        if (id) {
            return { data: await this.getUser(id) };
        }

        return { data: await this.service.getUsers() };
    }

    private getParsedUser(user: any, id: string): User {
        const { username, age, hobbies } = user;

        if (!username || !age || !hobbies) {
            throw new ServerError('There is no required fields', 400);
        }

        const parsedUser: User = {
            id: id,
            username: String(username),
            age: Number(age),
            hobbies,
        };

        if (!parsedUser.username
            || !parsedUser.age
            || parsedUser.age < 0
            || !Array.isArray(parsedUser.hobbies)
            || parsedUser.hobbies.some((hobby: unknown) => typeof hobby !== 'string')
        ){
            throw new ServerError('Wrong format of fields', 400);
        }

        return parsedUser;
    }

    private getUserFromBody = (req: http.IncomingMessage, id: string): Promise<User> => new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const user = this.getParsedUser(JSON.parse(body), id);
                resolve(user);
            } catch (e) {
                reject(e);
            }
        });
    })

    createUser = async (_args: string | undefined, req: http.IncomingMessage) =>  {
        const id = uuid();
        const user = await this.getUserFromBody(req, id);
        await this.service.addUser(id, user);

        return { data: user, code: 201 };
    }

    editUser = async (id: string | undefined, req: http.IncomingMessage) => {
        if (!id) {
            throw  new ServerError('Provide Id', 404);
        }

        if (!validate(id)) {
            throw new ServerError('Wrong format of ID', 400);
        }

        if (!await this.service.hasUser(id)) {
            throw new ServerError(`Not Found user with id: ${id}`, 404);
        }

        const user = await this.getUserFromBody(req, id);
        await this.service.updateUser(id, user);

        return { data: user  };
    }

    deleteUser = async (id: string | undefined) => {
        if (!id) {
            throw  new ServerError('Provide Id', 404);
        }

        if (!validate(id)) {
            throw new ServerError('Wrong format of ID', 400);
        }

        if (!await this.service.hasUser(id)) {
            throw new ServerError(`Not Found user with id: ${id}`, 404);
        }

        await this.service.deleteUser(id);
        return { code: 204 };
    }

    crudInterface = {
        get: this.getUsers,
        post: this.createUser,
        put: this.editUser,
        delete: this.deleteUser,
    }
}