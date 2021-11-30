---
layout: post
title: Added ImGui to GameboyCore Example
description: Added ImGui to GameboyCore Example
tag: ['Gameboy', 'Emulator', 'Gui']
thumbnail: /assets/2017/07/08/
repo: nnarain/gameboycore
---

Playing around with ImGui and tried adding it to the GameboyCore example.

![Image not found!](/assets/2017/07/08/cap.gif)

Added an output for CPU status including the values of the registers and interrupt flags.
Also added an output for the disassembly while the CPU is in debug mode, no longer defaults to printing to the console.
And finally added a panel to set the default color palette.

Its quite painless to add debug outputs like this. Planning on adding some for audio, when I finally get around to that.

Lastly, I was thinking about replacing the Qt with just ImGui+Boost. I think it will simplify the build and make distribution easier (and I like simplistic look better anyways).
