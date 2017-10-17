---
layout: post
title: Chip8 Assembler - Introduction
description: 
tag: ['rust', 'nom', 'assembly']
thumbnail: /assets/2017/09/30/
repo_url: https://github.com/nnarain/silica
---

Introduction
------------

In order to learn Rust I started writing two small projects. The first was [quartz](https://github.com/nnarain/quartz) a Chip8 emulator. My second project was a Chip8 assembler. I find learning about compilers/assemblers interesting however making something as complicated as a C compiler is not a great introductary project! Chip8 is a perfect candiated as there are only 35 instructions to generate instructions for.

I'm planning on making a series of posts outlining the key points in making the assembler. This project is written in Rust and uses `nom` to aid in parsing.

Design
------

Alright. So we want to make a program that can take an input assembly file and produce a output file containing the Chip8 byte code. Now I don't have a lot of compiler theory under my belt so the following is my understanding for this more simple use case.


The assembler in broken down into 3 components. The Lexical analyzer, Parser and Code Generator.

![Image not found!](/assets/2017/09/30/components.png)

Each stage transforms the data into a different form until we have the desired output.

The lexical analyzer (or just lexer) transforms the input data (the assembly file) into a series of Tokens. Tokens are then parsed by the Parser into Expressions. Finally the expressions are transformed by the Code Generator into Chip8 opcodes.

The Rust crate will be organized in the structure mentioned above. One module for each component.

```
src\
    assembler\
        mod.rs
        lexer.rs
        parser.rs
        semantics.rs
        codegenerator.rs
    lib.rs
    main.rs
```

Semantics? The semantics module checks the validility of the parsed expressions.

