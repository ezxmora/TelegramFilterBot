FROM arm64v8/alpine

## Downloading dependencies
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN addgroup -S tgfilter && adduser -S -G tgfilter tgfilter


WORKDIR /home/tgfilter

## Setting up premissions
RUN chown -R tgfilter:tgfilter /home/tgfilter
RUN chmod -R 777 /home/tgfilter

USER tgfilter

## Installing
COPY package.json .
RUN yarn install
COPY . .

CMD ["yarn", "start"]