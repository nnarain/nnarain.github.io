---
layout: post
title: ROS Development Environment on Windows 10 using Docker
tag: ['ros', 'docker']
repo_url: https://github.com/nnarain/docker-ros
---

Recently I got my hands on a [iRobot Create 2](https://store.irobot.com/default/create-programmable-programmable-robot-irobot-create-2/RC65099.html) from work and have been spending some of my time recently setting it up with ROS.

The following is how I've setup my ROS development environment on Windows 10.

**Building Docker Images**

Ultimately, I want to deploy a ROS bundle to a Raspberry PI connected to the Create 2. However, compiling on the Raspberry PI is painfully slow. My plan is to cross-compile an `arm64` ROS bundle inside of a docker container and load that on the PI.

At the moment, I'm still working in simulation but wanted to give context to how I've structured the docker images.

There are official ROS docker containers on [docker hub](https://hub.docker.com/_/ros). All of my containers derive from these base containers.

My containers are split into `base`, `desktop` and `dev`.

| Image        | Platform    | From                 | Description                                    |
| -----        | --------    | ----                 | -----------                                    |
| ros-base     | amd64/arm64 | ROS_DISTRO-ros-base  | ROS_DISTRO + tools, usable on amd64 and arm64  |
| ros2-base    | amd64/arm64 | ROS_DISTRO-ros-base  | ROS2_DISTRO + tools, usable on amd64 and arm64 |
| ros-desktop  | amd64       | ros-base             | ros-base + SIM tools (gazebo)                  |
| ros2-desktop | amd64       | ros2-base            | ros2-base + SIM tools (gazebo)                 |
| ros-dev      | amd64       | ros-desktop          | ros-desktop + development tools                |
| ros2-dev     | amd64       | ros2-desktop         | ros2-desktop + development tools               |

`base` containers are intended to be a minimal ROS environment with tools installed that allow the building of a deployable bundle (on `amd64` or `arm64`).

Sticking with ROS 1 for now, the base container is simply:

```bash
FROM ros:melodic-ros-base

RUN apt-get update \
    && apt-get install -y python3-apt python3-pip \
    && pip3 install catkin-tools
```

The desktop container (deriving from the base image):

```bash
FROM nnarain/ros-base:latest

RUN echo 'Etc/UTC' > /etc/timezone && \
    ln -sf /usr/share/zoneinfo/Etc/UTC /etc/localtime && \
    apt-get update && \
    apt-get install -q -y --no-install-recommends tzdata && \
    rm -rf /var/lib/apt/lists/*

# Install desktop tools packages
RUN apt-get update \
    && apt-get install -y ros-${ROS_DISTRO}-gazebo-ros-pkgs \
    && apt-get install -y ros-${ROS_DISTRO}-rviz \
    && apt-get install -y ros-${ROS_DISTRO}-rqt ros-${ROS_DISTRO}-rqt-common-plugins \
    && apt-get install -y ros-${ROS_DISTRO}-rqt-tf-tree
```

The `dev` image derives from the `desktop` image and installs various tools that I use:

```
FROM nnarain/ros-desktop:latest

ENV SCRIPTS_DIR /tmp/scripts
# Copy over setup scripts
COPY ./common/* ${SCRIPTS_DIR}/
RUN export PATH=$PATH:/tmp/scripts

# Setup dev environment
RUN apt-get update \
    && sh ${SCRIPTS_DIR}/setup-common.sh ${SCRIPTS_DIR} \
    && rm -rf /tmp/scripts
```

**Vscode Setup**

I use vscode's remote development package that allows working inside of a docker container. The following is the contents of `devcontainer.json`:

```json
{
    "name": "iRobot Create 2",
    "image": "nnarain/ros-dev:latest",

    "extensions": [
        "ms-vscode.cpptools",
        "twxs.cmake",
        "ms-python.python",
        "ms-python.vscode-pylance",
    ]
}
```

C++ intellisense config

```json
{
    "configurations": [
        {
            "browse": {
                "databaseFilename": "${default}",
                "limitSymbolsToIncludedHeaders": true,
                "path": [
                    "/opt/ros/melodic/include/",
                    "/workspaces/create_ws/devel/include/",
                    "/workspaces/create_ws/src/**",
                    "/usr/include/**"
                ]
            },
            "includePath": [
                "/opt/ros/melodic/include/",
                "/workspaces/create_ws/devel/include/",
                "/workspaces/create_ws/src/**",
                "/usr/include/**"
            ],
            "name": "ROS",
            "intelliSenseMode": "${default}",
            "compilerPath": "${default}",
            "cStandard": "gnu11",
            "cppStandard": "c++11"
        }
    ],
    "version": 4
}
```

I set `browse.path` and `includePath` to the same paths.

* `/opt/ros/melodic/include/` - ROS include directory
* `/workspaces/create_ws/devel/include/` - workspace include directory for built message types or other generated headers
* `/workspaces/create_ws/src/**` - recursive search the src directory of the workspace for local include files
* `/usr/include/**` - recursive search installed libraries (tf and pcl are installed here)

Two other important fields:

```json
    "cStandard": "gnu11",
    "cppStandard": "c++11"
```

The `cppStandard` field must be set to `c++11` not `gnu11`, which is what it might be auto-set to. If it is not intellisense will not work correctly.

**GUIs**

In order to use tools like Gazebo and Rviz an X server is required to run on the Windows host.


* Install `vcxsrv`
* Set the `DISPLAY` environment variable inside the docker container to `<host-ip>:0.0`
* Launch vcxsrv and config according to the following screen shot

![image not found!](/assets/2020/12/27/vcxsrv-config.png)

As far as I've been able to figure out, GUI tools inside the container will be using software rasterization, meaning the FPS will be fairly low. It's still usable but not ideal. I'd like to figure out if there is a way to use hardware accelerated graphics.
