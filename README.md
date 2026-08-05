# thing-server

[![GitHub tag](https://img.shields.io/github/v/tag/mitchallen/thing-server?sort=semver&label=version)](https://github.com/mitchallen/thing-server/tags) [![Docker Hub](https://img.shields.io/docker/v/mitchallen/thing-server?sort=semver&label=docker%20hub)](https://hub.docker.com/r/mitchallen/thing-server)

A simple REST API server for returning JSON things.

* * *

## Usage

### Pull the image from the repo

    docker pull ghcr.io/mitchallen/thing-server:latest

### To pull docker hub versions:

    docker pull mitchallen/thing-server:latest

### Run the image locally as a container

This will pull the image down from the repo if you didn't already.

This example runs the server locally on port 1234.

    docker run -p 1234:3000 --name thing-server ghcr.io/mitchallen/thing-server:latest

You can also run the Docker Hub image instead:

    docker run -p 1234:3000 --name thing-server mitchallen/thing-server:latest

From the doc:

* https://docs.docker.com/engine/reference/commandline/run/#parent-command

*The docker run command first creates a writeable container layer over the specified image, and then starts it using the specified command. That is, docker run is equivalent to the API /containers/create then /containers/(id)/start. A stopped container can be restarted with all its previous changes intact using docker start. See docker ps -a to view a list of all containers.*

* * *

### Rerun with the same or a new container

```
docker stop thing-server
docker rm thing-server
docker run -p 1234:3000 --name thing-server ghcr.io/mitchallen/thing-server:latest
```

* * *

### Confirm image is running

    docker ps
    
* * *

### Swagger Explorer

Once the container is running, the interactive API explorer is available at:

```
http://localhost:1234/api-docs
```

The root endpoint also advertises the explorer path in its `explorer` field.

* * *

### Environment variables

All configuration is optional — unset, the server serves the bundled data set at the root with no authentication.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the server listens on *inside* the container. Map it with `docker run -p <host>:3000`. |
| `THINGSFILE` | `./data/things.json` | Path to the data file. Usually left alone and overridden with a volume mount instead — see [Running with your own things](#running-with-your-own-things). |
| `API_KEY` | *unset* | When set, the things routes require a matching `x-api-key` header. See [Require an API key](#require-an-api-key). |
| `APP_NAME` | `thing-server` | Name reported in the root, `404` and `401` bodies. See [Override APP_NAME](#override-app_name). |
| `BASE_PATH` | `/` | Mounts the whole API under a sub-path. See [Mount under a base path](#mount-under-a-base-path). |

The data file itself supplies the `label` (`things`) and `path` (`/v1`) segments of the routes; `BASE_PATH` is applied as a prefix on top of those.

* * *

### Require an API key

The things routes can require an `x-api-key` header. Enforcement is **off by default** and turns on only when you set the `API_KEY` environment variable at launch:

```sh
docker run -p 1234:3000 -e API_KEY=your-secret-key --name thing-server ghcr.io/mitchallen/thing-server:latest
```

With `API_KEY` set, requests to the things routes must send a matching header or receive `401 unauthorized`:

```sh
curl -H "x-api-key: your-secret-key" http://localhost:1234/v1/things
```

The root (`/`) health check and the Swagger explorer (`/api-docs`) remain open regardless. If `API_KEY` is not set, the API is open (no key required).

* * *

### Override APP_NAME

The server reports its name as `thing-server` in the root response and in error bodies. Set `APP_NAME` to override it:

```sh
docker run -p 1234:3000 -e APP_NAME=widget-server --name thing-server ghcr.io/mitchallen/thing-server:latest
```

```sh
curl http://localhost:1234/
{"status":"OK","app":"widget-server", ... }
```

The name also appears in the `401 unauthorized` and `404 not found` bodies, and as the Swagger explorer's page title.

* * *

### Mount under a base path

By default the API lives at the root: `/`, `/v1/things`, `/api-docs`. Set `BASE_PATH` to move the whole API — root, things routes and explorer — under a sub-path, which is useful behind a reverse proxy that routes several services by prefix:

```sh
docker run -p 1234:3000 -e BASE_PATH=/api/svc1 --name thing-server ghcr.io/mitchallen/thing-server:latest
```

```sh
curl http://localhost:1234/api/svc1
curl http://localhost:1234/api/svc1/v1/things
curl http://localhost:1234/api/svc1/v1/things/count
```

The explorer moves too, to `http://localhost:1234/api/svc1/api-docs`, and the generated OpenAPI spec records the base path as its server URL. A trailing slash is tolerated (`/api/svc1/` behaves the same as `/api/svc1`).

Note that `BASE_PATH` is a **prefix**: it stacks on top of the `path` from your data file, so the default `path` of `/v1` becomes `/api/svc1/v1`. Once `BASE_PATH` is set the un-prefixed routes no longer resolve. The root response reports the resolved values in `route`, `explorer` and `meta.path`:

```sh
curl http://localhost:1234/api/svc1
{"status":"OK","app":"thing-server","route":"/api/svc1","explorer":"/api/svc1/api-docs","meta":{"label":"things","path":"/api/svc1/v1","count":3}}
```

Unset, both `APP_NAME` and `BASE_PATH` leave every route and response exactly as before.

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

* __label__ is used in the url — e.g. `http://localhost:1234/v2/pets/count` (here `pets` is the label)
* __path__ is the root of the url — e.g. `http://localhost:1234/v2/pets/1` (here `/v2` is the path)
* __list__ must be an array of objects
* the list objects can have any properties and don't even need to have the same properties.

Now run the following to build a new container named __pet-things__

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

## Publish

Builds are automated via GitHub Actions and triggered by pushing a version tag.

Bump the version, commit, tag, and push:

```sh
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "1.x.x"
git tag v1.x.x
git push origin main
git push origin v1.x.x
```

Tags matching `v*` trigger two workflows that build and push multi-platform (`linux/amd64`, `linux/arm64`) images to:

* **GitHub Container Registry:** `ghcr.io/mitchallen/thing-server`
* **Docker Hub:** `mitchallen/thing-server`

Each publish creates both a versioned tag and updates `latest`.

The Docker Hub workflow also syncs this README to the [Docker Hub repository description](https://hub.docker.com/r/mitchallen/thing-server).

### Required secrets

The Docker Hub workflow needs these repository secrets (Settings → Secrets and variables → Actions):

* `DOCKERHUB_USERNAME` — your Docker Hub username
* `DOCKERHUB_TOKEN` — a Docker Hub access token

The GitHub Container Registry workflow uses the built-in `GITHUB_TOKEN`; no extra secret is required.

