---
layout: post
title: AVR CMake Toolchain
description: Creating a CMake toolchain file for AVR GCC
tag: ["avr", "cmake", "c", "c++"]
thumbnail: /assets/2016/03/29/cmake_logo.png
repo_url: https://github.com/nnarain/cmake-avr-template
issue_number:
next_post: 2016-04-09-Debugging with SimAVR
---

**Background**

CMake is a very powerful and flexible build system. Enabling you to generate makefiles for your C and C++ projects.

With CMake, you can use a toolchain file to specify a different set of build tools for cross compiling.

In this blog post I will show how I setup the AVR toolchain in CMake.

First lets look at what we will end up with:

```cmake
cmake_minimum_required(VERSION 2.8)

# specify MCU type and include toolchain file
set(AVR_MCU "atmega328p")
set(CMAKE_TOOLCHAIN_FILE "${CMAKE_SOURCE_DIR}/cmake/avr-gcc.toolchain.cmake")

project(MyProject C CXX ASM)

add_definitions(-DF_CPU=16000000)

add_avr_executable(${PROJECT_NAME}
	src/main.cpp
)
```

**Finding Build Tools**

First we need to find the AVR toolchain on the system. We can use cmake's `find_path` function for that.

```cmake
# toolchain prefix
set(TRIPLE "avr")

# attempt to find avr-gcc
find_path(TOOLCHAIN_ROOT
	NAMES
		${TRIPLE}-gcc

	PATHS
		/usr/bin
		/usr/local/bin
		/bin

		$ENV{AVR_ROOT}
)

# Error, could not find toolchain
if(NOT TOOLCHAIN_ROOT)
	message(FATAL_ERROR "Toolchain root could not be found!!!")
endif(NOT TOOLCHAIN_ROOT)
```

This will search all of the 'paths' for avr-gcc and populate `TOOLCHAIN_ROOT` with the result. If the toolchain could not be found we send a fatal error.

Now we need to configure cmake with the new build tools. CMake has a built in variable that corresponds to most of the tools in our toolchain, we just have to set them.

`CMAKE_C_COMPILER` corresponds to `avr-gcc` and `CMAKE_CXX_COMPILER` corresponds to `avr-g++` etc.

```cmake
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR avr)
set(CMAKE_CROSS_COMPILING 1)

set(CMAKE_C_COMPILER   "${TOOLCHAIN_ROOT}/${TRIPLE}-gcc${OS_SUFFIX}"     CACHE PATH "gcc"     FORCE)
set(CMAKE_CXX_COMPILER "${TOOLCHAIN_ROOT}/${TRIPLE}-g++${OS_SUFFIX}"     CACHE PATH "g++"     FORCE)
set(CMAKE_AR           "${TOOLCHAIN_ROOT}/${TRIPLE}-ar${OS_SUFFIX}"      CACHE PATH "ar"      FORCE)
set(CMAKE_LINKER       "${TOOLCHAIN_ROOT}/${TRIPLE}-ld${OS_SUFFIX}"      CACHE PATH "linker"  FORCE)
set(CMAKE_NM           "${TOOLCHAIN_ROOT}/${TRIPLE}-nm${OS_SUFFIX}"      CACHE PATH "nm"      FORCE)
set(CMAKE_OBJCOPY      "${TOOLCHAIN_ROOT}/${TRIPLE}-objcopy${OS_SUFFIX}" CACHE PATH "objcopy" FORCE)
set(CMAKE_OBJDUMP      "${TOOLCHAIN_ROOT}/${TRIPLE}-objdump${OS_SUFFIX}" CACHE PATH "objdump" FORCE)
set(CMAKE_STRIP        "${TOOLCHAIN_ROOT}/${TRIPLE}-strip${OS_SUFFIX}"   CACHE PATH "strip"   FORCE)
set(CMAKE_RANLIB       "${TOOLCHAIN_ROOT}/${TRIPLE}-ranlib${OS_SUFFIX}"  CACHE PATH "ranlib"  FORCE)
set(AVR_SIZE           "${TOOLCHAIN_ROOT}/${TRIPLE}-size${OS_SUFFIX}"    CACHE PATH "size"    FORCE)

```

CMake does not has a variable for `avr-size` so we include one ourselves.

Setting avr linker libraries:

```cmake
set(AVR_LINKER_LIBS "-lc -lm -lgcc")
```

**Adding Build targets**

Now we need to add a cmake macro to build our binary files. For development with AVR we must build a `.elf` file and a `.hex` files but we will also build `.map` and `.lst` files to help with debugging.

```cmake
macro(add_avr_executable target_name)

	# define file names we will be using
	set(elf_file ${target_name}-${AVR_MCU}.elf)
	set(map_file ${target_name}-${AVR_MCU}.map)
	set(hex_file ${target_name}-${AVR_MCU}.hex)
	set(lst_file ${target_name}-${AVR_MCU}.lst)

	...

endmacro(add_avr_executable)
```

The elf file target is our sources compiled together, we can use cmake's `add_executable` now that cmake is using our build tools.

```cmake

	...

	# add elf target
	add_executable(${elf_file}
		${ARGN}
	)

	# set compile and link flags for elf target
	set_target_properties(
		${elf_file}

		PROPERTIES
			COMPILE_FLAGS "-mmcu=${AVR_MCU} -g -Os -w -std=gnu++11 -fno-exceptions -ffunction-sections -fdata-sections"
			LINK_FLAGS    "-mmcu=${AVR_MCU} -Wl,-Map,${map_file} ${AVR_LINKER_LIBS}"
	)
```

`${ARGN}` contains all parameters after `target_name`.

Note: Do not miss `-mmcu=${AVR_MCU}` in link flags as your code will compile and link, but not correctly!

Now we will add commands to generate `lst` and `hex` file targets. We will use cmake's `add_custom_command`.

```cmake
	...

	# generate the lst file
	add_custom_command(
		OUTPUT ${lst_file}

		COMMAND
			${CMAKE_OBJDUMP} -h -S ${elf_file} > ${lst_file}

		DEPENDS ${elf_file}
	)

	# create hex file
	add_custom_command(
		OUTPUT ${hex_file}

		COMMAND
			${CMAKE_OBJCOPY} -j .text -j .data -O ihex ${elf_file} ${hex_file}

		DEPENDS ${elf_file}
	)

	...
```

We also want a command to print `elf` file size.

```cmake
	...

	add_custom_command(
		OUTPUT "print-size-${elf_file}"

		COMMAND
			${AVR_SIZE} ${elf_file}

		DEPENDS ${elf_file}
	)

	...
```

Notice how they depend on `elf_file` target.

Now that we defined commands to generate the `lst` and `hex` files, we need to call these commands.

```cmake

	...

	# build the intel hex file for the device
	add_custom_target(
		${target_name}
		ALL
		DEPENDS ${hex_file} ${lst_file} "print-size-${elf_file}"
	)

	set_target_properties(
		${target_name}

		PROPERTIES
			OUTPUT_NAME ${elf_file}
	)

endmacro(add_avr_executable)
```

By adding a custom target using `add_custom_target` and having it depend on our custom commands, we can get cmake to generate our files. Our target is added to `ALL` so it will be invoked with `make all` or just `make`

**Flash Targets**

The flash targets aren't part of the build, but are useful. I use `avrdude` as my upload tool.

```cmake
...

# avr uploader config
find_program(AVR_UPLOAD
	NAME
		avrdude

	PATHS
		/usr/bin/
		$ENV{AVR_ROOT}
)

if(NOT AVR_UPLOAD_BAUD)
	set(AVR_UPLOAD_BAUD 57600)
endif(NOT AVR_UPLOAD_BAUD)

if(NOT AVR_UPLOAD_PROGRAMMER)
	set(AVR_UPLOAD_PROGRAMMER "arduino")
endif(NOT AVR_UPLOAD_PROGRAMMER)

if(NOT AVR_UPLOAD_PORT)
	if(UNIX)
		set(AVR_UPLOAD_PORT "/dev/ttyUSB0")
	endif(UNIX)
	if(WIN32)
		set(AVR_UPLOAD_PORT "COM3")
	endif(WIN32)
endif(NOT AVR_UPLOAD_PORT)

...

```

Find the upload tool and specify some default values for avrdude.

These values can be overridden at the command line:

```bash
cmake .. -DAVR_UPLOAD_PORT=/dev/ttyACM0 -DAVR_UPLOAD_BAUD=115200
```

The flash target is also created using `add_custom_target` and `add_custom_command`

```cmake
	# flash command
	add_custom_command(
		OUTPUT "flash-${hex_file}"

		COMMAND
			${AVR_UPLOAD} -b${AVR_UPLOAD_BUAD} -c${AVR_UPLOAD_PROGRAMMER} -p${AVR_MCU} -U flash:w:${hex_file} -P${AVR_UPLOAD_PORT}
	)

	add_custom_target(
		"flash-${target_name}"

		DEPENDS "flash-${hex_file}"
	)
```

And thats it! A working AVR toolchain in cmake!

**Use it**

```bash

cd project/path/build
cmake ..
make
make flash-MyProject

```
