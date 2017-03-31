---
layout: post
title: Gameboy Emulator Project
description: Introduction to my Gameboy Emulator project!
tag: ["gameboy", "c++", "embedded"]
thumbnail: /assets/2016/09/11/tileset.gif
repo_url: https://github.com/nnarain/gameboy
next_post: 2016-09-11-Gameboy Emulator Setup
prev_post: 2016-09-10-Gameboy Display Information
---

Currently I am working on making a Gameboy Emulator!

I've wanted to do this for a while now. I have tried this before about 2 years ago however it... didn't work. And I ran out of time since school had started.

So now, while on my Co-op term I've decided to give it another go!!

**Current Goal**

The curent goal of this project is to make a working Gameboy emulator. At the moment I'm not concerned with emulating Super Gameboy or Gameboy Color. Also I am only supporting ROM that do not use ROM bank switching.

Also I wanted to have a reuaseable gameboy "core". Basically a library that you can link in any project and have a working Gameboy emulator. Abstracting IO so you can interact with the Gameboy emulator in a program. Maybe using it to create bots that play a Gameboy game.. Or anything of the sort.

Of course the core library can be used to make an emulator as well.

I'm also working a suite of tools as I go to debug the emulator. Such as the disassembler.

**Future Goals**

* Fully abstract Gameboy "core". In progress
* ROM bank switching
* Support for Super Gameboy and Gameboy Color
* Interactive debugger for reverse engineering ROMs

**Current Progress**

Currently I have successfully pulled the tile set from Character RAM and render to a window.

![Image not found!](/assets/2016/09/11/tileset.gif)
