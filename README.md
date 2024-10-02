# rss-node-crud

Task: https://github.com/AlreadyBored/nodejs-assignments/blob/main/assignments/crud-api/assignment.md

## Installation
1. Install [Node.js](https://nodejs.org/en/download/) version 20.x.x LTS
2. Clone this repository.
3. Run `npm install`



## How to use
- Run `npm run start:dev` to start the server in development mode 
- Run `npm run start:prod` to run the server in production mode 
- Run `npm run test` to run all tests

## API Endpoints
- GET `/api/users` - Get all users
- POST `/api/users` - Add a new user
- GET `/api/users/:id` - Get a single user
- PUT `/api/uesr/:id` - Update a single user
- DELETE `/api/user/:id` - Delete a single user

## Configuration
- You can chang following values in `.env` file
  - `PORT` - Port number for the server