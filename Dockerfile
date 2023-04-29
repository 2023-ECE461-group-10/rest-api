FROM node:18-alpine
RUN apk update && apk add git
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 80
CMD [ "npm", "run", "start" ]