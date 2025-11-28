---
layout: post
title: What I selfhost
tag: ['selfhosted', 'homeserver', 'docker', 'vpn', 'media']
repo: 
project_id: homelab
---

I don't do many posts on my homeserver since it's mostly just running some services that I use and not much problem solving goes into it. However with the recent Reddit shenanigans I felt it was a good time to talk about what I self host and why.

**Why self-host?**

* Control over your data
* Data privacy
* Customization of the software you run for your needs

**The problems with self-hosting**

* Greater control means more overhead in managing your server
* Less redundancy (Hardware and drive failures. Backup solutions)
* Some services are just not as good (Google Maps / Gmail alternatives)

At the end of the day I do a lot of this for fun and most of this is not practical for the average person.

# Self Hosted Software

Ok. So now for my setup. Nothing super fancy so I'll go over it in broad categories.

## Hardware

My server is my old PC:

* Intel i5
* 2 TB hard-drive
* 8 GB RAM

## Core Software

All my self-hosted software runs in docker and I have a handful of docker-compose files for bringing up the stack. I'll include docker-compose snippets for my server setup below.

I try my best to tag specific docker versions so there an easy way to back track if an upgrade goes wrong.

## VPN

The only external access I provide for my server is a Wireguard VPN server. I use `wireguard-easy` for easily setting up client access.

```yaml
  wireguard_easy:
    image: weejewel/wg-easy
    container_name: wireguard_easy
    environment:
      - WG_HOST=<url>
      - PASSWORD=<password>
    ports:
      - 51820:51820/udp
      - 51821:51821/tcp
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    volumes:
      - wireguard_easy_data:/etc/wireguard
    sysctls:
      - "net.ipv4.conf.all.src_valid_mark=1"
      - "net.ipv4.ip_forward=1"
    restart: unless-stopped
```

## Front page book marks

Spending enough time setting up the server you probably already know what services are on what ports. That said it's nice to have a front page to go to, to access on the services. For this I use `Homarr`.

```yaml
  homarr:
    container_name: homarr
    image: ghcr.io/ajnart/homarr:0.11.1
    restart: unless-stopped
    volumes:
      - homarr_config_data:/app/data/configs
      - homarr_icon_data:/app/public/icons
    ports:
      - 7575:7575
    restart: unless-stopped
```

## Docker administrations

I use `portainer` to access logs and general start/restart needs.

```yaml
  portainer:
    container_name: portainer
    image: portainer/portainer:linux-amd64-2.0.1
    ports:
      - 9000:9000
    volumes:
      - portainer_data:/data:rw
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

## Knowledge base

This has evolved over time quite a bit.

I originally started with `Dokuwiki` for the simplicity. I found the custom syntax is not really what I wanted. I then moved to `Bookstack` for its editor and simple shelf/book/chapter/page system. Now I'm somewhere between `Bookstack` and `SilverBullet` for my knowledge base. I like `SilverBullet`'s text based system and plugs system but haven't settled (a good Android app might sell it for me).

* https://www.dokuwiki.org/dokuwiki
* https://www.bookstackapp.com/
* https://github.com/silverbulletmd/silverbullet

```yaml
  dokuwiki:
    image: linuxserver/dokuwiki
    container_name: dokuwiki
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=${TZ}
    ports:
      - 8001:80
    volumes:
      - dokuwiki_data:/config
    restart: unless-stopped

  bookstack:
    image: ghcr.io/linuxserver/bookstack:22.07.3
    container_name: bookstack
    environment:
      - PUID=1000
      - PGID=1000
      - APP_URL=http://${HOMESERVER_IP}:6875
      - DB_HOST=bookstack_db
      - DB_USER=bookstack
      - DB_PASS=bookstack
      - DB_DATABASE=bookstack
    volumes:
      - bookstack_data:/config
    ports:
      - 6875:80
    restart: unless-stopped
    depends_on:
      - bookstack_db

  bookstack_db:
    image: ghcr.io/linuxserver/mariadb
    container_name: bookstack_db
    environment:
      - PUID=1000
      - PGID=1000
      - MYSQL_ROOT_PASSWORD=bookstack
      - TZ=America/Toronto
      - MYSQL_DATABASE=bookstack
      - MYSQL_USER=bookstack
      - MYSQL_PASSWORD=bookstack
    volumes:
      - bookstack_db_data:/config
    restart: unless-stopped
```

## Code

Instead of using Github or Gitlab private repos, I use Gitea. I also use it to mirror my Github profile.


```yaml
  gitea:
    image: gitea/gitea:latest
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - APP_NAME="Gitea"
      - DOMAIN=${HOMESERVER_IP}:8004
      - ROOT_URL=${HOMESERVER_IP}:8004
      - DB_TYPE=postgres
      - DB_HOST=gitea_db:5432
      - DB_NAME=gitea
      - DB_USER=gitea
      - DB_PASSWD=gitea
    volumes:
      - gitea_data:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "8004:3000"
      - "222:22"
    depends_on:
      - gitea_db
    restart: unless-stopped

  gitea_db:
    image: postgres:9.6
    environment:
      - POSTGRES_USER=gitea
      - POSTGRES_PASSWORD=gitea
      - POSTGRES_DB=gitea
    volumes:
      - gitea_db_data:/var/lib/postgresql/data
    restart: unless-stopped
```

## File, Photos and Synchronization

I use `syncthing` to sync files between the various systems. This is this probably one of the core things I rely on and it works flawlessly.

I keep all my files in a single docker volumes and mount that into different containers.

I use `nextcloud` for web access, though I'm currently looking for alternatives.

```yaml
  syncthing:
    image: linuxserver/syncthing
    container_name: syncthing
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=${TZ}
      - UMASK_SET=022
    volumes:
      - syncthing_config_data:/config
      - myfiles_data:/data
    ports:
      - 8006:8384
      - 22000:22000
      - 21027:21027/udp
    restart: unless-stopped

  nextcloud:
    image: linuxserver/nextcloud
    container_name: nextcloud
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=${TZ}
      - POSTGRES_HOST=nextcloud_db
      - POSTGRES_DB=nextcloud
      - POSTGRES_USER=nextcloud
      - POSTGRES_PASSWORD=nextcloud
    depends_on:
      - nextcloud_db
      - syncthing
    volumes:
      - nextcloud_config_data:/config
      - nextcloud_data:/data
      - myfiles_data:/shared
    ports:
      - 8002:443
    restart: unless-stopped
```

I use `photoprism` for photos:

```yaml
  photoprism:
    image: photoprism/photoprism:latest
    container_name: photoprism
    depends_on:
      - photoprism_db
    restart: unless-stopped
    security_opt:
      - seccomp:unconfined
      - apparmor:unconfined
    ports:
      - "8011:2342"
    environment:
      PHOTOPRISM_ORIGINALS_PATH: /myfiles/pictures/originals
      PHOTOPRISM_IMPORT_PATH: /myfiles/pictures/imports
      HOME: "/photoprism"
    working_dir: "/photoprism"
    volumes:
      - myfiles_data:/myfiles
      - photoprism_storage_data:/photoprism/storage
```

Photoprism is missing a good Android app that would make it the good Google Photos replacement. Right now I manually upload pictures to photoprism (I could take a lot of pictures anyways).

**Note taking**

I've been using `Joplin` for note taking. And the android app is a good "google wallet" type service for easily accessing PDFs.

```yaml
  joplin:
    image: joplin/server:latest
    container_name: joplin
    depends_on:
      - joplin_db
    ports:
      - 22300:22300
    environment:
      - APP_BASE_URL=homeserver
      - DB_CLIENT=pg
      - POSTGRES_PASSWORD=joplin
      - POSTGRES_DATABASE=joplin
      - POSTGRES_USER=joplin
      - POSTGRES_PORT=5432
      - POSTGRES_HOST=joplin_db
    restart: unless-stopped

  joplin_db:
    image: postgres:latest
    container_name: joplin_db
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=joplin
      - POSTGRES_USER=joplin
      - POSTGRES_DB=joplin
    volumes:
      - joplin_data:/var/lib/postgresql/data
```

Files and sync'd to the phone using syncthing. I've used this a few times last year to hold my flight info and COVID-19 vaccine passport.

## Privacy

I use Pi-hole as my DNS sinkhole (though these days I've heard there are better alternatives)


**Ad blocker**

```yaml
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    environment:
      - ServerIP=${PIHOLE_EXTERNAL_IP}
      - TZ=${TZ}
      - WEBPASSWORD=admin
      - DNS1='127.0.0.1#5053'
      - DNS2='1.1.1.1'
      - INTERFACE=${PIHOLE_INTERFACE}
    network_mode: host
    cap_add:
      - NET_ADMIN
    volumes:
      - pihole_data:/etc/pihole
      - pihole_dnsmasq_data:/etc/dnsmasq.d
    dns:
      - 127.0.0.1
      - 1.1.1.1
    ports:
      - 80:80
      - 443:443
      - 53:53/tcp
      - 53:53/udp
      - 67:67/udp
    depends_on:
      - dnscrypt
    restart: unless-stopped
```

**Password Manager**

Not explicitly a docker container but I use `KeePass` as my password manager and sync the database file using syncthing. I use `KeePassDX` on mobile to access it.

## Media Stack

For.. err.. educational purposes.. I run a media stack using Sonarr, Radarr and Jellyfin.

All the torrenting and what not happens behind a VPN using `gluetun` to connect to Mullvad's VPN service

```yaml
  gluetun:
    image: qmcgaw/gluetun
    container_name: gluetun
    cap_add:
      - NET_ADMIN
    environment:
      - VPN_SERVICE_PROVIDER=mullvad
      - VPN_TYPE=wireguard
      - WIREGUARD_PRIVATE_KEY=...
      - WIREGUARD_ADDRESSES=...
      - SERVER_CITIES=...
      - FIREWALL_OUTBOUND_SUBNETS=192.168.0.0/24
    ports:
      # Port mapping for qBittorrent / Radarr / Sonarr / Jackett
      # Torrent
      - 9003:8080
      - 6881:6881
      - 6881:6881/udp
      # Radarr
      - 7878:7878
      # Sonarr
      - 8989:8989
      # Readarr
      - 8787:8787
      # Prowlarr
      - 9696:9696
      # Jackett
      - 9117:9117
      # FlareSolverr
      - 8191:8191
      # Bazarr
      - 6767:6767
```

My download client is `qbittorrent`

```yaml
  qbittorrent:
    image: linuxserver/qbittorrent:4.5.0
    container_name: qbittorrent
    depends_on:
      - gluetun
    network_mode: "service:gluetun"
    volumes:
      - qbittorrent_data:/config
      - ./configs/qbittorrent/qBittorrent.conf:/config/qBittorrent/qBittorrent.conf
      - media_download_data:/downloads
    environment:
      - PUID=1000
      - PGID=1000
      - UMASK=002
      - WEBUI_PORT=8080
    restart: unless-stopped
```

Movies and TV shows

```yaml
  radarr:
    image: linuxserver/radarr:4.4.4
    container_name: radarr
    network_mode: "service:gluetun"
    environment:
      - TZ=America/Toronto
      - PGID=1000
      - PUID=1000
    volumes:
      - radarr_data:/config
      - media_download_data:/downloads
      - media_movie_data:/data/movies
      - /etc/localtime:/etc/localtime:ro
    #ports:
    #  - 7878:7878
    depends_on:
      - qbittorrent
    restart: unless-stopped

  sonarr:
    image: linuxserver/sonarr:3.0.8
    container_name: sonarr
    network_mode: "service:gluetun"
    environment:
      - TZ=America/Toronto
      - PUID=1000
      - PGID=1000
    volumes:
      - sonarr_data:/config
      - media_download_data:/downloads
      - media_tvshow_data:/data/tv
      - /etc/localtime:/etc/localtime:ro
    #ports:
    #  - 8989:8989
    restart: unless-stopped
    depends_on:
      - qbittorrent
```

I found `prowlarr` to be the best way to handle indexers

```yaml
  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: prowlarr
    network_mode: "service:gluetun"
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - prowlarr_data:/config
    #ports:
    #  - 9696:9696
    restart: unless-stopped
```

I run `Bazzar` for subtitles, but unsure how useful it is:

```yaml
  bazarr:
    image: lscr.io/linuxserver/bazarr:latest
    container_name: bazarr
    network_mode: "service:gluetun"
    environment:
      - PUID=1000
      - GUID=1000
      - TZ=America/Toronto
    volumes:
      - bazarr_data:/config
      - media_movie_data:/movies
      - media_tvshow_data:/tv
    restart: unless-stopped
```

I use Jellyfin to actually watch movies and shows:

```yaml
  jellyfin:
    image: linuxserver/jellyfin:10.8.1
    container_name: jellyfin
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=${TZ}
    volumes:
      - jellyfin_data:/config
      - media_tvshow_data:/data/tvshows
      - media_movie_data:/data/movies
    ports:
      - 8096:8096
    restart: unless-stopped
```

Typical indexer don't work well for books, but I run `Readarr` as well:

```yaml
  readarr:
    image: ghcr.io/linuxserver/readarr:nightly
    container_name: readarr
    network_mode: "service:gluetun"
    environment:
      - TZ=America/Toronto
      - PUID=1000
      - PGID=1000
    volumes:
      - readarr_data:/config
      - calibre_books:/books
      - media_download_data:/downloads
    #ports:
    #  - 8787:8787
    restart: unless-stopped
```

For books I use `calibre` and `calibre-web`

```yaml
  calibre:
    image: ghcr.io/linuxserver/calibre:latest
    container_name: calibre
    environment:
      - PUID=1000
      - GUID=1000
      - TZ=${TZ}
      - PASSWORD=calibre
    volumes:
      - calibre_data:/config
      - calibre_books:/books
      - calibre_upload_data:/uploads
      - calibre_plugins_data:/plugins
    ports:
      - 8080:8080
      - 8081:8081
    restart: unless-stopped

  calibre-web:
    image: ghcr.io/linuxserver/calibre-web
    container_name: calibre-web
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - calibre_web_config_data:/config
      - calibre_books:/books
    restart: unless-stopped
    depends_on:
      - calibre
    ports:
      - 8083:8083
```

Calibre support Kobo sync. So I buy ebooks on the kobo store buy upload to my server and manage through calibre-web.

## Back ups

Probably the most fundemental part of a home server. Running back ups.

I started using `duplicati` but it has a known issue where the database corrupts.. So I wouldn't recommend.

I currently use `borg` plus `b2` sync to upload to back blaze.

```yaml
  # Data backup
  # Borg backup -> b2_sync -> backup remote
  borg:
    container_name: borg
    build:
      context: ./images/borg_cron
      dockerfile: Dockerfile
    environment:
      - BORG_REPO=/repo
      - BORG_PASSPHRASE=...
    volumes:
      - backup_data:/repo
     # Data to backup is mounted under /data
      - myfiles_data:/data/docker/myfiles_data:ro
      - nextcloud_config_data:/data/docker/nextcloud_config_data:ro
      - nextcloud_db_data:/data/docker/nextcloud_db_data:ro
      - syncthing_config_data:/data/docker/syncthing_config_data:ro
      - dashmachine_data:/data/docker/dashmachine_data:ro
      - dokuwiki_data:/data/docker/dokuwiki_data:ro
      - bookstack_data:/data/docker/bookstack_data:ro
      - bookstack_db_data:/data/docker/bookstack_db_data:ro
      - gitea_data:/data/docker/gitea_data:ro
      - gitea_db_data:/data/docker/gitea_db_data:ro
      - calibre_books:/data/docker/calibre_books:ro
      - mealie_app_data:/data/docker/mealie_app_data:ro
      - rclone_config_data:/data/docker/rclone_config_data:ro
      - wireguard_data:/data/docker/wireguard_data:ro
      - wireguard_easy_data:/data/docker/wireguard_easy_data:ro
      - influxdb_data:/data/docker/influxdb:ro
      - paperless_data:/data/docker/paperless_data:ro
      - paperless_media:/data/docker/paperless_media:ro
      - paperless_db_data:/data/docker/paperless_db_data:ro
      - photoprism_storage_data:/data/docker/photoprism_storage_data:ro
      - photoprism_db_data:/data/docker/photoprism_db_data:ro
      - silverbullet_data:/data/docker/silverbullet_data:ro
    restart: unless-stopped

  b2_sync:
    container_name: b2_sync
    build:
      context: ./images/b2_sync
      dockerfile: Dockerfile
    environment:
      - B2_APPLICATION_KEY_ID=${B2_KEY_ID}
      - B2_APPLICATION_KEY=${B2_APP_KEY}
      - INPUT_DIR=/backup
      - BUCKET_NAME=...
    volumes:
      - backup_data:/backup:ro
    restart: unless-stopped
```

I selectively mount the data I want to backup into the borg container. Then a cron job runs the borg snapshot every day. When the snapshot is done the `b2` process runs.

The problem with this is I really should turn off services before running the backup.

The other issue is I am not automating restore testing. Which I really should be doing.

## Notifications

Use `ntfy` for notification from my server.

```yaml
  ntfy:
    container_name: ntfy
    image: binwiederhier/ntfy:v1.27.2
    command: serve
    restart: unless-stopped
    environment:
      - TZ=${TZ}
      - NTFY_BASE_URL=http://${HOMESERVER_IP}:8017
      - NTFY_ATTACHMENT_CACHE_DIR=/var/cache/ntfy/attachments
    ports:
      - 8017:80
    volumes:
      #- ./configs/ntfy/etc/ntfy/server.yml:/etc/ntfy/server.yml:ro
      - ntfy_cache_data:/var/cache/ntfy
      - ntfy_data:/etc/ntfy
```

## Misc. Services

Other services I use.

**Recipes**

For tracking recipes I use mealie.

```yaml
  mealie:
    image: hkotel/mealie:frontend-v1.0.0beta-5
    container_name: mealie-frontend
    environment:
    # Set Frontend ENV Variables Here
      - API_URL=http://mealie-api:9000 # 
    restart: unless-stopped
    depends_on:
      - mealie-api
    ports:
      - "8007:3000" # 
    volumes:
      - mealie_app_data:/app/data/

  mealie-api:
    image: hkotel/mealie:api-v1.0.0beta-5
    container_name: mealie-api 
    volumes:
      - mealie_app_data:/app/data/
    environment:
    # Set Backend ENV Variables Here
      - ALLOW_SIGNUP=true
      - PUID=1000
      - PGID=1000
      - MAX_WORKERS=1
      - WEB_CONCURRENCY=1
    restart: unless-stopped
```

**API automation**

I use `N8N` for automation tasks using webhooks and APIs. For example, I route sonarr and radarr notification through n8n to ntfy for media notifications.

```yaml
  n8n:
    container_name: n8n
    image: n8nio/n8n:0.188.0
    ports:
      - 5678:5678
    volumes:
      - n8n_data:/home/node/.n8n
```

# Future work

Some day I'll get around to doing some actual home automation and actual you my light controller project.
