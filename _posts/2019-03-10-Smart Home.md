---
layout: post
title: Smart Home Setup
tag: ['smarthome', 'home-automation', 'docker']
repo_url: 
---

Recently I've been messing around a lot with self hosted software and home automation. Got a couple of smart plugs, a Google Home Mini and a started tinkering.

Currently I'm running Docker on my Raspberry Pi 3 B+. Having isolated containers running is a great way to keep the configuration clean. I don't have to worry about package version conflicts or have to write down steps to reconfigure the system if I'm ever required to do so. The server configuration is simply kept in the docker-compose file.

**Home Infrastructure Folder Structure**

My docker compose file is stored in a repo I've call `home-infrastructure`. Structure like the following:

```
home-infrastructure/
    packages/
    stacks/
        homeserver/
          configs/
          images/
          docker-compose.yml
        mediacenter/
          configs/
          images/
          docker-compose.yml
```

`packages` - Debian configuration packages

`stacks` - Docker stacks

* `configs` - Config files and folders that are mounted in into the docker containers.
* `debian` - Contains debians that are built for the home server. Currently this is just a `collectd` config for data collection.
* `images` - This folder is where custom docker containers are placed.

I have one docker stack for the home server and another for running on the "mediacenter" raspberry pi.

**Letsencrypt**

Letsencrypt is my frontend reverse proxy and responsible for managing SSL certificates. I'm using Letsencrypt to enable secure external access to my home automation system, this also allows home assistant to integrate with Google Home.

```yaml
  letsencrypt:
    image: linuxserver/letsencrypt
    container_name: letsencrypt
    cap_add:
      - NET_ADMIN
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/Toronto
      - URL=${DOMAIN}
      - SUBDOMAINS=wildcard
      - VALIDATION=duckdns
      - DUCKDNSTOKEN=${DUCKDNS_TOKEN}
      - EMAIL=nnaraindev@gmail.com
    volumes:
      - letsencrypt_certs:/config/etc/letsencrypt
      - ./configs/letsencrypt/nginx/proxy-confs:/config/nginx/proxy-confs
    ports:
      - 5080:80
      - 5443:443
    restart: unless-stopped
```

**Home Assistant**

Home assistant is what I'm using as my central home automation hub. Admittedly not much is going on there at the moment. I do have a MQTT broker setup as well to enable some custom components.

Home assistant docker config:

```yaml
  homeautomation:
    image: homeassistant/raspberrypi3-homeassistant
    container_name: homeassistant
    ports:
      - 8123:8123
    volumes:
      - ${HOME}/homeassistant:/config
      - /etc/localtime:/etc/localtime:ro
    depends_on:
      - mosquitto
    restart: unless-stopped

  mosquitto:
    container_name: mosquitto
    image: eclipse-mosquitto
    ports:
      - 1883:1883
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ./configs/mosquitto:/mosquitto/config:ro
      - mosquitto_data:/mosquitto/data
    restart: unless-stopped
```

I have a plan to make some wireless MQTT based RGB LED light strip controllers for accents lights in my living room but more on that in another post.

**Privacy and AD blocking**

To block ads, malware and phishing sites I am running PiHole. I've also coupled this with dnscrypt-proxy to provide DNS-over-HTTPS.

```yaml
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    environment:
      - ServerIP=192.168.0.2
      - TZ=America/Toronto
      - WEBPASSWORD=admin
      - DNS1='127.0.0.1#5053'
      - DNS2='1.1.1.1'
    volumes:
      - ./configs/pihole/pihole:/etc/pihole
      - ./configs/pihole/dnsmasq.d:/etc/dnsmasq.d
    dns:
      - 127.0.0.1
      - 1.1.1.1
    network_mode: host
    ports:
      - 80:80
      - 443:443
      - 53:53/tcp
      - 53:53/udp
      - 67:67/udp
    depends_on:
      - dnscrypt
    restart: unless-stopped

  dnscrypt:
    build: ./images/dnscrypt
    container_name: dnscrypt
    volumes:
      - ./configs/dnscrypt-proxy/dnscrypt-proxy.toml:/etc/dnscrypt-proxy/dnscrypt-proxy.toml
    dns:
      - 127.0.0.1
      - 1.1.1.1
    ports:
      - "5053:53/tcp"
      - "5053:53/udp"
    restart: unless-stopped
```

My router is configured to use the PiHole as its primary DNS server so all devices using DHCP should be passing requests through the PiHole. Some Google devices use Google's DNS server, 8.8.8.8, and unfornately the stock router from my ISP doesn't have the functionality to forward that traffic to the PiHole.

You can check your browser security [here](https://www.cloudflare.com/ssl/encrypted-sni/).

To take full advantage of PiHole and DNS over HTTPS I've also setup an OpenVPN server that I can access outside my network.

```yaml
  # Uses https://github.com/kylemanna/docker-openvpn.git
  # Docs: https://github.com/kylemanna/docker-openvpn/blob/master/docs/docker-compose.md
  openvpn:
    build: ./images/docker-openvpn
    container_name: openvpn
    cap_add:
      - NET_ADMIN
    volumes:
      - ./configs/openvpn:/etc/openvpn
    ports:
      - 1194:1194/udp
    restart: unless-stopped
```

**Local Services**

I'm running several other services that I find useful such as: Dokuwiki, grafanan, influxdb, radarr, sonar, etc.

Including a local APT repository. The purpose of running a local APT repo is to keep all debian config packages in the same place and installable over the network.

```yaml
  apt:
    build: ./images/apt
    container_name: apt
    ports:
      - 9000:80
    volumes:
      - ../../packages:/usr/share/nginx/html
```

APT repo `Dockerfile`:

```
FROM nginx:stable-alpine

RUN apk update && \
    apk add dpkg dpkg-dev tar

ADD ./bin /usr/local/bin
RUN chmod +x /usr/local/bin/*

VOLUME /usr/share/nginx/html
EXPOSE 80
```

This is really just nginx serving the package directory. I've included a script to manual update the repo.

`update-debs`

```sh
#!/bin/sh
cd /usr/share/nginx/html
dpkg-scanpackages . | gzip -9c > Packages.gz
cd -
```

And can be executed by running the following command:

```
$ docker-compose run apt update-debs
```


**What's next**

* Actual automations with HASS
* Custom MQTT based accent lights
