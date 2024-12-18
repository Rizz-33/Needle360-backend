FROM node:alpine3.18

WORKDIR /app

COPY package*.json ./

RUN npm config set fetch-timeout 600000
RUN npm config set registry https://registry.npm.taobao.org
RUN npm install

COPY . .

EXPOSE 4000