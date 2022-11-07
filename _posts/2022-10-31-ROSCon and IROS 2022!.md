---
layout: post
title: ROSCon and IROS 2022!
tag: ["roscon", 'iros', 'conference']
repo: 
---

![image not found!](/assets/2022/10/31/ROSCon2022-logo.svg)

This year I had the amazing opportunity to attend both ROScon and IROS in Kyoto Japan! As someone that hasn't been to a conference before (or traveling in general), this was quite the experience.

Now I usually do not talk about work on this blog, but this is a notably exception.

This post will contain some context on what I do at work, some interesting things I learned at ROSCon and things I'd like to do in the future.

**What I do**

My company builds Autonomous Mobile Robots (AMR) for industrial logistics. What I do is integrate the autonomous navigation stack with our robotic platforms. If the navigation stack is the brain, then I work on the spine, forwarding commands and feedback to and from actuators and sensors (to use an analogy I totally came up with myself).

For the last year and a half, I've been primarily working with ros_control and more specifically hardware_interface. One of the main things I wanted to get out of ROSCon was to learn more about ros2_control and if/how it could help with my needs (or if not, how I could contribute to it).

**ROSCon**

ROSCon was interesting because I got to see what other developer were doing with ROS.

Now when it comes to ros_control, I found that most people in the community focus primarily on controllers and developing algorithms in simulation. Not so much on the actual hardware interface and how the computer interacts with hardware. Which makes sense as that is the advantage of using ROS and architectures like ros_control that let you develop in a simulated environment. However, that's not really the situations I have to deal with. I have to deal with interfacing with arbitrary MCUs, motor controllers, battery management systems that go EOL on short notice, etc.

I've been working a lot on integrating a large variety of devices into ROS control's hardware interface and *think* there may be room to contribute something in the future (being intentionally vague here...).

Some more standardization and shared code for interfacing with hardware could go a long way. Which is what the HW interface working group is about https://discourse.ros.org/t/new-working-group-proposal-hardware-interface-working-group/23774

Something that came up more then I expected was the need for safety in robotic systems. I think it shows a progress developers using this neat "ROS" thing to using ROS in an actual product that needs to operate around people. There was also some talks on the traceability of safety requirements which was relevant to my team.

**IROS**

IROS was the first academic conference I attended. The key note presentation covered many subjects, ranging from practical medical robotics to the grand future of robots assisting humans in scientific experiments.

Admittedly a lot of this went over my head as I didn't have the theoretical background to grasp some of the advanced concepts covered in the ~10min presentations. However, I'm really glad I got a chance to go and experience it!

I think getting insight into medical robotics was the most interesting for me. That really felt like robotics that can change the world for the better.

I did also enjoy the presentations on aerial systems, that gave me more motivation to work on [Icarus]({% post_url 2022-07-16-Icarus Rev C %}).

**Future**

Hoping to attend ROSCon again in the future and in the mean time contribute more to the open source community!
