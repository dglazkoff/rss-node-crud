import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';
import { createServer } from "./server";

import 'dotenv/config'
import {IUsersDB, User} from "./types";
import UsersDB from "./db/users";
import http from "node:http";

const numCPUs = availableParallelism() - 1;

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    const users = new UsersDB();
    const workers: number[] = [];
    let currentWorker: number = 0;

    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        const port = +process.env.PORT! + i + 1;

        worker.send({ type: 'initial', port });

        workers.push(port);
    }

    cluster.on('message', async (worker, message) => {
        if (message.type === 'get-all') {
            worker.send({ type: 'get-all', data: await users.getAll() });
        }
        if (message.type === 'get') {
            worker.send({ type: 'get', data: await users.get(message.data.id) });
        }
        if (message.type === 'set') {
            await users.set(message.data.id, message.data.user);
            worker.send({ type: 'set' });
        }
        if (message.type === 'has') {
            const result = await users.has(message.data.id);
            worker.send({ type: 'has', data: result });
        }
        if (message.type === 'delete') {
            await users.delete(message.data.id);
            worker.send({ type: 'delete' });
        }
    });

    http.createServer((req: http.IncomingMessage, res) => {
        const workerPort = workers[currentWorker]!;

        currentWorker = (currentWorker + 1) % workers.length;

        const url = new URL(req.url!, `http://${req.headers.host}`);
        url.port = workerPort.toString();

        const options: http.RequestOptions = {
            hostname: url.hostname,
            port: workerPort,
            path: req.url,
            method: req.method,
            headers: req.headers,
        };

        const request = http.request(url, options, (response) => {
            res.setHeader('Content-Type', 'application/json');
            response.on('data', function (chunk) {
                res.write(chunk);
            });
            response.on('end', () => {
                res.end();
            });
        });

        req.on('data', chunk => {
            request.write(chunk)
        });

        req.on('end', () => {
            request.end();
        });


    }).listen(process.env.PORT);
} else {
    const usersDB: IUsersDB = {
        getAll: (): Promise<User[]> => {
            process.send!({ type: 'get-all' })

            return new Promise((resolve) => {
                process.on('message', (message: { type: string, data: User[] }) => {
                    if (message.type === 'get-all') {
                        resolve(message.data);
                    }
                })
            });
        },
        get: (id: string): Promise<User> => {
            process.send!({ type: 'get', data: { id } })

            return new Promise((resolve) => {
                process.on('message', (message: { type: string, data: User }) => {
                    if (message.type === 'get') {
                        resolve(message.data);
                    }
                })
            });
        },
        set: (id: string, user: User) => {
            process.send!({ type: 'set', data: { id, user } })

            return new Promise((resolve) => {
                process.on('message', (message: { type: string }) => {
                    if (message.type === 'set') {
                        resolve();
                    }
                })
            });
        },
        has: (id: string): Promise<boolean> => {
            process.send!({ type: 'has', data: { id } })

            return new Promise((resolve) => {
                process.on('message', (message: { type: string, data: boolean }) => {
                    if (message.type === 'has') {
                        resolve(message.data);
                    }
                })
            });
        },
        delete: (id: string): Promise<void> => {
            process.send!({ type: 'delete', data: { id } })

            return new Promise((resolve) => {
                process.on('message', (message: { type: string }) => {
                    if (message.type === 'delete') {
                        resolve();
                    }
                })
            });
        },
    };

    process.on('message', ({ type, port }) => {
        if (type !== 'initial') {
            return;
        }
        createServer(port, usersDB).listen(port, () => {
            console.log(`Server is listening on port ${port} by worker ${process.pid}`);
        });
    });
}