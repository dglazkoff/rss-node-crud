import http from "node:http";

export type CrudMethods = 'get' | 'post' | 'put' | 'delete';

export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[]
};

export interface Controller {
  crudInterface: Partial<Record<CrudMethods, (args: string | undefined, req: http.IncomingMessage) => Promise<{ data?: unknown, code?: number }>>>;
}

export interface IUsersDB {
  getAll: () => Promise<User[]>;
  get: (id: string) => Promise<User | undefined>;
  set: (id: string, data: User) => Promise<void>;
  has: (id: string) => Promise<boolean>;
  delete: (id: string) => Promise<void>;
}