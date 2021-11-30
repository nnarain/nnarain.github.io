---
layout: post
title: GameboyCore Retrospective
tag: ['emulator', 'gameboy']
repo: 
---

Small reflection on the GameboyCore projects and future projects.

**Github**

* [GameboyCore](https://github.com/nnarain/gameboycore)
* [GameboyCore Retro](https://github.com/nnarain/gameboycore-retro)
* [GameboyCore Python](https://github.com/nnarain/gameboycore-python)

**GameboyCore**

GameboyCore is a Gameboy emulator library written in C++. It is my first emulator project and was quite a lot of fun to work on.

I think a lot went right with this project. It is modular making it quite flexible to use. Like in the GameboyCore Retro project and GameboyCore Python.
It had tests from the start, though they are more integration tests and not really unit tests.

It's not technically complete, there is still the RTC register and some graphics bugs.

I think where this project lacked was useful tooling. I made a disassembler to debug ROMs. However it was naive in implementation and disassembled *everything* including data sections. It would have been advantagous to perform a proper disassembly following code paths and annotating common instructions. Eventually the disassembly did make its way into the debug window but was poorly optimized and a memory hog.

Also it would have been useful to have better execution control like single stepping or running until a certain address is hit. I did this through VS debugger and using `if` statements.

Something like:

```c++
if (pc == 0x4000)
{
    int x = 0; // break point here.
}
```

Which is really silly when you think about it.

**GameboyCore Retro**

I think creating a retro core from GameboyCore was a good move. I'm interesting in making the emulator not necessarily the GUI that goes with it. Especially considering I'll be working on multiple emulator projects and making individual GUIs for those would be tedious. I'd be inclined be make something more generic and RetroArch has already done that.


**GameboyCore Python**

GameboyCore Python is a Python API to GameboyCore. It allows you to create a gameboy core instance and manipulate it from scripts. I had made this with the intension of writing a bot/AI that can play a specific game. Inspired by the MarIO project. Though... I haven't really done anything on that front. It would be an interesting machine learning project to tackle.

Future Projects
---------------

I'll probably work on a NES and GBA emulator at some point in the future.

Currently I have started an NES project in Rust. I do like Rust but I wonder if I should continue doing things in C++ just for a sake of improving in that direction. Hm.

Before I get into the nitty gritty of a new emulator I'd like to build some tooling around it. 

First I'm going to write a NES disassembler that does a proper transversal of the data and only disassembles code.

Then I'm planning on making a debugger for my emulator projects. Something like a generic frontend that is fed information from the backend. Like the values of CPU registers or a specific range of memory. It would also allow run/step/runto control and display an annotated diassembly output. 


