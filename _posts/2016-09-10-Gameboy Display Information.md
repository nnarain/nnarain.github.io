---
layout: post
title: Gameboy Display Information
description: Information on display the Gameboy's VRAM
tag: gameboy
thumbnail: /assets/2016/09/09/window-display.png
repo_url: https://github.com/nnarain/gameboy
prev_post: 2016-09-09-Gameboy LCD Controller
next_post: 2016-09-11-Gameboy Emulator Project
---

This post is a work in progress.

General
-------

* Screen buffer is `256x256` pixels. Or `32x32` tiles (tiles are `8x8` pixels)
* Only `160x144` pixels can be displayed on the screen
* Background wraps around to other side

Display
-------

![Image not found!](/assets/2016/09/09/window-display.png)

Uses register `WX` and `WY` to set starting position of the window display.


Scroll Registers
------------------

![Image not found!](/assets/2016/09/09/scroll-registers.png)

Scrolls the background screen horizontally and vertically.

LCD Display RAM
---------------

![Image not found!](/assets/2016/09/10/display-ram.png)

**Character RAM**

* Also called Tile RAM
* 192 tiles
* Each tile is `8x8` pixels. Each pixel is 2 bit color. Therefore 2 bytes per row of pixels.
* First byte is LSB and second is MSB

![Image not found!](/assets/2016/09/10/pixel.png)

* There are 2 Tile pattern tables. `$8000 - $8FFF` and `$8800 - $97FF`
  * First is used for sprites and the background, uses tile numbers 0 - 255
  * The second can be used for background and window display, uses tile numbers -128 - 127 where `$9000` is the center
    * Select using bit 4 of LCDC control register.


**Background Map Data**

* There are 2 Background map data locations in the memory map. One at `$9800 - $98FF` the other at `$9C00 - $9FFF`
* Selected using bit 3 in the LCDC control register.

**Window Overlay**

* Tiles can be drawn over the background tiles.

Bringing it together
--------------------

![Image not found!](/assets/2016/09/10/scroll-display.png)


**How to read tile patterns for background tile map**

1. Determine which memory range is being used for background map
  * Either `$9800 - $98FF` or `$9C00 - $9FFF`.
  * Selected using Bit 3 of LCDC control register
2. Determine Character Data range
  * Either `$8000 - $8FFF` (Range 1) or `$8800 - $97FF` (Range 2)
  * Bit 4 of LCDC control register.
3. Iterate through bytes in background tile map range that was determined (1)
  * If Range 1 of Character Data is selected
    * interpret byte from background map data as unsigned (0 - 255) and read tiles starting at `$8000`
  * If Range 2 of Character Data is selected
    * interpret byte as signed (-128 - 127) and read tiles staring at `$9000` 

Character Composition
---------------------

* `8x8` dot composition
* `8x16` dot composition
* 4 shades of gray
* 40 OBJ characters can be displayed on screen. 10 per line.
* Display data for OBH characters is stored in OAM `$FE00 - $FE9F`
    * y-axis coordinate
    * x-axis coordinate
    * character code
    * attribute data
