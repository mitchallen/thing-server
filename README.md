# thing-server

A simple REST API server for returning JSON things.

## To Use

### Pull the image from the repo

    docker pull mitchallen/thing-server:latest

### Run the image locally

This example runs the server locally on port 1234.

    docker run -d -p 1234:3000 --name thing-server mitchallen/thing-server

If you do this twice you will get an error because the port is in use. 

To restart, stop the container then remove (rm) it.

### Confirm image is running

    docker ps

### Test with curl commands

Assumes container is running and set to port 1234.

    curl http://localhost:1234
    curl http://localhost:1234/v1 
    curl http://localhost:1234/v1/things/count
    curl http://localhost:1234/v1/things
    curl http://localhost:1234/v1/things/1

### Start and stop a running container

    docker stop thing-server

    docker start thing-server

### Remove

#### Remove Container

    docker stop thing-server
    docker rm thing-server

### Remove Image

    docker rmi mitchallen/thing-server
