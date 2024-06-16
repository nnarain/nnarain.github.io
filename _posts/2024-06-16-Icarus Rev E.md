---
layout: post
title: Icarus Rev E
tag: ['icarus', 'flight-controller', 'electronics']
repo: nnarain/icarus
---

Mentioned in my [last icarus update]({% post_url 2024-04-01-Icarus April 2024 Update %}) I had issues running the flight controllers PID loop and the bluepad library for talking to the controller.

I decided to swap the MCU to an STM32F405 instead of the ESP32-C3.

The RF comms will be done by a [Gamepad RC Stack](https://github.com/nnarain/gamepad-rc-firmware).

**New MCU**

![image not found!](/assets/2024/06/16/stm-sch.png)

I had this feeling I'd need to make this change a while back so luckily I've already designed a board with this MCU. See [STM32F405 Devboard]({% post_url 2023-04-22-STM32F4 Devboard %}).

Otherwise the schematic is effectively the same.
