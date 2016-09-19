# [backgammon.js](../README.md) :: Installation instructions

The game server has been tested to work on the following platforms:

- [Ubuntu 16.04 64-bit](#ubuntu)
- [Windows 10 Professional 64-bit](#windows)
- [Docker](#docker)
- [OpenShift Online](#openshift-online)

Client is served automatically by server via HTTP, so after you install the server, all you need to access the game is the URL to the server (by default http://localhost:8080) and a *modern* browser.

The game client has been tested to work with recent Google Chrome, Firefox 48, IE 11 and Edge browser.
The UI is reponsive, so it should work on most mobile browsers too, but so far has only been tried with up-to-date Google Chrome running under Android 4.1.2.

## Ubuntu

Tested on *Ubuntu 16.04 64-bit*.

Should work on any linux/unix OS that can run `git` and `node.js`.

1. Install latest version of [node.js](https://nodejs.org/en/download/current/) from [official website](https://nodejs.org).

2. Install git

        ```bash
        sudo apt-get update
        sudo apt-get install git
        ```
       
4. Create an empty directory where to put source code:

        ```bash
        mkdir -p ~/backgammonjs
        cd ~/backgammonjs
        ```

3. Clone game repository:

        ```bash
        git clone https://github.com/quasoft/backgammonjs.git .
        ```

4. Install the game and its dependencies:

        ```bash
        npm install
        ```
       
   If this fails, you can also try to install the client and server separately:
   
        ```bash
        cd app/browser
        npm install
        npm build
       
        cd ../server
        npm install
       
        cd ../..
        ```
    
5. Start the game

   Make sure that port 8080 is not in use on your system and start the game:
    
        ```bash
        npm start
        ```

   If this fails, try to manually start the server:
   
        ```bash
        cd app/server
        node server.js
        ```
    
6. To test, open http://localhost:8080 in your browser and you should see the game home page.

## Windows

Tested to work on *Windows 10 Professional 64-bit*.
*Commands can be executed from `Command Prompt` or `Git Bash`.*

1. Install latest version of [node.js](https://nodejs.org/dist/v6.6.0/node-v6.6.0-x64.msi) from [official website](https://nodejs.org).
2. Install [Git for Windows](https://git-scm.com/download/win).
4. Create an empty directory where to put source code:

        ```batch
        mkdir c:\backgammonjs
        c:
        cd c:\backgammonjs
        ```

3. Clone game repository:

        ```batch
        git clone https://github.com/quasoft/backgammonjs.git .
        ```

4. Install the game and its dependencies:

        ```batch
        npm install
        ```

   If this fails, you can also try to install the client and server separately:

        ```batch
        cd app/browser
        npm install
        npm build
       
        cd ../server
        npm install
       
        cd ../..
        ```

5. Start the game

   Make sure that port 8080 is not in use on your system and start the game:
    
        ```batch
        npm start
        ```

   If this fails, try to manually start the server:

        ```batch
        cd app/server
        node server.js
    
6. To test, open http://localhost:8080 in your browser and you should see the game home page.
  
## Docker

Has been tested with Docker version 1.12.1 under Ubuntu 16.04 host (64-bit).

1. To install `docker` follow instructions on [Docker website](https://www.docker.com/products/overview#/install_the_platform)

2. Install git

        ```bash
        sudo apt-get update
        sudo apt-get install git
        ```

3. Create an empty directory where to put source code:

        ```bash
        mkdir -p ~/backgammonjs
        cd ~/backgammonjs
        ```

4. Clone game repository:

        ```bash
        git clone https://github.com/quasoft/backgammonjs.git .
        ```

5. Build docker image

        ```bash
        sudo docker build -t yourself/backgammonjs .
        ```

6. Start docker container

        ```bash
        sudo docker run -p 8080:8080 -d yourself/backgammonjs
        ```
       
   In command above port redirection is used from container to host (the `-p 8080:8080` part).
   If you omit that part, you will still be able to connect to the container, but will have to use the IP of the container, instead of the IP of the host (eg. http://172.17.0.2:8080).

7. Test

        ```bash
        curl -i http://localhost:8080
        ```
       
   or
   
   Open http://localhost:8080 in web browser

## OpenShift Online

Has been tested to work with free tier of OpenShift Online.
The demo is currently running there with *small gear* and *node-latest* cartridge.

*More detailed instructions for deployment to OpenShift Online, comming soon...*

TODO: add detailed intructions on using OpenShift