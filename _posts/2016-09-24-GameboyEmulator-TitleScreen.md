---
layout: post
title: Tetris Title Screen
description: Getting to the Gameboy title screen
tag: ["Gameboy", "C++"]
project_id: gameboy-emulator
repo: nnarain/gameboycore
---

Gameboy Emulator Progress Update:

**Copyright Screen**

Getting to the copyright screen was straight forward for the most part. There was however the problem on the tileset being drawn in signed mode. This was resolve later. As a temporary fix I forced drawing in unsigned mode.

![Image not found!](/assets/2016/09/24/copyright-screen.png)

**Getting past the Copyright Screen**

After getting to the Copyright screen nothing happened. I knew at this point it should move into the menu screen. So clearly there's a problem!

After some debugging I identified, what I believe is the Tetris "Main Loop".

```asm
; --- MAIN LOOP ??? ---
0343: call 29FA     ; sets FF in FF80 location -- potentially need to do something with joypad registers?
0346: call 0377
0349: call 7FF0     ; this path did not set FF80 location
034C: ldh A,(80)
034E: and 0F
0350: cp 0F
0352: jp Z,029A    
0355: ld HL,FFA6
0358: ld B,02
035A: ld A,(HL)
035B: and A
035C: jr Z,01
035E: dec (HL)
035F: inc L
0360: dec B
0361: jr NZ,F7
0363: ldh A,(C5)
0365: and A
0366: jr Z,04
0368: ld A,09
036A: ldh (FF),A  ; Enable Serial and VBlank Interrupts
036C: ldh A,(85)  ; load some value from ram
036E: and A       ; and with self
036F: jr Z,FB     ; go back if 0. Basically loop until non-zero value.
0371: xor A       ; clear A
0372: ldh (85),A  ; rest flag
0374: jp 0343    ; --- MAIN LOOP ??? ---
```

The program was looping at this section:

```asm
036C: ldh A,(85)  ; load some value from ram
036E: and A       ; and with self
036F: jr Z,FB     ; go back if 0. Basically loop until non-zero value.
```

Clearly a flag needs to be set and can only happen in a interrupt!

The only active interrupts were `Serial` and `VBlank`. Since it most likely wasn't the serial interrupt setting the flag I started debugging my `VBlank` interrupt handler.

After fixing interrupt I still wasn't at the menu screen. But some progress as the program moved pasted the loop.

The copyright screen started to blink:

![Image not found!](/assets/2016/09/24/copyright-blink.gif)

To make a long story short: The joypad register was giving the wrong values.

The Joypad inputs are pulled high by a resistor. So there default value should be all ones.

The Tetris game was seeing all the inputs held down, which I believe is meant to cause a soft reset of the program.

Look here in the main loop:

```asm
034C: ldh A,(80)
034E: and 0F
0350: cp 0F
0352: jp Z,029A
```

If the flag located at `$FF80` is not set correctly a jump to `$029A` occurs.

Here's a snippet of what happens at this location:

```asm

029A: ld A,01        ; -----------------------------
029C: di             ; Disable interrupts
029D: ldh (0F),A     ; Enables VBlank
029F: ldh (FF),A     ; Enable VBlank
02A1: xor A         
02A2: ldh (42),A
02A4: ldh (43),A
02A6: ldh (A4),A
02A8: ldh (41),A
02AA: ldh (01),A
02AC: ldh (02),A
02AE: ld A,80
02B0: ldh (40),A     ; Enable LCDC
02B2: ldh A,(44)
02B4: cp 94          ; Wait for LY register to be 94
02B6: jr NZ,FA
02B8: ld A,03        ; LCDC config
02BA: ldh (40),A
02BC: ld A,E4
02BE: ldh (47),A
02C0: ldh (48),A
02C2: ld A,C4
02C4: ldh (49),A
02C6: ld HL,FF26
02C9: ld A,80
02CB: ld (HL-),A
02CC: ld A,FF
02CE: ld (HL-),A
02CF: ld (HL),77
02D1: ld A,01
02D3: ld (2000),A   ; ROM bank switch
02D6: ld SP,CFFF    ; set stack pointer

```

A lot of register initialization and setup code. Note specifically the last two line. A ROM bank switch and setting the stack pointer.

Anyway thought that was interesting..

As I haven't implemented the Joypad interface yet. I ensure the first 4 bits of the Joypad register are always equal to `0xF`.

With this the soft reset no longer occurred and the program proceeded to the Title screen!

![Image not found!](/assets/2016/09/24/title-animation.gif)

**Drawing Sprites**

Currently I am trying to draw sprites to the screen. Current progress:

![Image not found!](/assets/2016/09/24/sprites.gif)

Issue with aligning the sprites correctly.
