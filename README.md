# thing-server

A simple REST API server for returning JSON things.

<a href="https://hub.docker.com/r/mitchallen/thing-server/">
<img src="https://img.shields.io/badge/mitchallen-thing--server-green.svg?logo=docker&style=for-the-badge" />
</a>

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

### Rerun with the same or a new container

    docker stop thing-server
    docker rm thing-server
    docker run -d -p 1234:3000 --name thing-server mitchallen/thing-server

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

* * *

### Automated Docker Builds

New builds of the image are created automatically using Docker Cloud.

To trigger a new build via a github tag I do the following (using v1.0.6 as an example):

*NOTE: using annotated tags didn't trigger a new build. Use the simpler format only.*

Tags must match this format to trigger a build: /v[0-9.]+$/ 

    git checkout master
    git tag v1.0.6
    git push origin --tags

This triggers two new builds of the Docker image: __v1.0.6__ and __latest__

Docker Cloud:

* https://cloud.docker.com

My Docker Hub page:

* https://hub.docker.com/u/mitchallen/

Docker Hub page for this image

* https://hub.docker.com/r/mitchallen/thing-server/

Docker Hub page for this images tags

* https://hub.docker.com/r/mitchallen/thing-server/tags/
