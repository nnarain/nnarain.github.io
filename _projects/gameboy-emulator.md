---
layout: projects
name: Gameboy Emulator
repo_url: https://github.com/nnarain/gameboycore
site_url: https://nnarain.github.io/gameboycore
description: A Gameboy emulator written in C++. Supports CPU emulation, graphics, and various memory bank controllers. Successfully runs classic Gameboy games and passes blaarg's test ROMs.
date: 2016-09-01
tags: ["Gameboy", "Emulator", "C++"]
images:
  - /static/projects/gameboy.gif
project_id: gameboy-emulator
---

## Overview

A Gameboy emulator written in C++ that accurately emulates the original Gameboy hardware. This project implements CPU emulation, graphics rendering, memory management, and input handling.

## Features

- Full CPU instruction set implementation
- PPU (Picture Processing Unit) emulation
- Memory Bank Controller (MBC) support
- Game cartridge loading
- Verified against blaarg's test ROMs

## Technologies

- C++
- SDL for graphics and input
- CMake build system
