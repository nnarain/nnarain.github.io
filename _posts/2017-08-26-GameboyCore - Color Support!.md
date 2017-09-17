---
layout: post
title: GameboyCore - Audio and Full Color Support!
description: 
tag: ['gameboy', 'emulator']
thumbnail: /assets/2017/08/26/
repo_url: https://github.com/nnarain/gameboycore
---


A few weeks ago I started tying off the last threads for completing the my GameboyCore project.

I've completed Audio and Color Support (a few bugs here). And I also added in the MBC5 so it should be compatible with the vast majoirty of Gameboy games out there!

Oh and here's a fun bug I had while adding in CGB mode. Basically I just forgot to read the flag specifing which bank to read the sprite's tile from.

![Image not found!](/assets/2017/08/26/wut.gif)

<br>

The goal is to start bringing things to a close. I want to fix the remaining color support graphic's bugs, an audio bug with Pokemon Gold/Silver/Crystal, and make some improvements to the MBC base class. 

That's quite a few things but I consider this project more or less 'complete'.
