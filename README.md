# rest-api

##  Local Development

### Setup

#### 1. ``npm install``

#### 2. Ensure ``docker compose`` is installed on your machine

#### 3. ``npm run test``

After you have completed the above steps, you can start developing. Although it is not possible to run a local server without completing step 3, you can still write and run tests to verify your changes. ``npm run test`` creates a docker container with a MySQL server in it, runs the tests against the server, and destroys the container after tests have completed. Follow the example in integration.test.ts to write tests of your own.

#### 3. (Optional) Running a local server
1. ``cp envs/.env.dev .env``
1. Update ``DATABASE_URL`` in ``.env`` with the appropriate username and password to login to your local MySQL server.
2. Create tables in the local database: ``dotenv -e .env npx prisma db push``
3. Seed the tables with initial data: ``dotenv -e .env npx prisma db seed``
4. Run a local dev server listening on port 8080: ``npm run start``
