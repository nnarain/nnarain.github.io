---
layout: post
title: iRobot Create 2 - Mounting and Powering the Pi
tag: ['robotics', 'fusion', '3dprinting', 'electronics']
repo: 
project_id: genbu-robot
---

In my last post I figured out the battery mounting solution. The next step is to get the Raspberry Pi mounted and powered.

# Mounting the Raspberry Pi

As mentioned in [this post]({% post_url 2026-01-13-iRobot Create 2 - openGrid baseplate %}), I'm using openGrid for a flexible mounting solution. I designed this simple raspberry pi opengrid snap mount in fusion

![image not found!](/assets/2026/02/15/pimount.PNG)

![image not found!](/assets/2026/02/15/pimount-printed.jpg)

![image not found!](/assets/2026/02/15/pimounted.jpg)

The advantage of this opengrid setup is the existing ecosystem of parts. For example, this cable holder.

![image not found!](/assets/2026/02/15/cableholder.jpg)


# Power Distribution


The external battery is a TalentCell 12V, 6A battery. This of course needs to be stepped down using a buck converter.

![image not found!](/assets/2026/02/15/power.jpg)

The final amount of wiring looks like the following.

![image not found!](/assets/2026/02/15/mountedwithbattery.jpg)

# Next Steps

ROS 2 and remote teleop.

