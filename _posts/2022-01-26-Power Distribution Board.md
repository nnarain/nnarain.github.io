---
layout: post
title: Power Distribution Board
tag: ['electronics']
repo: nnarain/kratos-pdb
---

To go along with the [Icarus Controller]({% post_url 2021-11-28-Icarus Controller %}), I've designed a power distribution board that allows it to be connected to a battery.

**Scope**

I'd like this board to power several DIY projects, so it has a few requirements in mind.

* 30.5mm x 30.5mm mounting holes for drone frames
* Supply 5V, 3A continuous current
* Supply 3.3V
* Input: 2s - 6s LiPo batteries

5V @ 3A is the requirement for powering a Raspberry Pi 3B+.

**Design**

![image not found!](/assets/2022/01/26/schematic.png)

The design is fairly simple, I wanted to use a switch mode power supply for the main step down from the input voltage to 5V. This is more power efficient and will reduce heat dissipation. Then use a linear regular to step down to 3.3V from the 5V supply.

I also wanted to be able to slot the icarus board in like a "shield", so I created a schematic symbol / footprint that can be shared between the two projects.

![image not found!](/assets/2022/01/26/shield.png)

The PCB looks like the following:

![image not found!](/assets/2022/01/26/layout.png)

The shield layout will be incorporated into the REV B Icarus design.

**Result**

![image not found!](/assets/2022/01/26/kratos.jpg)
![image not found!](/assets/2022/01/26/kratos-power-on.jpg)
