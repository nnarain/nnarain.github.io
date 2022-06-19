---
layout: post
title: ESP32-C3-MINI-1 Dev Board
tag: ['electronics', 'esp32', 'esp32-c3', 'kicad']
repo: nnarain/devboard-factory
---

I've been thinking about redefining the scope of my [icarus]({% post_url 2021-11-28-Icarus Controller %}) flight controller.

While the generic board with a handful of PWM outputs make sense, I think at the moment I'm primarily focused on a project that would work indoors. It'd be a while before I ever committed to using real drone hardware.

To make Icarus work I'd also need a receiver. My short term plan was to create something with an ESP32. So more hardware to design, build and program.

So at the moment I'm planning a more "all-in-one" design that includes motor controllers and a receiver.

Though I've been struggling to find a RF module that Rust supports.

Enter...

**ESP32-C3-MINI-1**

I found out about the ESP32-C3 from a Ferrous Systems [blog post](https://ferrous-systems.com/blog/announce-esp-training/).

It is based on RISC-V architecture which is supported by Rust!

It has 15 IO, built-in USB Serial-JTAG Controller, WiFi / BLE, the usual SPI / I2C and even CAN (more on that in the future)!

So might be worth a look.

**The Dev Board**

Figured I'd make a dev board to test this module out.

![image not found!](/assets/2022/06/18/xdevrf03-schematic.svg)

Honestly not much to go over here. A USB-C connector supplies power (going through a 3.3V regulator). Boot and reset button to enter download mode.

This board use Adafruit's Feather form factor (though note it is not feather compliant at the moment).

![image not found!](/assets/2022/06/18/board.jpg)

**Firmware**

Using the esp-hal Rust example I've gotten a simple blinky program working. However, when using I2C the program seems to get caught in an endless loop.

I've run the official Espressif example and that seems to work. For example the i2ctool example:

![image not found!](/assets/2022/06/18/esp-idf-i2c-detect.png)

I can use the dev board to detect an MPU-6050 and read the value of the WHO_AM_I register.

So I suspect the issue is the Rust HAL code at the moment.

Either way, the board functional!
