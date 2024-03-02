FROM arm64v8/node:lts-alpine

WORKDIR /tg-filter
COPY package.json .
RUN npm install
COPY . .

CMD ["npm", "start"]