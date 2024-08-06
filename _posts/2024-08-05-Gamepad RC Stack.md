---
layout: post
title: Gamepad RC Stack
tag: ['electronics', 'drone']
repo: nnarain/gamepad-rc-firmware
---

I mentioned in a [previous icarus post]({% post_url 2024-06-16-Icarus Rev E %}) that the RC commands are going to come from a dedicated board. This is more inline with your typical FC stack up and it offloads the compute time for the RF communication to another processor.

And for whatever reason I really want to be able to use my DualShock 4 controller so it has to be bluetooth.

This an ESP32 in a 20x20mm FC electronics stack form factor. It uses the [Bluepad32](https://github.com/ricardoquesada/bluepad32-arduino) library to connect to any bluetooth controller and sends the controller data over UART to the flight controller.

![image not found!](/assets/2024/08/05/gamepad-rc-stack.jpg)

# Design


**Power Supply**

![image not found!](/assets/2024/08/05/power-supply.png)

3.3V linear regulator. Input is just from two pin. No USB connector or USB-UART IC to save space.

**MCU**

The design is as simple as it gets. It's just the ESP32-WROOM with decoupling capacitors, two buttons for reset and bootloader mode and two leds for general status and connection status.

![image not found!](/assets/2024/08/05/schematic.png)
