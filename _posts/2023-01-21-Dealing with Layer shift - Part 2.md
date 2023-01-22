---
layout: post
title: Dealing with Layer shift - Part 2
tag: ['3dprinting', 'ender3', 'prusaslicer']
repo: 
---

Unfortunately still experiencing a lot of layer shift on my Ender 3 Pro. It is exactly the same as the issue I experienced [early last year]({% post_url 2022-02-26-Curious Case of Y Axis Layer Shift %}).

However, I think I have a better handle of the issue this time around.

**The Issue I'm Having**

![image not found!](/assets/2023/01/21/the-problem.jpg)

**What I Know**

It's not the belts or the steppers. I rules that out in the post from last year.

**Examining the Issue**

Jumping back to the pommel of my [royal broadsword]({% post_url 2022-08-31-BotW - Royal Broadsword v2 %}):

I typically got layer shift while printing the rounded slopes of the pommel highlighted below:

![image not found!](/assets/2023/01/21/pommel.png)

Inspecting the slicer output I can see that there is some very tight back-and-forth solid infill (purple) paths going around the inside wall.

![image not found!](/assets/2023/01/21/pommel-slice.png)

This causes the hot end of the printer to vibrate rapidly and ultimately skip teeth on the gear belt (causing the shift).


Comparing this to the model I'm currently working on:

![image not found!](/assets/2023/01/21/blade-slice.png)

Looks like it's the same issue!

A bit of googling and it seems this is a relatively common issue in Prusaslicer:

* https://github.com/prusa3d/PrusaSlicer/issues/9245
* https://github.com/prusa3d/PrusaSlicer/issues/1054

**Fixing the Problem**

Welp, the issues on Github are still open... So there are only workarounds. Though now I have a goal, which is to reduce or remove those types of paths.

The Github issue has the following suggestion:

![image not found!](/assets/2023/01/21/settings1.png)

And that seems to have fixed it on the pommel:

![image not found!](/assets/2023/01/21/pommel-slice-fix.png)

Do I understand why? Can't say that I do..

Now for my current model it didn't remove the paths. However the paths are longer now. This reduces the vibration and I found this was enough to get the print going.

![image not found!](/assets/2023/01/21/blade-slice-fix.png)

Also suggested and I found to be helpful was increasing the number of perimeters.
