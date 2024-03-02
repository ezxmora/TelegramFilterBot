FROM node:slim
WORKDIR /tg-filter

COPY package.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]