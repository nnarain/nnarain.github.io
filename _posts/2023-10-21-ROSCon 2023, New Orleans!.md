---
layout: post
title: ROSCon 2023, New Orleans!
tag: ["roscon", 'conference']
repo: 
---

![image not found!](/assets/2023/10/21/ROSCon2023.jpg)

This year I had another chance to participate ROSCon a conference for the open source robotics community.

It's always really inspiring to see such a large community of people come together to solve problems and I *hope* I'll be able to contribute in some way in the future.

Below I'm going to highlight some of the things I personally found interesting or related to my work.

**ROS 2 Realtime Workshop - Hightlights**

How realtime time is defined

* Servicing an event, processing data, doing an action within a fixed time constraint
    * Action A shall respond to condition B in C milliseconds
* It depends on the application
    * What does your system need to do and what are the constraints of that system?
    * “Realtime” can be extremely high performance systems OR slow systems (on the scale of days or weeks) if they respond in given time frame
* Determinism
* Not just for safety
    * At work we talk about realtime in the context of safety but a realtime system is just about time constraints
    * Example: Entertainment robots
* You don’t need a PREEMT_RT kernel
* ROS 2 is providing APIs and tools for designing and verifying realtime systems

To me this really helped to frame realtime in applications and how I can improve some of the software I've designed.

Some general techniques to keep in mind:

* OS scheduling priority
* Lock free queues
* Atomics

**Opening Highlights**

* A commitment to getting Rust in the build farm.
    * The hype is real
* General feature improvements and QoL
    * Bagging services (surprised this wasn't already a thing)
    * New default bag format (MCAP)

**Zenoh**

Zenoh has a new middleware for ROS 2. Overall I love to see a protocol aimed at being transport agnostic that is open source. It works on microcontrollers so you could have a zenoh firmware talk to ROS 2 natively (using the Zenoh middleware).

Apparently they are working on a safety certification which is a big deal in the embedded space.

**hal_ros_control**

This is effectively what I've spent the last two and a half years on. It probably doesn't meet all of my requirements out of the box but it has a lot of similar concepts to what I've designed or plan to do. I've seen it before but assumed it was mostly CNC based.

Effectively I'd be looking at having it support arbitrary fieldbus data.

**Configuration and validation options**

I learned there a some good libraries for parameter setting and validation. This is something I've been recently trying to solve in ROS 1 so I think this would be quite valuable for my applications.

**CLARE Software Stack**

A hypervisor based software stack for mix-criticality systems.

The value of this would be running safety certified software and non-safety certified software on the same processor.

https://accelerat.eu/clare

**Future**

Personally I'd like more of what I do at work to be open sourced and contribute to the community. In general I see it as a better approach to software development anyways. Modular and extendible code lets itself to being better structured.
