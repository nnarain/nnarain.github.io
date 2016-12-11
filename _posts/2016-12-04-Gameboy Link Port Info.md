---
layout: post
title: Gameboy Link Port Info
description:
tag: ['gameboy', 'emulator']
thumbnail: /assets/2016/12/04/
repo_url: https://github.com/nnarain/gameboycore
---

Gameboy Link Port Information
-----------------------------

**Registers**

![Image not found!](/assets/2016/12/04/regs.png)

The link port emulation isn't too bad once you break down the main points.


Bytes are *exchanged* between units. It is not like RS-232 with RX and TX lines. Two units will exchange bytes at the same time.

The reason is because the bytes are transfered by being shifted into a shift register.

![Image not found!](/assets/2016/12/04/clock.png)

This lead to the next point. Only one unit can clock the shift register at a time. The Gameboy can be configured into 2 clocking modes, `Internal` and `External`.

In `Internal` mode, the Gameboy in clock the shift register itself. In `External` mode, the Gameboy is waiting for the opponent unit, if any, to clock the shift register.

The Gameboy in `Internal` mode is the `Master` device and the Gameboy in `External` mode is the `Slave` device.
