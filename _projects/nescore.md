---
layout: projects
name: nescore - NES Emulator
repo_url: https://github.com/nnarain/nescore
description: A NES emulator written in Rust. Features accurate CPU and PPU emulation, supports multiple mappers, and can run as a library for desktop, libretro, or WebAssembly applications.
date: 2020-04-15
tags: ["NES", "Emulator", "Rust"]
images:
  - /assets/2020/04/15/demo2.gif
  - /assets/2020/04/15/demo1.gif
project_id: nescore
---

## Overview

nescore is a Nintendo Entertainment System (NES) emulator written in Rust. Following the design philosophy of GameboyCore, it's implemented as a library that's completely independent of how clients render output, enabling NES emulation on desktop (SDL2), libretro cores, or in browsers via WebAssembly.

## Features

- Full 6502 CPU instruction set implementation
- PPU (Picture Processing Unit) emulation
- Multiple mapper support
- Platform-agnostic library design
- Can be integrated into desktop apps, libretro, or WebAssembly

## Technologies

- Rust
- SDL2.0 for desktop rendering
- WebAssembly support
- Cross-platform compatibility
