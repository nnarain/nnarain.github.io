---
layout: post
title: Gameboy Emulator Setup
description: Setting the CPU and MMU
tag: ["gameboy", "c++"]
thumbnail:
repo: nnarain/gameboycore
prev_post: 2016-09-11-Gameboy Emulator Project
---

In this post I will cover the CPU and MMU setup I used in my emulator.

I won't cover all the basic knowledge for how a CPU works. But just to recap. A CPU executes instructions. One at a time. Each instruction is represented by a number. This number is called an operation code or opcode.

A CPU goes through a 3 step process for runnning these opcodes.

1. Fetch
2. Decode
3. Execute

An opcode is fetched from memory, its operation is decoded and it is executed. Then repeat.

So when making an emulator we must be able to follow these 3 steps.

**Registers**

The Gameboy has the following registers: `A`, `B`, `C`, `D`, `E`, `H`, `L`, `PC`, `SP`, `F`

* `A` through `L` are general purpose 8 bit registers.
* `PC` is the program counter. It points to the next opcode to execute.
* `SP` is the stack pointer. Points to the top of the stack.
* `F` is the flag register. Contains the status of the last operation

While all registers (except the `F`) can be used independently the general purpose 8 bit registers are paired with another to make a 16 bit register.

They are:

`AF`, `BC`, `DE` and `HL`

Below is how I setup the registers up in code.

```c++

class CPU
{
public:
    union Register
    {
        struct {
#ifdef __LITTLEENDIAN__
            uint8_t lo;
            uint8_t hi;
#else
            uint8_t hi;
            uint8_t lo;
#endif
        };
        uint16_t val;
    };

...

private:
    Register af_;
    Register bc_;
    Register de_;
    Register hl_;
    Register sp_;
    Register pc_;
}

```

To make this code portable I flipped the `hi` and `lo` registers depending of endianness.

**Fetch, Decode, Execute skeleton code**

Take a look at a table of Gameboy Opcodes [here](http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html). These are the instructions that will eventually be implemented.

```c++
// cpu.h

class CPU
{
public:

    void step();

private:    
    void decode1(uint8_t opcode); // decode page 1 opcode
    void decode2(uint8_t opcode); // decode page 2 opcode

};

```

```c++
// cpu.cpp

void CPU::step()
{
    // fetch next opcode
    uint8_t opcode = mmu_.read(pc_.val++);

    // $CB means decode from the second page of instructions
    if (opcode != 0xCB)
    {
        // decode from first page
        decode1(opcode);
    }
    else
    {
        // read the second page opcode
        opcode = mmu_.read(pc_.val++);
        // decode from second page
        decode2(opcode);
    }
}

void CPU::decode1(uint8_t opcode)
{
    // execute
    switch(opcode)
    {
        ...
    }
}

void CPU::decode2(uint8_t opcode)
{
    // execute
    switch(opcode)
    {
        ...
    }
}
```

**Memory Management Unit**

The Gameboy doesn't have a explicit MMU that you need to deal with. This is a convenience class for accessing memory.

At some point I will add support for memory bank switching and this will help kepp things organized.
