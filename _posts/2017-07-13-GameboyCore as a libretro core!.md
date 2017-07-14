---
layout: post
title: GameboyCore as a libretro core!
description: Gameboy as a libretro core
tag: ['Gameboy', 'Emulation']
thumbnail: /assets/2017/07/13/
repo_url: https://github.com/nnarain/gameboycore-retro
---

[RetroArch](http://www.retroarch.com/) is a frontend for emulators and game engines. It allows anyone to develop a `core` which can be loaded by the frontend and use to emulate a particular platform.

Since [GameboyCore] is a self-contained Gameboy emulator library it was very simple to write a `libretro` core around it.

##Wrapping GameboyCore in a Libretro core

A libretro core is a shared library that is loaded by the frontend, in this case, RetroArch. The libretro core must implement all the necessary API functions so it can be loaded.

First define some variables and constants:

```c++

// Gameboy screen resolution 160x144
static constexpr unsigned int DISPLAY_WIDTH = 160;
static constexpr unsigned int DISPLAY_HEIGHT = 144;

static GameboyCore core;

```

The `retro_get_system_info` and `retro_get_system_av_info` functions are called by the frontend to get information about the core.

* `retro_get_system_info` supplies metadata on the core.
* `retro_get_system_av_info` supplies information on the audio and video of the core

```c++

void retro_get_system_info(retro_system_info* info)
{
	memset(info, 0, sizeof(retro_system_info));
	info->library_name = "GameboyCore";
	info->library_version = "0.17.0"; // TODO: generate version header from git
	info->need_fullpath = false;
	info->valid_extensions = "bin|gb|gbc";
}

/**
	Tell libretro audio and video information
*/
void retro_get_system_av_info(retro_system_av_info* info)
{
	memset(info, 0, sizeof(retro_system_av_info));
	info->timing.fps = 60.0f;
	info->timing.sample_rate = 44100; // standard audio sample rate
	info->geometry.base_width = DISPLAY_WIDTH;
	info->geometry.base_height = DISPLAY_HEIGHT;
	info->geometry.max_width = DISPLAY_WIDTH;
	info->geometry.max_height = DISPLAY_HEIGHT;
	info->geometry.aspect_ratio = (float)DISPLAY_HEIGHT / (float)DISPLAY_WIDTH;
}

```

`retro_load_game` is the API call used by the frontend to pass a loaded ROM file to the core.

I also register the scanline callback in this function.

```c++
/**
	Load ROM
*/
bool retro_load_game(const retro_game_info* info)
{
	// load rom data into core
	if (info && info->data)
	{
		core.loadROM((uint8_t*)info->data, info->size);
	}

	// set core callbacks
	core.getGPU()->setRenderCallback(std::bind(gpu_callback, std::placeholders::_1, std::placeholders::_2));

	return true;
}
```

The next last important part of the API calls the implement is the `retro_run` function. This function is callback at the same rate set in `info->timeing.fps` in the `retro_get_system_info`.

`video_cb` is a callback function used to send a framebuffer to the front end. The framebuffer is also in RGB1555 format, so the colors from GameboyCore need to be converted.

```c++

void retro_run(void)
{

	// update the core
	core.update(1024);

	// send the current frame buffer to frontend
	video_cb(framebuffer, DISPLAY_WIDTH, DISPLAY_HEIGHT, DISPLAY_WIDTH * sizeof(short));
}

```

Here's the gpu callback function and a function to do the color conversion.

```c++


/**
	GPU Callback
*/
void gpu_callback(const GPU::Scanline& scanline, int line)
{
	const auto offset = DISPLAY_WIDTH * line;
	const auto size = scanline.size();

	for (auto i = 0u; i < size; ++i)
	{
		const auto& pixel = scanline[i];
		const auto r = convert_rgb24_to_rgb15(pixel.r);
		const auto g = convert_rgb24_to_rgb15(pixel.g);
		const auto b = convert_rgb24_to_rgb15(pixel.b);

		short rgb = 0x8000 | (r << 10) | (g << 5) | b;

		framebuffer[offset + i] = rgb;
	}
}

/**
	Convert
*/
uint8_t convert_rgb24_to_rgb15(uint8_t c)
{
	static constexpr int MAX_15 = 0x1F;

	float current_ratio = (float)c / 255.0f;

	return (uint8_t)((float)MAX_15 * current_ratio);
}

```

Now there was a bit of an issue with this code as is. That is it was running very slow.

The reason was that the frontend is calling `retro_run` at a constant frame rate but the core was not producing enough scanlines per frame.

The solution was basically add a simple control system for the cpu steps. The process is, get number of scanlines produced in the last frame and do an error calculation with the target scanlines per frame.

Add a new constant and some variables.

```c++
static constexpr int SCANLINES_PER_FRAME = 144;

...

static int steps = 1024;
static int scanline_counter = 0;
```

Increment the scanline counter in the gpu_callback

```c++
void gpu_callback(const GPU::Scanline& scanline, int line)
{
    ...

	scanline_counter++;

    ...
}

```

And in the `retro_run` function do the error calculation.

```c++
void retro_run(void)
{

	// update the core
	core.update(steps);

	// perform a simple error calculation to adjust the number of cpu steps required to compute 144 scanlines every frame
	auto scanline_error = SCANLINES_PER_FRAME - scanline_counter;
	steps += scanline_error;
	scanline_counter = 0;

	// send the current frame buffer to frontend
	video_cb(framebuffer, DISPLAY_WIDTH, DISPLAY_HEIGHT, DISPLAY_WIDTH * sizeof(short));
}

```

The full source looks like this so far. Note I have not added input or audio.

```c++

#include <libretro.h>
#include <gameboycore/gameboycore.h>

#include <iostream>

using namespace gb;

// CONSTANTS
static constexpr unsigned int DISPLAY_WIDTH = 160;
static constexpr unsigned int DISPLAY_HEIGHT = 144;
static constexpr int SCANLINES_PER_FRAME = 144;

// PROTOTYPES
static void gpu_callback(const GPU::Scanline& scanline, int line);
static uint8_t convert_rgb24_to_rgb15(uint8_t c);

// VARIABLES
static GameboyCore core;
static int steps = 1024;
static int scanline_counter = 0;

static retro_environment_t environment_cb;
static retro_video_refresh_t video_cb;
static retro_audio_sample_t audio_cb;
static retro_input_poll_t input_poll_cb;
static retro_input_state_t input_state_cb;
static retro_log_printf_t log_cb;

static short framebuffer[DISPLAY_WIDTH * DISPLAY_HEIGHT];

unsigned retro_api_version(void)
{
	return RETRO_API_VERSION;
}

void retro_init()
{
	retro_log_callback log;
	unsigned int level = 4;

	if (environment_cb(RETRO_ENVIRONMENT_GET_LOG_INTERFACE, &log))
	{
		log_cb = log.log;
	}
	else
	{
		log_cb = nullptr;
	}

	environment_cb(RETRO_ENVIRONMENT_SET_PERFORMANCE_LEVEL, &level);
}

void retro_deinit()
{

}


/**
	Tell libretro information about the core
*/
void retro_get_system_info(retro_system_info* info)
{
	memset(info, 0, sizeof(retro_system_info));
	info->library_name = "GameboyCore";
	info->library_version = "0.17.0"; // TODO: generate version header from git
	info->need_fullpath = false;
	info->valid_extensions = "bin|gb|gbc";
}

/**
	Tell libretro audio and video information
*/
void retro_get_system_av_info(retro_system_av_info* info)
{
	memset(info, 0, sizeof(retro_system_av_info));
	info->timing.fps = 60.0f;
	info->timing.sample_rate = 44100; // standard audio sample rate
	info->geometry.base_width = DISPLAY_WIDTH;
	info->geometry.base_height = DISPLAY_HEIGHT;
	info->geometry.max_width = DISPLAY_WIDTH;
	info->geometry.max_height = DISPLAY_HEIGHT;
	info->geometry.aspect_ratio = (float)DISPLAY_HEIGHT / (float)DISPLAY_WIDTH;
}

void retro_set_environment(retro_environment_t cb)
{
	// configure run with no loaded rom
	environment_cb = cb;
	bool no_rom = true;
	cb(RETRO_ENVIRONMENT_SET_SUPPORT_NO_GAME, &no_rom);

}

/**
	Load ROM
*/
bool retro_load_game(const retro_game_info* info)
{
	// load rom data into core
	if (info && info->data)
	{
		core.loadROM((uint8_t*)info->data, info->size);
	}

	// set core callbacks
	core.getGPU()->setRenderCallback(std::bind(gpu_callback, std::placeholders::_1, std::placeholders::_2));

	return true;
}

bool retro_load_game_special(unsigned game_type, const struct retro_game_info *info, size_t num_info)
{
	return false;
}

/**
	Unload ROM
*/
void retro_unload_game(void)
{
}

void retro_reset(void)
{
}

/**
	Run
*/
void retro_run(void)
{

	// update the core
	core.update(steps);

	// perform a simple error calculation to adjust the number of cpu steps required to compute 144 scanlines every frame
	auto scanline_error = SCANLINES_PER_FRAME - scanline_counter;
	steps += scanline_error;
	scanline_counter = 0;

	// send the current frame buffer to frontend
	video_cb(framebuffer, DISPLAY_WIDTH, DISPLAY_HEIGHT, DISPLAY_WIDTH * sizeof(short));
}


/**
	GPU Callback
*/
void gpu_callback(const GPU::Scanline& scanline, int line)
{
	const auto offset = DISPLAY_WIDTH * line;
	const auto size = scanline.size();

	scanline_counter++;

	for (auto i = 0u; i < size; ++i)
	{
		const auto& pixel = scanline[i];
		const auto r = convert_rgb24_to_rgb15(pixel.r);
		const auto g = convert_rgb24_to_rgb15(pixel.g);
		const auto b = convert_rgb24_to_rgb15(pixel.b);

		short rgb = 0x8000 | (r << 10) | (g << 5) | b;

		framebuffer[offset + i] = rgb;
	}
}

/**
	Convert
*/
uint8_t convert_rgb24_to_rgb15(uint8_t c)
{
	static constexpr int MAX_15 = 0x1F;

	float current_ratio = (float)c / 255.0f;

	return (uint8_t)((float)MAX_15 * current_ratio);
}


void retro_set_audio_sample_batch(retro_audio_sample_batch_t cb)
{
}

void retro_set_video_refresh(retro_video_refresh_t cb)
{
	video_cb = cb;
}

void retro_set_audio_sample(retro_audio_sample_t cb)
{
	audio_cb = cb;
}

void retro_set_input_poll(retro_input_poll_t cb)
{
	input_poll_cb = cb;
}

void retro_set_input_state(retro_input_state_t cb)
{
	input_state_cb = cb;
}

void retro_set_controller_port_device(unsigned port, unsigned device)
{
}

size_t retro_serialize_size(void)
{
	return 0;
}

bool retro_serialize(void *data, size_t size)
{
	return false;
}

bool retro_unserialize(const void *data, size_t size)
{
	return false;
}

void retro_cheat_reset(void)
{
}

void retro_cheat_set(unsigned index, bool enabled, const char *code)
{
}

void *retro_get_memory_data(unsigned id)
{
	return NULL;
}

size_t retro_get_memory_size(unsigned id)
{
	return 0;
}

unsigned retro_get_region(void)
{
	return RETRO_REGION_PAL;
}



```

![Image not found!](/assets/2017/07/13/cap.gif)
