---
layout: post
title: Gameboy Hardware Specs and Memory Layout
description: Outline the specifications for the Gameboy's hardware
tag: gameboy c++
thumbnail:
repo_url: https://github.com/nnarain/gameboy
---

On going write up of important information about the Gameboy system.

Hardware Specs
--------------

| CPU         | Z80                        |
| Clock       | ~4.2 MHz                   |
| Work RAM    | 8 kB                       |
| Resolution  | 160x144 (20x18 tiles)      |
| Max Sprites | 40 per screen, 10 per line |
| Sprite Size | 8x8, 8x16                  |
| Palettes    | 1x4 BG, 2x3 OBJ            |
| Colors      | 4 gray shades              |
| Sound       | 4 channel with stereo      |


Gameboy CPU memory map overview
-------------------------------

|  Address Range  |  Description                                      |
| :-------------: | :-----------------------------------------------: |
| $FFFF           | [Interrupt Enable Flags](#interrupt-enable-flags) |
| $FF80 - $FFFE   | High RAM                                          |
| $FF00 - $FF7F   | [Hardware IO Registers](#hardware-io-registers)   |
| $FEA0 - $FEFF   | Unuseable Memory                                  |
| $FE00 - FE9F    | OAM (Object Attribute Memory)                     |
| $E000 - $FDFF   | Echo RAM - Do not use                             |
| $D000 - $DFFF   | Internal RAM Banks 1-7 switchable                 |
| $C000 - $CFFF   | Internal RAM Bank 0 Fixed                         |
| $A000 - $BFFF   | Cartridge RAM (if available)                      |
| $9C00 - $9FFF   | Background Map Data 2                             |
| $9800 - $9BFF   | Background Map Data 1                             |
| $8000 - $97FF   | Character RAM                                     |
| $4000 - $7FFF   | Cartridge ROM switchable                          |
| $0150 - $3FFF   | Cartridge ROM Bank 0 fixed                        |
| $0100 - $014F   | [Cartridge Header](#cartridge-header)             |
| $0000 - 00FF    | [Interrupt vectors](#interrupt-vectors)           |


### Interrupt Enable Flags

|  Bit#  |  Description    |
| :----: | :-------------: |
|  7     | ---             |
|  6     | ---             |
|  5     | ---             |
|  4     | Joypad          |
|  3     | Serial          |
|  2     | Timer           |
|  1     | LCD STAT        |
|  0     | V-Blank         |

### Hardware IO Registers

**Interrupt Flag Register** `$FF0F`

|  Bit#  |  Description    |
| :----: | :-------------: |
|  7     | ---             |
|  6     | ---             |
|  5     | ---             |
|  4     | Joypad          |
|  3     | Serial          |
|  2     | Timer           |
|  1     | LCD STAT        |
|  0     | V-Blank         |

**Joy Pad Register** `$FF00`

|  Bit#  |  Description    |
| :----: | :-------------: |
|  7     | Not used        |
|  6     | Not used        |
|  5     | P15 out port    |
|  4     | P14 out port    |
|  3     | P13 in port     |
|  2     | P12 int port    |
|  1     | P11 in port     |
|  0     | P10 in port     |

Include a diagram of the joypad matrix

### Cartridge Header

|  Address Range  |  Description                              |
| :-------------: | :---------------------------------------: |
| $014E - $014F   | Checksum                                  |
| $014D           | Complement Checksum                       |
| $014C           | Mask ROM Version                          |
| $014B           | Old License Code                          |
| $014A           | Destination Code                          |
| $0149           | [Cartridge RAM Size](#cartridge-ram-size) |
| $0148           | [Cartridge ROM Size](#cartridge-rom-size) |
| $0147           | [Cartridge Type](#cartridge-type)         |
| $0146           | SGB Compatability                         |
| $0144 - $0145   | New License Code                          |
| $0143           | Color Compatability                       |
| $013F - $0142   | Game Destination                          |
| $0134 - $013E   | Game Title                                |
| $0104 - $0133   | Nintendo Logo                             |
| $0100 - $0103   | NOP / JP $0150                            |

#### Cartridge RAM Size

|  Value  |  Description             |    
| :-----: | :----------------------: |
| $00     | None                     |
| $01     | 2 kB                     |
| $02     | 8 kB                     |
| $03     | 32 kB                    |

#### Cartridge ROM Size

|  Value  |  Description             |    
| :-----: | :----------------------: |
| $00     | 32 kB (no banking)       |
| $01     | 64 kB (4 banks)          |
| $02     | 128 kB (8 banks)         |
| $03     | 256 kB (16 banks)        |
| $04     | 512 kB (32 banks)        |
| $05     | 1 MB (64 banks)          |
| $06     | 2 MB (128 banks)         |
| $07     | 4 Mb (256 banks)         |
| $52     | 1.1 Mb (72 banks)        |
| $53     | 1.2 Mb (80 banks)        |
| $54     | 1.5 Mb (96 banks)        |


#### Cartridge Type

|  Value  |  Description             |    
| :-----: | :----------------------: |
| $00     | ROM Only                 |
| $01     | MBC1                     |
| $02     | MBC1 + RAM               |
| $03     | MBC1 + RAM + BAT         |
| $05     | MBC2                     |
| $06     | MBC2 + BAT               |
| $08     | ROM + RAM                |
| $09     | ROM + RAM + BAT          |
| $0F     | MBC3 + Timer + BAT       |
| $10     | MBC3 + RAM + Timer + BAT |
| $11     | MBC3                     |
| $12     | MBC3 + RAM               |
| $13     | MBC3 + RAM + BAT         |
| $15     | MBC4                     |
| $16     | MBC4 + RAM               |
| $17     | MBC4 + RAM + BAT         |
| $19     | MBC5                     |
| $1A     | MBC5 + RAM               |
| $1B     | MBC5 + RAM + BAT         |

There are more types, however I will leave it heere for now.

### Interrupt Vectors

|  Name  |  Description  |  Vector  |
| :----: | :-----------: | :------: |
|        |               |          |
