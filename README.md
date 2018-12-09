# thing-server

A simple REST API server for returning JSON things.

<a href="https://hub.docker.com/r/mitchallen/thing-server/">
<img src="https://img.shields.io/badge/mitchallen-thing--server-green.svg?logo=docker&style=for-the-badge" />
</a>

## Usage

### Pull the image from the repo

    docker pull mitchallen/thing-server:latest

### Run the image locally as a container

This will pull the image down from the repo if you didn't already.

This example runs the server locally on port 1234.

    docker run -p 1234:3000 --name thing-server mitchallen/thing-server

From the doc:

* https://docs.docker.com/engine/reference/commandline/run/#parent-command

*The docker run command first creates a writeable container layer over the specified image, and then starts it using the specified command. That is, docker run is equivalent to the API /containers/create then /containers/(id)/start. A stopped container can be restarted with all its previous changes intact using docker start. See docker ps -a to view a list of all containers.*

* * *

### Rerun with the same or a new container

```
docker stop thing-server
docker rm thing-server
docker run -p 1234:3000 --name thing-server mitchallen/thing-server
```

* * *

### Confirm image is running

    docker ps
    
* * *

### Test with curl commands

Assumes container is running and set to port 1234.

__Note that if you are observing the console, the examples on the screen will show the docker containers internal port - you must use the one you mapped the container to.__

```
curl http://localhost:1234
curl http://localhost:1234/v1 
curl http://localhost:1234/v1/things/count
curl http://localhost:1234/v1/things
curl http://localhost:1234/v1/things/1
```
    
* * *

### Running with your own things

Create a folder in your current directory called __pets__:

```
mkdir pets
```
    
In the new __./pets__ folder create a file called __things.json__ (it must be called 'things.json' or the server won't find it).

Paste into things.json this JSON content and save it:

```
{
    "label": "pets",
    "path": "/v2",
    "list": [
        {
            "name": "Pepper",
            "age": 19
        },
        {
            "name": "Marchio",
            "age": 20
        },
        {
            "name": "Richmond",
            "age": 7
        },
        {
            "name": "Bonnie",
            "age": 18
        }
    ]
}
```

You can change the data if you like, but remember the following:

* __label__ is used in the url (http://localhost:1234/v2/__pets__/count)
* __path__ is the root url (http://localhost:1234/__v2__/pets/1)
* __list__ must be an array of objects
* the list objects can have any properties and don't even need to have the same properties.

Now run the following to build a new container named __pet-things___

```
docker run -p 8100:3000 -v ${PWD}/pets:/usr/src/app/data --name pet-things mitchallen/thing-server
```   

With the above content and values you could perform curl operations like this:

```
curl http://localhost:8100/
curl http://localhost:8100/v2
curl http://localhost:8100/v2/pets
curl http://localhost:8100/v2/pets/count
curl http://localhost:8100/v2/pets/1
```

* * *

### Running Multiple Containers

You can run multiple containers on multiple ports like this:

```
docker run -p 8101:3000 -v ${PWD}/dogs:/usr/src/app/data --name dog-things mitchallen/thing-server

docker run -p 8102:3000 -v ${PWD}/cats:/usr/src/app/data --name cat-things mitchallen/thing-server
``` 

The servers would look for: 

* __./dogs/things.json__
* __./cats/things.json__

* * *

### Start and stop a running container

    docker stop thing-server
    docker stop pet-things
    docker stop dog-things
    docker stop cat-things

    docker start thing-server
    docker start pet-things
    docker start dog-things
    docker start cat-things
    
* * *

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

*NOTE: using annotated tags didn't trigger a new build. Use the simpler format.*

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

* * *

### Watch

Watch uptime change every second

    watch -n 1 curl http://localhost:3000/