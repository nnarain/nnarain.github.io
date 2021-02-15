---
layout: post
title: iRobot Create 2 - Mounting a Raspberry Pi
tag: ['irobot', 'create2', 'robotics', 'openscad', 'raspberry-pi']
repo_url: https://github.com/nnarain/create-attachments
---

In my [previous post]({% post_url 2021-01-06-iRobot Create 2 - Navigation %}) I setup navigation on the iRobot Create 2 in Gazebo. Now it's time to get this running on the real thing!

The Raspberry Pi cannot be powered from the Create's serial cable so it required a separate battery (minimum 2500 mAH capacity).

And of course the Pi must be connected to the Create 2 via the provided serial cable.

At this point I had confirmed the Pi could talk to the Create 2, however I had no way to keep the Pi on the base of the robot (not to mention the tangle of loose wires).

The following is my first design for mounting a Raspberry Pi 3B+ to the Create 2's Deco cover.

OpenSCAD
--------

This time around I decided to create the models using OpenSCAD and used the libraries [NopSCADlib](https://github.com/nophead/NopSCADlib) and [BOSL](https://github.com/revarbat/BOSL).

* `NopSCADlib` - provides a framework for multi-part projects (and "vitamins")
* `BOSL`       - provides convenient transformation utilities and shapes

"Coding" solid models takes some getting used to, but I found it very interesting and the above libraries makes development easier.

What I found, is that you want to define the models design into a single array of data and use a function to build the model from that data. That allows you to share data (such as mounting hole spacing) between different parts.

The Attachment
--------------

![image not found!](/assets/2021/02/14/main_assembled.png)

The attachment has three parts:

* Left mounting block
* Right mounting block
* Pi base

The mounting blocks have circular feet that align with the deco cover's mounting holes (that need to be drilled). They are held in place by friction. Each block also has a "rail".

The Pi base, is where the Raspberry Pi sits. There is a hollow area under the Pi for the battery. The two arms of the Pi base have "sliders" that fit onto the mounting block "rails".

![image not found!](/assets/2021/02/14/rails-slider.png)

This was achieved using the `BOSL` library.

The stl file were exported from OpenSCAD and sliced using `UltiMaker Cura`, and printed on an Ender 3 Pro:

![image not found!](/assets/2021/02/14/printed.jpg)

And it worked! I was concerned about the necessary support material for the battery cavity but I removed it easily.

The thing I need to adjust is the alignment with the usb port (the thing not accounted for in the scad files in the vertical offset caused by the solder joints on the bottom of the PCB).
