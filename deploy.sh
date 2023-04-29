#!/bin/bash

docker build -t rest-api-deploy .
docker tag rest-api-deploy gcr.io/rosy-fiber-381214/rest-api-deploy
docker push gcr.io/rosy-fiber-381214/rest-api-deploy 
gcloud run deploy rest-api --image gcr.io/rosy-fiber-381214/rest-api-deploy --platform managed --port 80