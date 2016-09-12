---
layout: post
title: Gameboy LCD Controller
description: Information on the Gameboy's LCD controller
tag: gameboy
thumbnail: /assets/2016/09/09/window-display.png
repo_url: https://github.com/nnarain/gameboy
prev_post: 2016-09-09-Gameboy LCD Controller
---

This post is a work in progress.

Display
-------

![Image not found!](/assets/2016/09/09/window-display.png)

Uses register `WX` and `WY` to set starting position of the window display.


Scroll Registers
------------------

![Image not found!](/assets/2016/09/09/scroll-registers.png)

Scrolls the background screen horizontally and vertically.


Character RAM
-------------

* Also called Tile RAM
* Range `$8000 - $97FF`
* 192 tiles
* Each tile is `8x8` pixels. Each pixel is 2 bit color. Therefore 2 bytes per row of pixels.
* First byte is LSB and second is MSB


![Image not found!](/assets/2016/09/10/pixel.png)

* There are 2 Tile pattern tables. `$8000 - $8FFF` and `$8800 - $97FF`
  * First is used for sprites and the background, uses tile numbers 0 - 255
  * The second can be used for background and window display, uses tile numbers -128 - 127
