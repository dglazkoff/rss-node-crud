import { v4 as uuid, validate } from "uuid";
import { users } from "../db/users";
import {Controller, User} from "../types";
import {ServerError} from "../ServerError";
import http from "node:http";

function getUser(id: string) {
    if (!validate(id)) {
        throw new ServerError('Wrong format of ID', 400);
    }

    const user = users[id];

    if (!user) {
        throw new ServerError(`Not Found user with id: ${id}`, 404);
    }

    return user;
}

const getUsers = async (id?: string) => {
    if (id) {
        return { data: getUser(id) };
    }

    return { data: users };
}

function getParsedUser(user: any) {
    const { username, age, hobbies } = user;

    if (!username || !age || !hobbies) {
        throw new ServerError('There is no required fields', 400);
    }

    const parsedUser: User = {
        id: uuid(),
        username: String(username),
        age: Number(age),
        hobbies,
    };

    if (!parsedUser.username || !parsedUser.age || parsedUser.age < 0 || !Array.isArray(parsedUser.hobbies)) {
        throw new ServerError('Wrong format of fields', 400);
    }

    return parsedUser;
}

const addUserFromBody = (req: http.IncomingMessage, id?: string) => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const user = getParsedUser(JSON.parse(body));
            users[id ?? user.id] = user;

            resolve(user);
        } catch (e) {
            reject(e);
        }
    });
})

const createUser = async (_args: string | undefined, req: http.IncomingMessage) =>  {
    const user = await addUserFromBody(req);
    return { data: user, code: 201 };
}

const editUser = async (id: string | undefined, req: http.IncomingMessage) => {
    if (!id) {
        throw  new ServerError('Provide Id', 404);
    }

    if (!validate(id)) {
        throw new ServerError('Wrong format of ID', 400);
    }

    if (users[id] === undefined) {
        throw new ServerError(`Not Found user with id: ${id}`, 404);
    }

    const user = await addUserFromBody(req, id);
    return { data: user  };
}

const deleteUser = async (id: string | undefined) => {
    if (!id) {
        throw  new ServerError('Provide Id', 404);
    }

    if (!validate(id)) {
        throw new ServerError('Wrong format of ID', 400);
    }

    if (users[id] === undefined) {
        throw new ServerError(`Not Found user with id: ${id}`, 404);
    }

    delete users[id];
    return { code: 204 };
}

export default {
    get: getUsers,
    post: createUser,
    put: editUser,
    delete: deleteUser,
} satisfies Controller