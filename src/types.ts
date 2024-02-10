import http from "node:http";

export type CrudMethods = 'get' | 'post' | 'put' | 'delete';

export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[]
};

export type Controller = Partial<Record<CrudMethods, (args: string | undefined, req: http.IncomingMessage) => Promise<{ data?: unknown, code?: number }>>>;