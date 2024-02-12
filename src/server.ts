import {Controller, CrudMethods, IUsersDB} from "./types";
import http from "node:http";
import { URL } from "node:url";
import {ServerError} from "./ServerError";
import { UsersService } from "./services/users";
import UsersDB from "./db/users";
import UsersController from "./controllers/users";

export const createServer = (port?: number, externalUsersDB?: IUsersDB) => {

    const usersService = new UsersService(externalUsersDB ?? new UsersDB());

    const mapURLToController: Record<string, Controller> = {
        'users': new UsersController(usersService),
    };

    return http.createServer(async (req, res) => {
        console.log(`Server port ${port}`)
        try {
            const url = new URL(req.url ?? '', `http://${req.headers.host}`);
            const [apiPath, controllerPath, argsPath]: string[] = url.pathname.split('/').filter(Boolean);

            if (apiPath !== 'api') {
                throw new ServerError('Not Found. Add /api path to URL', 404);
            }

            const controller = controllerPath ? mapURLToController[controllerPath] : undefined;

            if (!controller) {
                throw new ServerError('Not Found. Pathname is wrong', 404);
            }

            const method = req.method?.toLowerCase();

            if (!method || !controller.crudInterface[method as CrudMethods]) {
                throw new ServerError('Method Not Allowed', 404);
            }

            const crudMethod = method as CrudMethods;
            const {data, code} = await controller.crudInterface[crudMethod]?.(argsPath, req) ?? {};

            res.statusCode = code ?? 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        } catch (error) {
            if (error instanceof ServerError) {
                res.statusCode = error.code;
                res.end(error.message);
                return;
            }
            console.log(error);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });
};