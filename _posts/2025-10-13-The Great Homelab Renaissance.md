---
layout: post
title: The Great Homelab Renaissance
tag: ['homelab']
repo: 
project_id: homelab
---

Welp. It's been a year.

With the rise of LLMs in every aspect of life I felt it was necessary to learn more about how to use them in practical applications. In addtion to just using LLMs I wanted to have to capability to use them locally to maximize my data privacy, at least as much as I can these days.

I have posted about what I self host [here]({% post_url 2023-06-18-What I selfhost %}). For the most part this is just running applications that suit my needs. This isn't a very demanding setup.

In order to get started using LLMs locally... more horse power is needed.

# Hardware

**The Rabbit Hole**

There were some essential things I've been meaning to do for a while. 

1. RAID 1 configuration for my drives
2. IP Cameras
3. VLANs / More advanced firewall rules

With the addition of LLMs/AI workflows that requires beefier hardware, I figured it was time to get a server rack for new network gear.

**New Components**

For my server, I opted for:

* AMD Ryzen 9 7950X, 16-Core, 32 Threads
* GeForce RTX 3060 12GB
* 32GB of RAM
* 2x 4TB drives (I had these before)

I also needed a rackmount case I could fit and entire ATX system into.

**The Rack**

The server rack I got is an 18U rack. I figure that was enough for everything I had in mind.

![image not found!](/assets/2025/10/13/rack1.jpg)

This will be tucked away in a closet

![image not found!](/assets/2025/10/13/rack2.jpg)

**The Server**

Building my new server in a rackmount case that can fit a full ATX system

![image not found!](/assets/2025/10/13/case-and-motherboard.jpg)

And assembled

![image not found!](/assets/2025/10/13/assembled.jpg)


**In the Rack**

![image not found!](/assets/2025/10/13/rack-mounted.jpg)

# Software

I'm opting to use Proxmox to manage my system. The general plan is to have a small application VM and a beefier AI workload VM with GPU access.

At the moment I am migrating my original setup and purging anything I no longer use.

# Future

In a follow up post I'll go over the Proxmox, Docker and maybe Kubernetes setup.
