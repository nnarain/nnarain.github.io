---
layout: post
title: Gameboy Sound Information
description:
tag: ["Gameboy", "Emulator"]
thumbnail: /assets/2016/11/04/
repo: nnarain/gameboy
---

Four types of Sound generators:

* Quadrangular wave patterns with sweep and envelope functions.
* Quadrangular wave patterns with envelope functions.
* Voluntary wave patterns from wave RAM.
* White noise with an envelope function.

Noise Channel
-------------
**NR41 Sound Length**

Bit 0 - 5 is sound length data (t1).

```
Sound length = (64 - t1) * (1/256) seconds
```

**NR42 Volume Envelope**

* Bit 7 - 4: Initial volume (0 - 0x0F)
* Bit 3    : Envelope direction (0: Decrease, 1: Increase)
* Bit 2 - 0: Number of envelope sweep (0-7)

```
Length of 1 step = n * (1/64) seconds
```

**NR43 Polynomial Counter**

* Bit 7 - 4: Shift clock frequency (s)
* Bit 3: Count step/width (0 = 15 bits, 1 = 7 bits)
* Bit 2 - 0: Dividing Ratio of Frequencies (r)

```
Frequency = 524288 hz / r / 2^(s+1); For r = 0 -> r = 0.5
```

**NR44 Counter**

* Bit 7: Initial (1-Restart sound)
* Bit 6: Counter/consecutive selection (1=Stop output when length in NR41 expires)
