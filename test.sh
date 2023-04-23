#!/bin/bash

docker compose -f test-mysql-db-docker.yml up&

# Wait for container to spin up
mysql -u root -ptest test -e "SELECT 1" -P 8001 --protocol=tcp
while [ $? -ne 0 ]
do
    sleep 5;
    mysql -u root -ptest test -e "SELECT 1" -P 8001 --protocol=tcp
done

RC=0

npx dotenv -e .env.test npx prisma db push &&
npx dotenv -e .env.test jest --coverage --detectOpenHandles --coverageReporters="json-summary" --json --outputFile="./coverage/output-final.json"

RC=$?

docker compose -f test-mysql-db-docker.yml down

exit $RC