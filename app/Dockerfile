FROM centos:7.2.1511

RUN yum -y install gcc-c++ make
RUN curl -sL https://rpm.nodesource.com/setup_6.x | bash -
RUN yum -y install nodejs

ENV USER_NAME app

RUN useradd -ms /bin/bash $USER_NAME

RUN mkdir app

WORKDIR ./app

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

RUN chown -R $USER_NAME .

USER $USER_NAME

EXPOSE 8080

# Serve the app
CMD ["http-server"]
