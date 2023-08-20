---
layout: post
title: Dealing with Layer shift - Part 3
tag: ['3dprinting', 'ender3', 'prusa']
repo: 
---

Welp here we are again.. Another post about layer shifting... This has definitively been my top issues with the Ender 3.

**The Issue**

Consistent layer shifting on a 3D print.

![image not found!](/assets/2023/08/20/shift.jpg)

A bit hard to see but there's a shift in the red circle. Small but enough to annoy me. As you can see the problem happens at a specific spot.

Even more frustrating is that this shift occurs ~7h in a ~9h print.

**The Cause**

Hard to say but from past experience this is an issue with the printer not being able to handle the paths the slicer is generating.

![image not found!](/assets/2023/08/20/slicer.png)

Inspecting the paths it looked to me like these solid infill lines were the problem.

I tried to isolate the problem by cutting the model right below what I thought the problem point was.

![image not found!](/assets/2023/08/20/isolate-test.png)

However this piece printed fine..

**The Solution**

Only real option here is to reduce the speed of the solid infill and hop that makes a difference.

Luckily it did.

![image not found!](/assets/2023/08/20/settings.png)

I typically try reducing the print speed by 5mm/s every attempt.

**Thoughts**

The Ender 3 does usually pull through but it takes some work.
