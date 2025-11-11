---
layout: post
title: Icarus Rev C
tag: ['electronics', 'kicad', 'embedded', 'flight-controller', 'drone']
repo: nnarain/icarus
project_id: icarus-fc
---

Well it wasn't that long ago I posted about the [Rev B]({% post_url 2022-05-13-Icarus Rev B %}) version of Icarus, so let's go over a little timeline of what these projects are for and why I'm at where I am now...

Following a bunch of issues I was having on my [quadruped prototype]({% post_url 2021-09-05-Quadruped Prototype %}) (particularly around multiple batches of servos breaking on me), I decided I wanted to design my own generic controller board. The idea was that it'd be effectively a programmable PWM controller, which I could use for diff-drive robots, quadrupeds or flight controllers.

I did always have the idea to build a flight controller in mind, but it always seemed a little too ambitious so I wanted to do some intermediate projects first.

The flight controller aspect of Icarus was actually supposed to follow the development of another board I've never mentioned before which was an Arduino Nano shield, creatively called "nanodrone". See image below (dragon for scale).

![image not found!](/assets/2022/07/16/nanodrone.jpg)

This board added support for controlling small DC motors. The idea is that it'd sit on top of an Arduino Nano, which includes an IMU, and I could use this set up as a micro-quad PoC.

I botched several revisions of this board and during the manufacturing/shipping wait time had designed Icarus.

I never got around to designing the frame for this board, but it felt needlessly bulky and overall I didn't like it..

Now the problems with Icarus Rev A/B:

Basically I has designed these boards with the idea that it'd be used with real drone hardware so a separate PDB was needed, see: [kratos-pdb]({% post_url 2022-01-26-Power Distribution Board %}).

Again, overly ambitious. It'd be a long long time before I ever realistically committed to using real drone hardware for this. Especially when I only really intended on using this indoors (assuming it ever actually flies).

I also didn't have a solid plan for the RC input. Either I'd have to design my own board, or use and off-the-shelf receiver and write my own driver. It'd be preferable if the RC input could be handled by the controller itself.

Eventually I learned about the ESP32-C3-MINI-1 module and decided to test it out on a dev board. See my [ESP32-C3 Dev Board]({% post_url 2022-06-18-ESP32-C3-MINI-1 Dev Board %}) post.

Ok. So.

Icarus Rev C
------------

So how does this revision solve the above problems.

Refined scoped:

* This is a microquad flight controller first
* Must control 4x DC brushed motors
* Powered from a single 1s LiPo battery
* IMU for state estimation
* Built-in radio module

No need for external components to handle motor power.

Powering from a single cell LiPo simplifies the power input so it can be done onboard. No need for a separate PDB.

Built-in radio module means there is no need for an external receiver.

**Power Supply**

![image not found!](/assets/2022/07/16/power-supply.png)

Not too different from what I've done in the past. There is a p-channel MOSFET + barrier diode used to isolate VBAT from VBUS. This circuit is copied from Adafruit and took me a bit to figure out. Basically the parasitic diode of the PMOS provides a small leakage current making VGS negative, switching the MOSFET on.

**Battery Charge**

![image not found!](/assets/2022/07/16/battery-charge.png)

A dedicated single cell LiPo charging IC is used to allow the battery to charge from VBUS when it is connected.

**Battery Sense**

![image not found!](/assets/2022/07/16/battery-sense.png)

Since the max battery input is well defined I've added a simple voltage divider that scales 4.2V to 2.5V (LiPo Max = 4.2V, ADC AREF = 2.5V).

Voltage is not the *best* way to do SoC. But good enough in this case. It's more of a bonus.

**Motor Controllers**

![image not found!](/assets/2022/07/16/motor-control.png)


Two DRV8837s are used in half-bridge configuration to control 4 DC motors.

In the future I'll probably add some 0Ohm resistor breaks to make both full and half bridge configuration possible (to allow the controller to be used for diff-drive).

This circuit was taken from nanodrone, which basically became a glorified DRV8837 breakout...

**Sensors**

![image not found!](/assets/2022/07/16/sensors.png)

Same sensors as Rev B.

**Stat LED**

A single WS2812 LED is used for the stat LED.

**MCU**

![image not found!](/assets/2022/07/16/mcu.png)

Not a lot of support hardware is needed for the module. This is the same setup as the dev board.


**PCB**

![image not found!](/assets/2022/07/16/pcb-layout.png)

Still using the same 30.5mm x 30.5 mm mounting holes. The board could probably be smaller, but I think this size allows for some additions in the future.

![image not found!](/assets/2022/07/16/render.png)

Been getting adding more silkscreen art to the boards as well is cool. Also made be a logo..

**Results**

![image not found!](/assets/2022/07/16/board.jpg)
