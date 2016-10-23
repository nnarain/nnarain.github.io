---
layout: post
title: Passed Blarggs ROM Test!
description:
tag: ["Gameboy", "Emulator", "Assembly"]
thumbnail: /assets/2016/10/22/
repo_url: https://github.com/nnarain/gameboy.git
---

Successfully passed the `cpu_instrs.gb` ROM tests. This is really just the first stage of tests but it verifies I have working CPU emulation! Here's the output!

![Image not found!](/assets/2016/10/22/cpu_instrs.png)


The last issue I had to fix before this was a sneaky one, it had to do with DMG vs CGB modes and I had not done anything CGB related.

Look at the following disassembly:

```asm

C2F2: ldh A,(FF)  ; this code is a CGB speed switch routine
C2F4: push AF
C2F5: xor A
C2F6: ldh (FF),A
C2F8: ldh (0F),A
C2FA: ld A,30
C2FC: ldh (00),A
C2FE: ld A,01
C300: ldh (4D),A
C302: stop 00     ; Note the STOP 00 instruction!
C304: pop AF
C305: ldh (FF),A
C307: ret

```

That `STOP 00` is what got me. In CGB mode with switch CPU speed a `STOP 00` is preformed! Which stopped the execution of my CPU.

After figuring this out I added a check of this.

Bank to it!
