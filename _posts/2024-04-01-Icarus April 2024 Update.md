---
layout: post
title: Icarus April 2024 Update
tag: ['icarus']
repo: nnarain/gamepad-rc-firmware
---

Been a while since I did an Icarus update and wanted to close off the long weekend with a blog post.


I ran into an issue while testing controller input to the Icarus Flight Controller. The idea was to connect over bluetooth directly to a gamepad.

However running the Bluepad32 library along with the PID loop seems to be problematic. I feel like it *might* be possible with some interrupt driven logic but the issue with using Arduino libraries is you don't have an much control over how things how run.

Most flight controllers do not include a built-in receiver by design to keep things modular. So I figured I'd do something similar.

I'm creating a FC stack that will connect to a gamepad and send the throttle commands over serial to the flight controller. This separation of concerns should resolve my current issues and make the design more modular.

**Protocol Selection**

Originally I wanted to use SBUS to send the data, but has some quirks I don't care for (100000 baud which is a little odd and the inverted signal). Also the packaging of the channel data into the buffer is awkward since channels are 11-bits.

I'm using the same framing but simplifying to 4x 16-bit channels.

**Hardware Redesign**

I'm probably going to switch Icarus to an STM32F4 based design since the onboard bluetooth will no longer be necessary.
