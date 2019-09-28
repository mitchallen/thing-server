# docker build -t <your username>/thing-server .
# docker run -p 1234:3000 -d <your username>/thing-server

FROM node:8-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install --production

# Bundle app source
COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]