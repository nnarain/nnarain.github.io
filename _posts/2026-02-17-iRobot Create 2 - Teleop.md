---
layout: post
title: iRobot Create 2 - Teleop
tag: [robotics, ros]
repo: 
project_id: genbu-robot
---

This is more of a quick milestone post as not too much additional work happened here from the last post.

I now have remote teleop working on my robot!

The iRobot Create 2 uses this driver from upstream: https://github.com/AutonomyLab/create_robot

Now this is fairly dated, and it looks like its not available in jazzy but building from source works fine.

# Pairing my PS4 Controller

```
sudo apt update
sudo apt install -y bluetooth bluez bluez-tools joystick
sudo systemctl enable bluetooth
sudo systemctl start bluetooth
```

Using `bluetoothctl`

```
power on
agent on
default-agent
scan on
```

Wait for something like

```
Wireless Controller XX:XX:XX:XX:XX:XX
```

then

```
pair XX:XX:XX:XX:XX:XX
trust XX:XX:XX:XX:XX:XX
connect XX:XX:XX:XX:XX:XX
```

stop scanning

```
scan off
exit
```


# Launching the base driver

```
ros2 launch create_bringup create_2.launch
```

For teleop I found the teleop launch file in create bringup seemed to have a parameter issue (probably a jazzy thing as the repo was last updated for iron). But I just launched the teleop twist node manually.

```
ros2 launch teleop_twist_joy teleop-launch.py
```

However for the twist commands to publish from the node, the `enable_button` on the controller needs to be pressed. This is different for every controller and there is apparently no provided configuration for the dualshock 4 controller. I had to create my own in a workspace with the correct enable_button configured.


# Teleop

{% include video.html webm="/assets/2026/02/17/robot-teleop.webm" %}
