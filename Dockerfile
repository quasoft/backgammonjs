# Using alpine image, because it is super slim
FROM alpine

ARG USER=default
ENV HOME /home/$USER

# Install only bash and nodejs, then remove cached package data
RUN apk add --update bash && apk add --update nodejs npm git && rm -rf /var/cache/apk/*

# Create app directory. This is where source code will be copied to
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Create a user for running npm install
# add new user
RUN adduser -D $USER \
        && mkdir -p /etc/sudoers.d \
        && echo "$USER ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/$USER \
        && chmod 0440 /etc/sudoers.d/$USER
# USER $USER
# WORKDIR $HOME

# Copy source from host to directory in container
COPY . /usr/src/app

# Install application and all its dependencies
RUN npm install

# Expose 8080 port. Client should connect at http://IP_OF_CONTAINER:8080
EXPOSE 8080

# Start application
CMD [ "npm", "start" ]
