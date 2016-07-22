---
layout: post
title: Gameboy Hardware Specs and Memory Layout
description: Outline the specifications for the Gameboy's hardware
tag: gameboy c++
thumbnail:
repo_url:
---

Hardware Specs

| CPU         | Z80                        |
| Clock       | ~4.2 MHz                   |
| Work RAM    | 8 kB                       |
| Resolution  | 160x144 (20x18 tiles)      |
| Max Sprites | 40 per screen, 10 per line |
| Sprite Size | 8x8, 8x16                  |
| Palettes    | 1x4 BG, 2x3 OBJ            |
| Colors      | 4 gray shades              |
| Sound       | 4 channel with stereo      |

**Memory map Information**

Gameboy CPU memory map overview `$0000 - $FFFF`

|  Address Range      |  Description                      |
| :-------------: | :-------------------------------: |
| $FFFF           | Interrupt Enable Flags            |
| $FF80 - $FFFE   | High RAM                          |
| $FF00 - $FF7F   | IO                                |
| $FEA0 - $FEFF   | Unuseable Memory                  |
| $FE00 - FE9F    | OAM (Object Attribute Memory)     |
| $E000 - $FDFF   | Echo RAM - Do not use             |
| $D000 - $DFFF   | Internal RAM Banks 1-7 switchable |
| $C000 - $CFFF   | Internal RAM Bank 0 Fixed         |
| $A000 - $BFFF   | Cartridge RAM (if available)      |
| $9C00 - $9FFF   | Background Map Data 2             |
| $9800 - $9BFF   | Background Map Data 1             |
| $8000 - $97FF   | Character RAM                     |
| $4000 - $7FFF   | Cartridge ROM switchable          |
| $0150 - $3FFF   | Cartridge ROM Bank 0 fixed        |
| $0100 - $014F   | Cartridge Header                  |
| $0000 - 00FF    | Restart, Interrupt vectors        |


**Break down of specific sections in memory**

Cartridge Header `$0100 - $014F`

|  Address Range  |  Description        |
| :-------------: | :-----------------: |
| $014E - $014F   | Checksum            |
| $014D           | Complement Checksum |
| $014C           | Mask ROM Version    |
| $014B           | Old License Code    |
| $014A           | Destination Code    |
| $0149           | Cartridge RAM Size  |
| $0148           | Cartridge ROM Size  |
| $0147           | Cartridge Type      |
| $0146           | SGB Compatability   |
| $0144 - $0145   | New License Code    |
| $0143           | Color Compatability |
| $013F - $0142   | Game Destination    |
| $0134 - $013E   | Game Title          |
| $0104 - $0133   | Nintendo Logo       |
| $0100 - $0103   | NOP / JP $0150      |

Interrupt Vectors

|  Name  |  Description  |  Vector  |
| :----: | :-----------: | :------: |
|        |               |          |
