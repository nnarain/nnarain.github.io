---
layout: post
title: Rust
description:
tag: ['rust']
thumbnail: /assets/2017/08/11/
repo:
---

Recently I have been playing around with the Rust Programming and I got to say I am really liking it.

It clearly builds on the experience of problem solving in C++.

Modern C++ has a lot of memory ownership and safely functionality making its way into the standard library, such as SmartPointers and templates.
As well can things like, closures, automatic type induction and tuples.

However Rust has all these things built in making it feel quite a bit smoother.

I'm especially liking `cargo` and how integrated everything is. Adding dependencies is easy. Built in autodocs tool. And I also really like that unit testing is built in as well.

To learn Rust I started with making a Chip8 Virtual Machine [Quartz](https://github.com/nnarain/quartz) and I am currently working on a Chip8 assembler [Silica](https://github.com/nnarain/silica)!


<br>

Some cool rust libraries I'd like to try out would be:
* nom
* rayon
* serde
* tokio

I actually use nom to create lexers and parsers for my chip8 assembler!

