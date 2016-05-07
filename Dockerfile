FROM mhart/alpine-node:latest

WORKDIR /src
ADD . .
RUN npm install
CMD ["node", "index.js"]
