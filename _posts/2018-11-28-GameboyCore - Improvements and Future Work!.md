---
layout: post
title: GameboyCore - Improvements and Future Work!
tag: ['gameboycore', 'emulator']
repo_url: https://github.com/nnarain/gameboycore
---

Taking a bit of a break of procedural generation shenanigans.

Over the past few weeks I've been making some general improvements to the `GameboyCore` project. I intend to finish off some of the remaining core features, but before that I want to clean up the project and build up some tooling.

Improvements
------------

**Example Clean up**

The example program I created to test `GameboyCore` wasn't great. I felt like the general structure of the code could be improved. Since this is the primary way I tested the emulator I decided it needed more functionality, beyond just input, video and audio.

I created a tools folder to separate and manage a number of emulator development tools and added the "example" as a debugger.

I restructured the CMake build to make it more modern and to accomadate the new set of tools.

New structure looks like this:

```
/
  - gameboycore
    - src/
      - ...
    - CMakeLists.txt
  - tools
    - gbdebugger/
    - CMakeLists.txt
  - CMakeLists.txt
```

So now there are a number of new `CMakeLists.txt` files, but I like the control it provides over the build.

For example, building `gameboycore` along with the tools.

```cmake
# src/CMakeLists.txt

option(BUILD_TOOLS "Build debug tooling" OFF)

add_subdirectory(gameboycore)

if (BUILD_TOOLS)
    add_subdirectory(tools)
endif(BUILD_TOOLS)
```

```cmake
# src/tools/CMakeLists.txt

option(WITH_DEBUGGER "Debugging tool" ON)
option(WITH_ROMINFO  "ROM info tool" ON)

if (WITH_DEBUGGER)
    add_subdirectory(gbdebugger)
endif()

if (WITH_ROMINFO)
    add_subdirectory(rominfo)
endif()
```

**Improvements to API**

Previously to set a callback for scanlines the user would have to do the following:

```c++
GameboyCore core;
core.getGPU()->setRenderCallback(...);
```

That's a little excessive, all interaction with the core should occur on the core object itself.

So now you can do the following:

```c++
// Set scanline callback
core.setScanlineCallback(...);
// write/read memory
core.writeMemory(0xA000, 0xFF);
auto value = core.readMemory(0xA000);
// emulate a single frame
core.emulateFrame();
```

And a few others.

Also I now you can set callbacks *before* loading the ROM file.

**Testing**

Along with adding a few new unit tests. I added a test runner to run unit tests on CI. Currently it runs three tests that support printing to the serial terminal, but it should be possible to run the other as they write to RAM.

As mentioned above the test runner uses the GameboyCore link cable and is a good example of how to interact with the serial port. Here's a snippet with the link cable setup.


```c++
    // Create a core and load the ROM data
    GameboyCore core;
    core.loadROM(&data[0], data.size());
    data.clear();

    // Create an exit condition state machine to track whether the test is done
    ExitConditionStateMachine exit_condition{ { "Fail", "fail", "Pass", "pass" } };

    // Setup link cable
    // This will be used to read output from the test ROMs
    LinkCable cable;
    // This callback fires when the core is ready to transfer a byte
    core.getLink()->setReadyCallback([&cable](uint8_t byte, Link::Mode mode) {
        // Signal core is ready for transfer
        cable.link1ReadyCallback(byte, mode);
        // Since there is no other core, we signal that the second link is ready as well
        // The serial transfer is master-slave system, the link modes must be opposite states
        cable.link2ReadyCallback(0xFF, (mode == Link::Mode::EXTERNAL) ? Link::Mode::INTERNAL : Link::Mode::EXTERNAL);
    });

    cable.setLink2RecieveCallback([&exit_condition](uint8_t byte) {
        // Sucessfully recieved a byte from the gameboy
        char c = (char)byte;
        std::cout << c;
        exit_condition.update(c);
    });

    // loop while we have not reached the exit condition
    while (!exit_condition)
    {
        core.update(1024);
    }

    // Print some padding characters
    std::cout << "\n\n";

    ...
```

The final things, with regards to testing, is setting up code coverage and cppcheck. Coverage information is useful for showing how effective unit tests are. Cppcheck is a C++ static analyzers capable of finding bugs and suggesting best practice improvements.

[![codecov](https://codecov.io/gh/nnarain/gameboycore/branch/master/graph/badge.svg)](https://codecov.io/gh/nnarain/gameboycore)



Future Work
-----------

* Completing core gameboy feature such as the RTC register and speed switch
* Building more tooling to debug the emulator

As far as more tooling goes. I want to the debugger to be more of what you would expect. Execution control, memory view, CPU register status, run disassembly, etc. I'd like to have a screen recorder and way to replay changes in the emulator state. I'd also like to see it evolution into a more sophisticated way to inspect memory and hack ROMs.

