---
layout: post
title: Icarus Rev E - Firmware Bringup, Part 2
tag: ['icarus', 'electronics', 'rust', 'firmware', 'embedded']
repo: nnarain/icarus
---

I've been slowly working away on the firmware for the Rev E of Icarus. I'm basically back to where I was with the Rev D version, written in C++. I should be able to start testing PIDs again soon!

**About the Firmware**

The firmware is written using [Embassy](https://github.com/embassy-rs/embassy), an async framework for embedded devices. Personally I think async-io on embedded just "makes sense" and I think it's the future of embedded development and will probably be what pushes Rust past C++ for embedded.

The firmware is broken up into a few key tasks:

* RC input, for commands from the controller
* Sensors, for sensor fusion / state estimation
* Controls, PID control loops
* Telemetry, for sending data to a host machine for logging purposes

Each task interacts with queues (typically with just a size of 1 for the most recent data).

**RC Input**

The RC input is intended to be sent from a dedicated [Gamepad RC stack](https://github.com/nnarain/fc-stacks/tree/develop/blestack02). The data is received over UART using a bespoke protocol based on SBUS. I plan to use a new bus bus protocol in the future.

**Sensors**

Icarus has 3 onboard sensors: IMU, Magnetometer, and Barometer.

For now I'm only using the IMU for sensor fusion, but I'm planning on using the magnetometer in the future as well (The barometer is kind of a bonus).

The IMU data is passed through a AHRS algorithm to get orientation. The orientation is then passed to the controls task.

**Controls**

The control task takes the RC input and estimated state and feeds that into a PID controller for pitch and roll (yaw needs the magnetometer). The PID output is then mapped to PWM pins to drive the motors.


**Telemetry**

Used just for debugging, the telemetry task takes data like the state estimation and writes it over UART so I can log it.

**Future Work**

* PID tuning
* Updating the serial protocol used (I'm thinking about using OpenCyphal).
