---
layout: post
title: Gameboy Emualtor - Testing
description: writing tests for my emulator
tag: [Gameboy, C++]
thumbnail: /assets/2016/09/22/
project_id: gameboy-emulator
repo: nnarain/gameboycore
---

In this post I want to talk about the importance of testing code!

Recently I have been using GTest and while writing test for my Gameboy Emulator have gained a appreciation for writing good tests!

CPU Instruction Implementation
------------------------------

In my emulator I broke down all the instructions into a few categories. And wrote functions to implement these instructions.

For example:

Increment and Decrement Instructions:

```c++

void CPU::inc(uint8_t& i)
{
    bool half_carry = IS_HALF_CARRY(i, 1);

    i++;

    setFlag(CPU::Flags::Z, i == 0);
    setFlag(CPU::Flags::N, false);
    setFlag(CPU::Flags::H, half_carry);
}

void CPU::dec(uint8_t& d)
{
    bool half_carry = IS_HALF_BORROW(d, 1);

    d--;

    setFlag(CPU::Flags::Z, d == 0);
    setFlag(CPU::Flags::N, true);
    setFlag(CPU::Flags::H, half_carry);
}

```

The functions make up the functionality for the entire emulator. If bit is out the place it won't work.

It makes sense to write tests for each of these functions to fully define the behavior of the CPU.

For example:

```c++

TEST(IncDecInstructions, Inc8Bit)
{
	CodeGenerator code;
	code.block(
		0x3E, 0x01, // LD A,1
		0x06, 0x02, // LD B,2
		0x0E, 0x03, // LD C,3
		0x16, 0x04, // LD D,4
		0x1E, 0x05, // LD E,5
		0x26, 0x06, // LD H,6
		0x2E, 0x07, // LD L,7

		0x3C,		// INC A
		0x04,		// INC B
		0x0C,		// INC C
		0x14,		// INC D
		0x1C,		// INC E
		0x24,		// INC H
		0x2C,		// INC L

		0x76        // halt
	);


	Gameboy gameboy;
	CPU::Status status = run(gameboy, code.rom());

	EXPECT_EQ(status.af.hi, 2);
	EXPECT_EQ(status.bc.hi, 3);
	EXPECT_EQ(status.bc.lo, 4);
	EXPECT_EQ(status.de.hi, 5);
	EXPECT_EQ(status.de.lo, 6);
	EXPECT_EQ(status.hl.hi, 7);
	EXPECT_EQ(status.hl.lo, 8);
}

```

In my tests I run small assembly programs to test the behavior of the instructions.

That being said...

Some of my tests did not cover the full behavior of the instruction. Like not checking all edge cases of "what happens when".

This caused bugs in my CPU! That were much harder to find then if they were in the localize test!

**Conclusion**

Write test now, save time later!
