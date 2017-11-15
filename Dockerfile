FROM node:alpine

WORKDIR /code
COPY . .

CMD ["bin/hubot", "-a", "slack"]
