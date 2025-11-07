---
layout: post
title: ROSCon 2025, Singapore!
tag: ['roscon']
repo: 
---

![image not found!](/assets/2025/11/04/ROSCon2025.png)


Another year and another oppurtunity to attend ROSCon, this time in Singapore!

As with every year I've attended ROSCon I'm very excited and eager to contribute. I believe I said the same thing last year and honestly haven't had much success contributing. Internally at work I've been pushing to open source some of our software and hope is on the horizon. But there are a few milestones to reach first. I was hoping to submit a talk this year, but unfortunately missed the deadline. I'm hoping to submit something for next year.


Unlike last year there was no central theme, that being Zenoh. Below I'll go over a few things I thought were interesting.


**Data Analysis Platforms**

A big focus for my work the last little while was determining what is the best way to data analysis and triage of our systems. So I took particular interest in two startups this year: Roboto.ai and Hexes.

Both offer a similar platform to each other in that they provide a way to upload ROS bag files and process the topics in a user defined way to detect anomalies.

Internally we've had the capabilty to process incidents from bags file by generating plots. But historically it lacks true automated analysis. We rely on experts to interpret the plots. This is one of my issues with Foxglove (not that it's not a great tool), in that it does visualization. Not necessarily analysis.

In the talk Roboto.ai did, they talked about something I thought was very intriguing. It was this "signal similarity search" using "Matrix Profiles". It enabled them to find like events in bag data, across different batches of data.

I think the option to index some existing analysis that was done and automatically reference it for another incident is very compelling.


**New Working Groups**

Seems like there are going to be a few new working groups in the community. 

One is the ROS graph working group which seem to be about how to use meaningfully declare components and monitor there health. I have a few ideas for this, so I'm hoping I can contribute in the future.

Another announcemed working group was the Embodied / Phhysical AI working group (Or this may have been a team within the ORSA?). The goal of this group is to standardize interfaces and patterns for bringing AI to the physical world. There's been some talk about making ROS as easy as possible for users to get up and running with. I've spent a lot of time on this problem myself over the years, so yet another thing I'm hoping to contribute to.

Then there's the ROS 2 Rust Working group. I did a bit of work on this project a few years ago and unfortunately have not had the time really contribute to it since. Yet another project I'd like to contribute too.

Someday maybe. Someday..

**Robots in the Wild**


![image not found!](/assets/2025/11/04/robot-in-the-wild.jpg)

![image not found!](/assets/2025/11/04/robot-in-the-wild-2.jpg)

Apparently Singapore has a long history of robotics and automation. They are several incentive programs for comanies doing robotics and it's not uncommon to see robots like these in the streets!

The first is a security robot from Kabam Robotics (they had a booth a ROSCon!). And the second is a street cleaning robot.

**Singapore!**

![image not found!](/assets/2025/11/04/super-trees.jpg)
![image not found!](/assets/2025/11/04/super-trees-2.jpg)
![image not found!](/assets/2025/11/04/skyline.jpg)

