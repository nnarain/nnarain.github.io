---
layout: post
title: ESP-01 Light Controller
tag: ["esp8266", "esp01", "arduino", "kicad", "homeautomation"]
repo_url: https://github.com/nnarain/esp-light-controller
---

This project is an ESP8266 based light strip controller to be used as controllable accent lights for my house.

Basically what I wanted to achieve here was a device running custom firmware that I can control from my home automation system.

Hardware Design
---------------

First thing to do is decide what kind of hardware is going to be used for this project. So I need to define exactly what I need.

I know I want RGB lighting so the obivious choice for that is the very common WS2812b RGB LED light strip.

The choice for the microcontroller also came pretty quick as well. I need wireless connectivity and only a single GPIO pin to driver the light strip. The ESP8266 is an inexpensive WiFi chip that would great for this application, the specific SOC I'm using is the ESP-01 (Two GPIO pins and about $1 USD).

Ok. So that I know the core pieces I need to build my application. I need to figure out how to interface everything together.

* Obiviously I need a voltage source to power the device
* The ESP8266 is a 3.3V chip
* The WS2812B needs 5V, meaning I need two voltage sources on the board (5V and 3.3V)
* The 3.3V ESP device needs to interface with the 5V light strip circuit. So level shifting the data signal is required.

**Power supply**

For the power supply I was planning on using a common 5V USB phone charger. The power input to the device is then simply a Micro-USB breakout.

On the schematic it look like:

![Image not found](/assets/2019/08/05/usb.png)

**3.3V Source**

As mentioned above a 3.3V source is required to power the ESP board. Here I simple use a 3.3V linear regulator

![Image not found](/assets/2019/08/05/33v.png)

**ESP-01**

Below in the ESP-01 pin out.

![Image not found](/assets/2019/08/05/ESP8266-PINOUT.png)

* In this application the serial communication is not used (it is used during development)
* Chip enable (CH_PD) is alway HIGH
* Reset (RST) is always HIGH

The ESP8266 has several boot modes configured by GPIO0 and GPIO2. For that we can refer to the following table. (GPIO15 is N/A in this case).

![Image not found](/assets/2019/08/05/espbootmode.jpg)

A normal boot requires both GPIO0 and GPIO2 to be pull HIGH.

Given all that information this is ESP-01 part of the schematic.


![Image not found](/assets/2019/08/05/espsch.png)

GPIO2 is also going to be used as the data signal for the LED strip and is pull HIGH (visible in the next diagram).

**Level shifting circuit**

To interface with the 5V part of the circuit and level shifting circuit is required. See below:

![Image not found](/assets/2019/08/05/levelshifter.png)

The input is `V1`.

When the input voltage is 3.3 V the gate-source voltage difference is 0, this causes the output to be pulled up to 3.3 V through R2.

When the input voltage is 0 V the gate voltage is pulled LOW, resulting in a gate-source voltage of 3.3 V. This allows the current to flow through the MOSFET,resulting in a output voltage of 0V.

![Image not found](/assets/2019/08/05/levelshifter2.png)


**Light strip connection**

![Image not found](/assets/2019/08/05/lightstripconnector.png)

Simple 3 pin connector for the LED strip.


**PCB Layout**

![Image not found](/assets/2019/08/05/pcb-layout.png)

The ESP-01 is going to sit in a 4x2 socket, so it if elevated slightly, leaving room for the MOSFET and resistors.

![Image not found](/assets/2019/08/05/3d.png)

In the future I'd probably spend more time on the 3D model especially if it was going in an enclosure.

Also I'd like to make a logo for myself I can stick in a kicad library and throw on my future boards.

Firmware
--------



