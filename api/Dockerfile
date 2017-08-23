FROM centos:7.2.1511

RUN yum -y install gcc-c++ make
RUN curl -sL https://rpm.nodesource.com/setup_6.x | bash -
RUN yum -y install nodejs

ENV USER_NAME api

RUN useradd -ms /bin/bash $USER_NAME

RUN mkdir api 

WORKDIR ./api

# Install app dependencies
COPY package.json package-lock.json ./

RUN npm install --production --silent

# Bundle app source
COPY . .

RUN chmod +x exe/*

RUN chown -R $USER_NAME .

USER $USER_NAME

EXPOSE 3000


CMD ["npm", "app.js"]
