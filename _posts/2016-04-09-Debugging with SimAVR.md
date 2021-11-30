---
layout: post
title: Visualizing with SimAVR
description: Setup SimAVR CMake targets to debug AVR C programs!
tag: ["avr", "cmake", "c", "c++"]
thumbnail: /assets/2016/04/09/simavr-thumb.png
repo: nnarain/cmake-avr-template
issue_number:
prev_post: 2016-03-29-AVR CMake Toolchain
---

Having a solid debugging story is important for any project, especially if you can't sprinkle `printf` everywhere!!!

And if you need to produce a wave form like this:

![Image not found](/assets/2016/04/09/simavr-thumb.png)

You will need someway to visualize the output.


**SimAVR**

[SimAVR](https://github.com/buserror/simavr) is a tool to simulate AVR programs. We can use it to track changed on our microcontroller. In this post I will set up CMake targets for using for automating SimAVR.

**Creating CMake Targets**

We will be adding the new cmake targets to our existing avr cmake toolchain from the [previous post]({% post_url 2016-03-29-AVR CMake Toolchain %}).

Before we jump into things you'll need to install simavr and gtkwave.

```bash
git clone https://github.com/buserror/simavr
cd simavr
make
sudo make install
sudo apt-get install gtkwave
```

We'll be using `gtkwave` to visualize our waveforms.

Find `simavr` executable in cmake.


```cmake

find_program(SIMAVR
	NAME
		simavr

	PATHS
		/usr/bin/
		$ENV{SIMAVR_HOME}
)

if(NOT SIMAVR)
	message("-- Could not find simavr")
else(NOT SIMAVR)
	message("-- Found simavr: ${SIMAVR}")
endif(NOT SIMAVR)

```

Like in the previous post we use `find_program` to find the `simavr` executable.

Setup cmake targets.

```cmake

	...

	if(SIMAVR)
		# create sim avr targets
		add_custom_command(
			OUTPUT "sim-${elf_file}"

			COMMAND
				${SIMAVR} -m ${AVR_MCU} -f 16000000 ${elf_file}
		)

		add_custom_target(
			"sim-${target_name}"

			DEPENDS "sim-${elf_file}"
		)
	endif(SIMAVR)

	...

```

We add a custom target that calls a custom command which launches simavr. To run SimAVR:

```bash

simavr -m mcu_type -f clock_speed program.elf

```

We substitute our existing variables `${AVR_MCU}` and `${elf_file}`.

**Generating VCD trace file**

In order to get port values and display them we need to add a special trace structure into our code for simavr to read.

Here's an example trace source file.

```c++
// project_atmega328p_vcd_trace.c

#include <avr/io.h>
#include <simavr/avr/avr_mcu_section.h>

AVR_MCU(16000000, "atmega328p");
AVR_MCU_VCD_FILE("my_trace_file.vcd", 1000);

const struct avr_mmcu_vcd_trace_t _mytrace[] _MMCU_ = {
	{ AVR_MCU_VCD_SYMBOL("OUTPUT"), .mask = (1 << 5), .what = (void*)&PORTB, },
};
```
We can specify port pins that we want to track. In this example we create a symbol OUTPUT to track pin 5 of Port B.

We will write a CMake macro to generate this C source file at configure time.

The following will be in FindSimAvr.cmake


Find SimAVR include path.

```cmake
find_path(SIMAVR_INCLUDE_DIR
	NAMES
		"simavr/avr/avr_mcu_section.h"

	PATHS
		/usr/include/
		/usr/local/include/
)
```

First lets take a look at how our macro will be used:

```cmake

find_package(SimAvr)

include_directories(
	${SIMAVR_INCLUDE_DIR}
)

# generate vcd trace file
add_vcd_trace(project ${AVR_MCU} 16000000
	"OUTPUT1,5,PORTB"
	"OUTPUT2,6,PORTB"
)

```

We pass in a list of string comma separated arguments.

Our CMake macro will take `target_name`, `mcu`, and `clock_speed` as arguments.

```cmake

macro(add_vcd_trace target_name mcu clock_speed)
	message("-- Generating ${target_name} VCD trace file for ${mcu}")

...

endmacro(add_vcd_trace)

```

We need to generate the lines that hold our trace arguments for each of our input strings.

So we will:

1. Split out string using comma delimiter
2. Get arguments: `symbol_name`, `mask`, `what`
3. Generate the appropriate line of code


```cmake

macro(add_vcd_trace target_name mcu clock_speed)
	message("-- Generating ${target_name} VCD trace file for ${mcu}")

	# list of our trace arguments
	set(trace_list)

	foreach(arg ${ARGN})

		# break down argument string
		string(REPLACE "," ";" arg_list ${arg})

		# get arguments
		list(GET arg_list 0 symbol_name)
		list(GET arg_list 1 mask)
		list(GET arg_list 2 what)

		# append structure
		list(APPEND trace_list "\t{ AVR_MCU_VCD_SYMBOL(\"${symbol_name}\"), .mask = (1 << ${mask}), .what = (void*)&${what}, },\n")

	endforeach(arg ${ARGN})

	# remove semi-colons that delimit a cmake list
	string(REPLACE ";" " " trace_list ${trace_list})

	...

endmacro(add_vcd_trace)

```

That's the hard part done! Now we generate our C source file. Not it must be a C source file because we need C linkage (No C++ name mangling).

```cmake

	...

	# our file name
	set(FILENAME "${target_name}_${mcu}_vcd_trace.c")
	# full file path
	set(TRACE_FILE "${CMAKE_BINARY_DIR}/${FILENAME}")

	# generate the file
	file(WRITE ${TRACE_FILE}
		"// Auto generated file by cmake\n"
		"// Generated VCD trace info for ${mcu} with clock speed ${clock_speed}\n\n"

		"#include <avr/io.h>\n"

		"#include <simavr/avr/avr_mcu_section.h>\n\n"
		"AVR_MCU(${clock_speed}, \"${AVR_MCU}\");\n"
		"AVR_MCU_VCD_FILE(\"${target_name}_trace.vcd\", 1000);\n\n"

		"const struct avr_mmcu_vcd_trace_t _mytrace[] _MMCU_ = {\n"
		"${trace_list}"
		"};\n"
	)

	set("${target_name}_VCD_TRACE_FILE" ${TRACE_FILE})

endmacro(add_vcd_trace)

```

That's it! Now just add this file to our source list.


```cmake

cmake_minimum_required(VERSION 2.8.3)

find_package(SimAvr)

include_directories(
	include/
	${SIMAVR_INCLUDE_DIR}
)

add_vcd_trace(project ${AVR_MCU} 16000000
	"OUTPUT,5,PORTB"
)

add_avr_executable(project
	src/main.cpp
	${project_VCD_TRACE_FILE} # our trace file
)

```

Simple blink program:

```c++

#include <avr/io.h>
#include <util/delay.h>

int main()
{
	DDRB |= 0xFF;
	PORTB = 0;

	for(;;)
	{
		PORTB |= (1 << 5);
		_delay_ms(1000);
		PORTB &= ~(1 << 5);
		_delay_ms(1000);
	}

	return 0;
}

```

Run target then open trace file.

```bash

make sim-project
gtkwave project_trace.vcd

```
![Image not found](/assets/2016/04/09/screen.png)
