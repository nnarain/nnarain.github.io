---
layout: projects
name: Icarus Flight Controller
repo_url: https://github.com/nnarain/icarus
description: A custom-designed flight controller for micro quadcopters. Features STM32-based design with onboard IMU, magnetometer, and barometer. Supports multiple firmware implementations including Rust and C++.
date: 2021-11-28
tags: ["Drone", "Flight Controller", "Electronics", "STM32", "Rust", "Embedded"]
images:
  - /assets/2024/09/14/icarus-revf-preview.png
project_id: icarus-fc
---

## Overview

Icarus is a custom-designed flight controller board for micro quadcopters. Originally conceived as a general-purpose PWM controller, the project evolved into a specialized flight controller featuring modern embedded development with both C++ and Rust firmware implementations.

## Features

- STM32 microcontroller platform
- Onboard sensors: IMU, Magnetometer, Barometer
- Multiple hardware revisions (Rev A through Rev E+)
- Modular design with separate RC receiver stack
- Custom PCB design
- PID control implementation
- Support for various ESC protocols

## Technologies

- STM32 microcontroller
- Rust and C++ firmware
- KiCad for PCB design
- Embedded systems development
- Flight control algorithms
- Sensor fusion
