# thing-server

A simple REST API server for returning JSON things.

## To Use

### Pull the image from the repo

    docker pull mitchallen/thing-server:latest

### Run the image locally as a container

This will pull the image down from the repo if you didn't already.

This example runs the server locally on port 1234.

    docker run -d -p 1234:3000 --name thing-server mitchallen/thing-server

From the doc:

* https://docs.docker.com/engine/reference/commandline/run/#parent-command

*The docker run command first creates a writeable container layer over the specified image, and then starts it using the specified command. That is, docker run is equivalent to the API /containers/create then /containers/(id)/start. A stopped container can be restarted with all its previous changes intact using docker start. See docker ps -a to view a list of all containers.*

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

    docker stop thing-server
    docker rm thing-server
    docker rmi mitchallen/thing-server
