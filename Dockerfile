# Use LTS version
FROM node:argon

# Update aptitude
RUN apt-get update

# Install software 
RUN apt-get install -y git

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Checkout source code
RUN git clone https://github.com/quasoft/backgammonjs.git /usr/src/app

# Install app dependencies
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 80
CMD [ "npm", "start" ]
