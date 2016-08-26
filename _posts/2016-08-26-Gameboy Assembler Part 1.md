---
layout: post
title: Gameboy Assembler Part 1
description: Introduction to Gameboy Assembler
tag: gameboy flex bison c++ assembly
thumbnail: /assets/2016/08/26/assemblerflow.png
repo_url: https://github.com/nnarain/gameboy-assembler
---

Recently I started working on a [Gameboy Emulator](https://github.com/nnarain/gameboy). I had attempted this before but I got stuck with a bug I couldn't work out. I realized that I really didn't have a good means for debugging the emulator.

This time around I want to avoid that, so I am investing sometime before really diving into the emulator code to build a effective way of debugging my program.

The best way to do that is writing lots of concise test cases to verify my code against.

In my case I need to run small Gameboy assembly program in the emulator and verify the results are as I expect. I could attempt to run hard coded byte buffer in the emulator, but that seems hard to write and maintain.

Example:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{.cpp}
// test program, jump to address $150
std::vector<uint8_t> code = {
    0xC3,      // jp
    0x50, 0x01 // $150
};

emualtor.run(code);
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Not super intuitive not mention the [cartridge header](http://nnarain.github.io/2016/07/21/Gameboy-Specs.html) that needs to be included.

What I would like is:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{.asm}
; This is an assembly file to test stuff
        org $100

        jp $150

        org $150
start:

        ld B, 5
        nop
        nop
        ld C, $10

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This would be an actual assembly with a test case program.

Problem with this is that I (after a brief google search) could not find a Gameboy Assembler. With that said I thought it would be a fun project to make one!

**Scope**

* Compile simple test cases from Gameboy Assembly
* Limit to 32kB of ROM


<br>

How to write an Assembler
-------------------------

![Image not found!](/assets/2016/08/26/assemblerflow.png)

The above image is a break down of the assembler.

**Lexer**

A Lexer or 'Lexical Analyser' is used to break the assembly program file down with a serie of tokens. The tokens are significant information in the file. For example keywords and operators.

In the C programming language they might be like: `int`, `float`, `void`, `return`, `if`, `for`, `while`, you get the idea.

Many programming languages have comments. These would not be significant in terms of actually generating code. So they would be ignored by the Lexer.


**Parser**

The Parser takes a stream of tokens from the Lexer and determines if they are syntactically correct. Does one token type following for preceding another make sense in context?

For example:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{.c}
int x;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

versus

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~{.c}
int float;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


**Code Generator**

The Code Generator will be what produces gameboy byte code.


**How to make a Lexer and a Parser??**

Well we've covered what a Lexer and Parser is but how are we going to make one? Trick is.. we aren't! We not exactly.

The Lexer and Parser stages will be made using a combo of tools called `flex` and `bison`.

`flex` is used to build the Lexer and `bison` the Parser.
