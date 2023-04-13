# rest-api

##  Local Development

### Setup

#### 1. ``npm install``

#### 2. ``cp envs/.env.dev .env``

After you complete the above two steps and have installed docker compose, you can start developing. Although you won't be
able to run a local server without following steps 3 and 4, you can still write tests to verify your changes. The test suite
creates a docker container with a MySQL server in it, runs the tests against this server, and destroys the container after tests have completed. Follow the example in integration.test.ts to write tests of your own.

#### 3. (Optional) Create Tables in Local Database
You will need to modify ``DATABASE_URL`` in ``.env`` with the appropriate username and password to login to your local MySQL server.
If you test your changes with the test suite, it is not necessary to setup a local database manually. The test suite will do it
for you. 

``npx prisma db push``

#### 4. (Optional) Seed Database with Initial Data
1. ``npx prisma db seed``

### Run Local Server
1. ``npm run start``

### Run Local Tests
1. ``npm run test``
