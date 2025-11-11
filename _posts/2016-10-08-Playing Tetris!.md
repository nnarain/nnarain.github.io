---
layout: post
title: Playing Tetris!
description: Gameboy Emulator Update
tag: ['gameboy', 'emulator']
thumbnail: /assets/2016/10/08/
repo: nnarain/gameboycore
---

Update on my Gameboy Emulator!!

Implemented Joypad emulation and made some bug fixes to my CPU instruction implementation. Write tests!!!!!

Below is the current progress.

![Image not found!](/assets/2016/10/08/playtetris.gif)

Notice the blocks are the same. This is a bug. Initial thoughts on this are that its the way the Tetris program reads the divider register to generate random numbers.


Edit:

Yup. I had a bug incrementing the divider register!

![Image not found!](/assets/2016/10/08/playtetris2.gif)


Score is still in hex though!
