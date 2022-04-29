---
layout: post
title: LED Matrix PCB
tag: ['kicad', 'electronics']
repo: nnarain/led-matrix
---

In my [last post]({% post_url 2022-03-12-Configurable LED panels %}) I showed some configurable LED panels I designed using OpenSCAD. For the LEDs I used a neopixel ring I picked up a while back from Adafruit.

I figured that instead of buying these panels from Adafruit, I could design my own with as many LEDs or in whatever form factor I want.

**Design**

Simple 5x5 LED matrix:

![image not found!](/assets/2022/04/28/sch-matrix.png)

The panels can be chained together using the input and output ports

![image not found!](/assets/2022/04/28/sch-ports.png)

Well it doesn't get much more simple then that, does it?

**PCB Layout**

![image not found!](/assets/2022/04/28/view3d.png)

The PCB is also very simple. I debated on where to put the pads for the ports. At the moment they are on the bottom.

In the future I'll consider adding mounting holes.

**Testing**

Testing with my Arduino UNO

![image not found!](/assets/2022/04/28/panel.jpg)


![image not found!](/assets/2022/04/28/colors.gif)

