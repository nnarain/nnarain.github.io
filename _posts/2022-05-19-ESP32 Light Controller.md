---
layout: post
title: ESP32 Light Controller
tag: ['electronics', 'wled', 'home-automation', 'esp32']
repo: nnarain/esp-light-controller
project_id: helios-light-controller
---

To go along with my [custom LED panels]({% post_url 2022-05-14-Assembled LED panels %}), I've design my own ESP32 based light controller.

This is an updated version of my [original ESP-01 based design]({% post_url 2019-08-05-ESP-01 Light Controller %}).

![image not found!](/assets/2022/05/19/view3d.png)

Key differences:

* ESP32 based
* SMD components
* Multiple LED channels
* USB connector and onboard USB to UART IC for easy flashing

# Design

**Power Supply**

The required voltages are: 3.3V for the ESP32 and 5V for the LED strips.

The power input is a USB-C connector, which supplies 5V and 3.3V is the output of a linear regulator.

![image not found!](/assets/2022/05/19/power-supply.png)


**MCU and USB UART**

Since the ESP32 does not have native USB support I added a CP2104 which handles USB-UART automatically.

![image not found!](/assets/2022/05/19/mcu-usb-uart.png)

**Strapping pins and boot mode**

![image not found!](/assets/2022/05/19/boot-mode.png)

The ESP32 will enter download mode if IO0 and IO2 are pulled down after reset.

Now, as it turns out, IO12 is also a "strapping pin" and is used to configure the SPI flash at start up. It needs to be pulled down for this ESP32 module. As you can see I have IO12 pulled up for LED channel 0. This prevented my controller from flashing, until I manually fixed it.

I've also included the auto-reset circuit so the ESP32 can be reset from USB-UART.

**Level Shifter**

![image not found!](/assets/2022/05/19/level-shift.png)

The 3.3V IO from the ESP32 needs to be level shifted up to 5V to match the LED strip. This circuit is a non-inverting level shifter.

As mentioned above I had IO12 pulled up when it should have been pulled down. To fix this I removed R4 and R7 and let the internal pull-down set IO12 to 0 logic level.

**LED ports**

![image not found!](/assets/2022/05/19/led-ports.png)

Large 1000uF caps are placed close to each LED port to prevent initial voltage spike from damaging the LEDs. Also a 100 ohm resistor is placed on the data line to prevent the initial flicker you typically see when connecting LED strips to an Arduino.

# Firmware

I'm using [wled](https://kno.wled.ge/) for the LED control firmware. In the settings menu the output GPIO pins can be selected.

# Results

![image not found!](/assets/2022/05/19/board.jpg)

As mentioned above I had to remove R4 and R7 to get the firmware flash to work. Though this seemed to prevent the auto-reset from working (where it did work before removing R4 and R7). Either way, download mode can be reached by using the boot button.

![image not found!](/assets/2022/05/19/panels.jpg)

# Future Work

WLED has a bunch of usermods I'd like to support like temperature sensors / fan control / buttons / etc.

Another thing I wanted to try was adding a USB-C power delivery sink controller to the board to request higher power levels from a supply.
