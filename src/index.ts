import http from "node:http";
import { URL } from "node:url";
import 'dotenv/config'

import { Controller, CrudMethods } from "./types";
import users from "./controllers/users";
import {ServerError} from "./ServerError";

const mapURLToController: Record<string, Controller> = {
    'users': users,
};

export const server = http.createServer(async (req, res) => {
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

        if (!method || !controller[method as CrudMethods]) {
            throw new ServerError('Method Not Allowed', 404);
        }

        const crudMethod = method as CrudMethods;
        const { data, code } = await controller[crudMethod]?.(argsPath, req) ?? {};

        res.statusCode = code ?? 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    } catch (error) {
        if (error instanceof ServerError) {
            res.statusCode = error.code;
            res.end(error.message);
            return;
        }

        res.statusCode = 500;
        res.end('Internal Server Error');
    }
});

server.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}`);
});