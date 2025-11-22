---
layout: post
title: Gameboy Emulator Update - GUI!
description:
tag: ["Gameboy", "Emulator"]
thumbnail: /assets/2016/11/21/
project_id: gameboy-emulator
repo: nnarain/gameboycore
---

Updates
-------

* Correct Color Palette
* Per line rendering order issues
* Changed the way memory is accessed
* MBC2 and MBC3 support
* Qt GUI

GUI
---

For the actual Gameboy Emulator GUI I am using Qt. SFML is still being used but as the example program as it is a little easier on the setup.

Qt also provides everything else I'll need for this project such as modules for XML and Networking. Plus it's an actual native GUI!

![Image not found!](/assets/2016/11/21/gui.gif)

MBC3 support
------------

Now that the GameboyCore supports MBC3 it can play Pokemon Red!!

![Image not found!](/assets/2016/11/21/pokemonred.gif)

With MBC3 support (assuming it is working 100%) GameboyCore should be able to support the majority of Gameboy games out there.

TODO
----

* Audio
* Link port (over a network connection)
* MBC3 RTC
* MBC5

Note the TODO is for Gameboy support not Gameboy Color and Super Gameboy
