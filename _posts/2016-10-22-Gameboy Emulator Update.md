---
layout: post
title: Gameboy Emulator - Progress and issues
description:
tag: ["Gameboy", "Emulator"]
thumbnail: /assets/2016/10/22/
repo_url: https://github.com/nnarain/gameboy
---

Testing with Test ROMS
----------------------

Recently I [verified](https://github.com/nnarain/gameboy/issues/52) my CPU emulation against blaargs test roms. Which is definitively a sign of making progress!

I have successfully run all individual test roms and got a pass! Unfortunately I haven't passed the all-in-one test which need MBC1 support. I am confident my MBC1 support works and the problem lies with other issues, specifically the timer interrupt.

The timer interrupt is causing issues for multiple games. The blow games are running with the timer disabled.

Games!
------

But hey thinks are going good!

![Image not found!](/assets/2016/10/22/minesweeper.gif)
![Image not found!](/assets/2016/10/22/mario.gif)
![Image not found!](/assets/2016/10/22/kirby.gif)


Issues
------

Obvious incomplete rendering implementation. Basically I did my rendering wrong... I batch render the entire scene at VBlank instead of per line!

Issues with sprites and window overlay will be fixed when I implement per scan line rendering, which will happen after the timer issue is fixed!
