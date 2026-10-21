---
layout: post
title: ROS 2 and Pixi on a Raspberry Pi
tag: [ros2, pixi]
repo: nnarain/genbu_robot
project_id: genbu-robot
---

In a previous [post]({% post_url 2026-02-25-Deploying ROS on a Raspberry Pi using Docker %}) I talked about my setup of using Docker to deploy ROS on my robot's raspberry pi.

The reason I did that was so I could develop on my main dev machine with the robot packages and forks of other packages, push to github then deploy the entire ROS distro and source workspace using the container. All of this worked. However...

It was slow. I never really got the caching right in the Github Actions builds. So it was slow to build and it was also slow to download on the Pi. The developer flow was also not great. If I wanted to run a source workspace on the robot, I'd have to mount a directory into the container. I also think the multiple containers on the Pi, just isn't that practical from a hobbyist robot perspective.

This was a stackup of annoyances, to the point where I just didn't really want to work on the project that much. So I needed to think of something better. Now, again, the reason I did this was ease of deployment to the Pi, some form of CI where I can deploy artifacts to the Pi and cross compile.

Well, this year, including at [ROSCon]({% post_url 2026-09-27-ROSCon 2026, Toronto! %}) I heard of Pixi. The new hottness of ROS package management.

## What is Pixi?

Pixi is a package manager. In the context of ROS, you basically get a ROS virtual environment. This is pretty huge. It means ROS is not tied to the OS anymore and it also means ROS is not installing large amounts of APT package directly on your system. You don't need a container for isolated ROS dev environment.

Pixi uses Conda channels to store compiled binary artifacts from ROS packages. You can then pull those down into your virtual environment.

## Why Pixi?

I opted for Pixi for a few reasons.

1. New and shiny and on the OSRA roadmap
2. The virtual environment decouples the ROS distro from the underlying OS. So it can work on Raspberry Pi OS, or maybe some other linux dev board
3. It supports cross compiling to ARM
4. You can host your own conda channels

The last point there is kind of the crux of the whole operation. I'm using some older hardware. I need to compile/update the source myself. I want to be able to do that and self-host the artifacts, then have the raspberry pi install them.

## The Concept

Switch the deployment of my ROS environment to Pixi, host a channel on my server, tell the Pi where to download the environment and launch.

## The Plan

### The Server

So a conda channel is an AWS S3 bucket. I'm using `garage` for the server. The bucket is called `rospkgs` and you'd install packages in it per distro per architecture.

```
rospkgs/
    jazzy/
        linux64/
        aarch64/
```

I configured Caddy to point at is as `ros.home.lan`

```yaml
  rospixi-garage:
    # Garage recommends a fixed tag, not :latest. Check the release page when bumping.
    image: dxflrs/garage:v2.3.0
    container_name: rospixi-garage
    restart: unless-stopped
    volumes:
      - ./garage.toml:/etc/garage.toml:ro
      # Metadata is a database (sqlite/LMDB) — SSD or at least local disk.
      # Do NOT put this on the NFS mount: network filesystem semantics and a
      # database that must survive unclean shutdowns do not mix.
      - /srv/homelab/docker/rosdistro-store/rospixi-garage/meta:/var/lib/garage/meta
      # Object data (the packages themselves). Local disk as well — if you want
      # blobs on the NAS, give the VM a block device, don't use the NFS share.
      - /mnt/storage/homelab/docker/rosdistro-store/rospixi-garage/data:/var/lib/garage/data
    ports:
      - "3900:3900"        # S3 API
      - "3902:3902"        # public website endpoint (read path)
      - "3903:3903"        # admin API
    healthcheck:
      test: ["CMD", "/garage", "status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
```

```bash
docker compose exec rospixi-garage /garage bucket create ros-pkgs
docker compose exec rospixi-garage /garage bucket website --allow ros-pkgs
docker compose exec rospixi-garage /garage bucket allow --read --write --owner ros-pkgs --key ci-publisher
```

After the store is setup, pixi can publish to it.

```bash
pixi publish --path "$SRC" \
    --target-channel s3://ros-pkgs/jazzy --target-platform linux-64
```

you can also use `--target-platform linux-aarch64` to cross compile to ARM.

I spent sometime building a script that builds the packages I need from a distro file, build only what has changed and uploading it to the server. But it's mostly vibes so I'll spend some more time with it. This post is more about the end-to-end of developer machine to the raspberry pi.

### Deployment

Ok so now the ARM builds for the packages can be pushed to my server. I need to deploy the ROS distro + my packages onto the Raspberry Pi.

Pixi will resolve package by the order is finds them in the order of the configured channels

```bash
channels = [
  "https://ros.home.lan/jazzy",
  "https://prefix.dev/robostack-jazzy",
  "conda-forge",
]
```

So using this config, pixi on the raspberry pi will resolve package on my server first.

```yaml
[workspace]
name = "genbu-robot"
channels = [
  "https://ros.home.lan/jazzy",
  "https://prefix.dev/robostack-jazzy",
  "conda-forge",
]
platforms = ["linux-64", "linux-aarch64"]
preview = ["pixi-build"]            # for the pixi-build-* backends

# ── shared: what the robot needs to run ─────────────────────────────────────
[feature.ros.dependencies]
ros-jazzy-ros-base = "*"
ros-jazzy-genbu-bringup = "*"

# ── build toolchain: WSL, and on-Pi source builds ───────────────────────────
[feature.build.dependencies]
ros-jazzy-ament-cmake = "*"
cmake = "*"
ninja = "*"
compilers = "*"
pkg-config = "*"
colcon-common-extensions = "*"
vcstool = "*"

# ── environments ────────────────────────────────────────────────────────────
# One solve-group: all environments resolve together, so shared packages land on
# identical versions in all three and `robot` is a true subset of `dev`.
[environments]
robot-src = { features = ["ros", "build"], solve-group = "genbu" }
robot     = { features = ["ros"],          solve-group = "genbu" }

```

so with this config you can have just the robot environment or robot environment with build tools.

The systemd start script now sources the pixi environment before launch

```bash
# pixi run installs/syncs the environment from pixi.lock on first start (and
# after package updates that ship a new lock file), then launches the stack.
exec /usr/local/bin/pixi run \
    --manifest-path "${GENBU_PIXI_DIR}/pixi.toml" \
    -e "${GENBU_PIXI_ENV}" \
    ros2 launch genbu_bringup robot.launch.xml
```

To access the ROS environment I can do:

```bash
pixi shell -m /opt/genbu-robot/pixi.toml
```

**Some configuration issues**

Pixi initially rejected my server because because of the self signed certs. You have to configure pixi to use system certs and install the server certificate

`/etc/pixi/pixi.toml`

```toml
tls-root-certs = "system"
```

# Next Up

Well iterating on the robot should be easier now. And I want to share my build script once I clean it up. But so far this is a big improvement over the docker setup that I had.
