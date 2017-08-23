FROM node:6-alpine

WORKDIR /usr/src/app

# Install a simple node server
RUN npm install -g http-server --silent

RUN npm install -g node-sass --silent

# Install app dependencies
COPY package.json package-lock.json ./

RUN npm install --production --silent

# Bundle app source
COPY . .

## run sass to compile css
RUN node-sass --output-style expanded css/sass/main.scss> css/style.css

# Expose the port the app runs in
EXPOSE 8080

# Serve the app
CMD ["http-server"]