---
layout: post
title: Gameboy Emulator GPU
description:
tag: ['Gameboy', 'Emulator', 'C++']
thumbnail: /assets/2016/10/29/
repo: nnarain/gameboycore
---

Updates
-------

* Per scan line rendering
* Sprites with attributes and priority (basic)
* Improved memory access


Per scan line rendering
-----------------------

Before this update I was doing my rendering by rendering all tiles at once at the VBlank interrupt. The problem is that some gameboy games use the HBlank interrupt to do video effect by updating tiles and sprites in between drawing lines.

This makes per scan line rendering a must.

I have added a GPU class that handles LCD controller mode switching and calculating scan lines and sending those to a renderer.

This significantly improved the rendering interface. An Emulator program simple needs to bind a single callback function to the GPU instead of needing to make use of `TileMap`, `TileRAM`, `OAM` classes.

It looks something like this:


```c++

gameboy.getGPU()->setRenderCallback(
    std::bind(
        &ScreenRenderer::renderScanline,
        &screen_renderer_,
        std::placeholders::_1, std::placeholders::_2
    ));

```

The GPU provides a `GPU::Scanline`, which is just an array of pixels and the line number.

```c++

void renderScanline(const gb::GPU::Scanline& scaneline, int line)
{
    auto col = 0;

    for (const auto& pixel : scaneline)
    {
        sf::Color color;
        color.r = pixel.r;
        color.g = pixel.g;
        color.b = pixel.b;
        color.a = 255;

        frame_buffer_.write(col++, line, color);
    }

    screen_texture_.update(frame_buffer_.get());
}

```

The renderer just needs to convert the Gameboy core pixels to pixels it can use. In the above example I am using SFML and updating a texture.

Much cleaner than before!

Improving memory access
-----------------------

Rendering per scan line opened up some performance issues (rendering about 144 times more often!).

Using Visual Studio's Profiling tool I found the problem point:

![Image not found!](/assets/2016/10/29/profile1.png)

Turns out this innocent line of code is very slow (amplified by the per scan line rendering)

The fix was to change `std::map<...> read_handlers_` to `std::array<...> read_handlers_`

Simple but effective!

![Image not found!](/assets/2016/10/29/profile2.png)

Progress
--------

![Image not found!](/assets/2016/10/29/kirby.gif)

Still some issues with sprite rendering but progress has been made!
