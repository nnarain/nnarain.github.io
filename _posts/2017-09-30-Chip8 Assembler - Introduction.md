---
layout: post
title: Chip8 Assembler - Introduction
description: 
tag: ['rust', 'nom', 'assembly']
thumbnail: /assets/2017/09/30/
repo_url: https://github.com/nnarain/silica
---

### Introduction

In order to learn Rust I started writing two small projects. The first was [quartz](https://github.com/nnarain/quartz) a Chip8 emulator. My second project was a Chip8 assembler. I find learning about compilers/assemblers interesting however making something as complicated as a C compiler is not a great introductary project! Chip8 is a perfect candiated as there are only 35 instructions to generate instructions for.

I'm planning on making a series of posts outlining the key points in making the assembler. This project is written in Rust and uses `nom` to aid in parsing.

### Design

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

### Lexer

As mentioned before the lexer transforms the input data into a series of Tokens. So what is a token? A token is the meaningful components of the assemble file. So before we can write a lexer we have to know what we are trying to process!

```asm
            org $200

start
            LD I, #num1      ; Point I to the `1` sprite
            LD V0, 16        ; Load the x value of the sprite 
            LD V1, 16        ; Load the y value of the sprite
            
            DRW V0, V1, 5    ; Draw the sprite

end         JP #end          ; loop forever

; Sprites
num1
            db $20 $60 $20 $20 $70
```

Alright so what are we looking at?

Assembly languages are typically broken into 3 columns. The first column is for labels, these are identifiers for memory locations, The second column contains the instructions and their operands. Instructions are the human readable represention of the target's opcodes. The second column also contains directives, these are instructions to the assembler itself. The third columns is for comments.

Ok so how does this relate to tokens? We need to identify what individual bits of information in the file needs to be extracted for later use by program.

Well in this assembly file we need to ignore the whitespace and the comments and extract Directives, Labels and Instructions. Instructions have operands that come in a few forms. Operands could be a register (V0..VF, I, etc), numerical literals and also labels. Some instructions can have a memory address as an operand, obivously we wanted to be able to use labels for these arguments. In the above example I prefix the label operands with a '#' so they are easily identifiable. 

So the remaining tokens we need to parse are Registers, Numeric literals (decimal and hex) and Label operands.

In `lexer.rs` I define an enum for the Token.

```rust
/// Possible tokens that can exist in the Chip8 assembly file
#[derive(Debug, PartialEq, Clone)]
pub enum Token {
    Directive(String),
    Label(String),
    Instruction(String),
    Register(String),
    NumericLiteral(u32),
    LabelOperand(String)
}
```






