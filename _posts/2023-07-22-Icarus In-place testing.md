---
layout: post
title: Icarus In-place testing
tag: ['icarus', 'flight-controller']
repo: nnarain/icarus-firmware
---

Unfortunately in recent weeks I've not had much time for personal projects. I've been trying to get back into it.

This is basically the part of the project where I make the drone fly... so it's not particularly easy.

What I've done is 3D printed a testing mount that allows the FC to command the rotors without the drone actually taking off. I'm hoping to sort out the PID code on this test mount before trying to free fly.


![image not found!](/assets/2023/07/22/test-mount.jpg)

The drone is loosely zip tied to a dowel that threads through the test mount. That way it is free to move.

The drone is powered directly from an ATX power supply since my bench supply doesn't have a high enough current output.

![image not found!](/assets/2023/07/22/inplace-test.gif)

Not much progress at the moment. Finding the bluetooth connection to be somewhat inconsistent for attitude feedback.

Couple of things to try.

* Increase the resolution of the PWM output to 16-bits instead of 8-bit (right now there is only 50 steps between min and max throttle)
* The props are a bit small so motion is only happing at the high end of the throttle commands.
