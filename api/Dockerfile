FROM node:boron
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json ./

RUN npm install --production --silent

# Bundle app source
COPY . .

EXPOSE 3000

CMD ["node", "app.js"]