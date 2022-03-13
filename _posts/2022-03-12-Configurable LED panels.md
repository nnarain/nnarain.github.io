---
layout: post
title: Configurable LED panels
tag: ['3dprinting', 'openscad']
repo: nnarain/shard-panel
---

Definitely not the first 3D printable LED panel out there. *But*, typically designs on thingiverse are nanoleaf clones.
So the design tends to be triangular. What if you want a square or a hexagon? What if you want to change the size?

Well this panel is designed using OpenSCAD, allowing the number of sides and most of the measurements to be adjustable.


**Design**

![image not found!](/assets/2022/03/12/hex-design.png)

There are two STLs produced from the SCAD file. The frame and the panel.

Key aspects of the frame design:

* Frame radius and number of sides is configurable
* Aim is for it to be strong with minimal material to print
* Each side has mounting holes for connecting multiple frames together
* Each side has a slot for running wires to adjacent frames

The panel radius will always be slightly smaller then the frame, so it can be slotted in (the clearance between the frame and the panel is adjustable).

Notes on the panel design:

* The thickness of the panel should be large enough that the slicer software will iron (smooth) the surface
* But not so thick it prevents light from passing through the panel


Side configuration demo:

![image not found!](/assets/2022/03/12/configuration.gif)

**Assembly**

For the interior electronics I'm just using an existing neopixels ring I had lying around, but in the future I'd like to make my own LED matrix PCB.

![image not found!](/assets/2022/03/12/interior.jpg)

Assembled with panel:

![image not found!](/assets/2022/03/12/assembled.jpg)

Results:

![image not found!](/assets/2022/03/12/much-colors.gif)

Future work:

I'd like to make this work with thingiverse's confgurator tool. That way anyone could get the panel they want.
