---
layout: post
title: Genbu Robot - Nav2-ing
tag: [robotics, nav2, ros2, navigation]
repo: nnarain/genbu_robot
project_id: genbu-robot
---

Ok in the latest post I talked about some issues I was having.

## E-bay modification

First thing I did was expand the e-bay to accomadate the new bucks:

![image not found!](/assets/2026/07/03/ebay-expand-plan.jpg)
![image not found!](/assets/2026/07/03/ebay-expand-fusion.png)

I'm not really a 3d modelling person. What I did was split the model using a construction plane. Then translated one half by 55mm. Then used loft to re-combine them (I used loft because extrude didn't work and I wasn't sure why)

# Untethered driving

Ok battery and bucks tucked away. Charged. Wifi online. Time to try driving. I'm using foxglove and confirming that I can drive the robot over teleop.

{% include video.html webm="/assets/2026/07/03/foxglove-teleop.webm" %}

{% include video.html webm="/assets/2026/07/03/teleop-real.webm" %}

## Nav2 Driving

This is the robot driving using nav2 and I stop the video before it crashes into the wall lol.

{% include video.html webm="/assets/2026/07/03/nav2.webm" %}


that is all.
