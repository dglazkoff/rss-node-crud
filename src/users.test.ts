import request from 'supertest';
import { server }  from './index';
import {User} from "./types";

const testUser: Omit<User, 'id'> = {
    username: 'John',
    age: 20,
    hobbies: ['football', 'hiking']
}

describe('/api/users Testing', () => {
    afterAll((done) => {
        server.close();
        done();
    });

    describe('base user flow', () => {
        const changedUser: Omit<User, 'id'> = {
            username: 'John',
            age: 21,
            hobbies: ['football', 'hiking']
        }
        let createdId = "";

        it('should get empty users', async () => {
            const response = await request(server).get('/api/users');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
        })

        it('should create user', async () => {
            const response = await request(server).post('/api/users').send(testUser);
            expect(response.status).toBe(201);
            expect(response.body).toEqual({id: expect.any(String), ...testUser});

            createdId = response.body.id;
        });

        it('should get created user', async () => {
            const response = await request(server).get(`/api/users/${createdId}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: createdId,
                ...testUser,
            });
        })

        it('should edit created user', async () => {
            const response = await request(server).put(`/api/users/${createdId}`).send(changedUser);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: createdId,
                ...changedUser,
            });
        })

        it('should delete created user', async () => {
            const response = await request(server).delete(`/api/users/${createdId}`);
            expect(response.status).toBe(204);
        })

        it('should fail to get deleted user', async () => {
            const response = await request(server).get(`/api/users/${createdId}`);
            expect(response.status).toBe(404);
            expect(response.text).toBe(`Not Found user with id: ${createdId}`);
        })
    });

    describe('body on create user', () => {
        it('should fail without required fields', async () => {
            const response = await request(server).post('/api/users').send({ username: 'John' });
            expect(response.status).toBe(400);
            expect(response.text).toBe('There is no required fields');
        });

        it('should fail if username empty string', async () => {
            const response = await request(server).post('/api/users').send({ ...testUser, username: '' });
            expect(response.status).toBe(400);
            expect(response.text).toBe('There is no required fields');
        });

        it('should fail if age < 0', async () => {
            const response = await request(server).post('/api/users').send({ ...testUser, age: -1 });
            expect(response.status).toBe(400);
            expect(response.text).toBe('Wrong format of fields');
        });

        it('should fail if age is string', async () => {
            const response = await request(server).post('/api/users').send({ ...testUser, age: 'abc' });
            expect(response.status).toBe(400);
            expect(response.text).toBe('Wrong format of fields');
        });

        it('should fail if wrong hobbies format', async () => {
            const response = await request(server).post('/api/users').send({ ...testUser, hobbies: '123' });
            expect(response.status).toBe(400);
            expect(response.text).toBe('Wrong format of fields');
        });

        it('should create user if hobbies empty array', async () => {
            const response = await request(server).post('/api/users').send({ ...testUser, hobbies: [] });
            expect(response.status).toBe(201);
        });

        it('should fail if wrong body format', async () => {
            const response = await request(server).post('/api/users').send([]);
            expect(response.status).toBe(400);
        });
    })

    describe('invalid request path', () => {
        it('should fail if no /api in path', async () => {
            const response = await request(server).get(`/users`);
            expect(response.status).toBe(404);
            expect(response.text).toBe('Not Found. Add /api path to URL');
        });

        it('should fail if controller does not mentioned in path', async () => {
            const response = await request(server).get(`/api`);
            expect(response.status).toBe(404);
            expect(response.text).toBe('Not Found. Pathname is wrong');
        });

        it('should fail if controller does not exist', async () => {
            const response = await request(server).get(`/api/user`);
            expect(response.status).toBe(404);
            expect(response.text).toBe('Not Found. Pathname is wrong');
        });

        it('should fail if method does not exist in controller', async () => {
            const response = await request(server).patch(`/api/users`).send(testUser);
            expect(response.status).toBe(404);
            expect(response.text).toBe('Method Not Allowed');
        });
    });
});