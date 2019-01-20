---
layout: post
title: GameboyCore in the Web!
tag: ['gameboy', 'emulation']
repo_url: https://github.com/nnarain/gameboycore-web
---

Happy new year!

I've been pretty busy the last few months, but there is a project I've had in mind for a long time now. 

That would be creating an emulator that runs in the browser. Specifically I wanted to take `GameboyCore` and cross compile it to `Webassembly` and run it in a simple web app.

And well.. I've managed to get it working (In a not so nice looking React app)

![Image not found!](/assets/2019/01/19/rec1.gif)

It runs a lot faster than I expect as well.

In this post I'll be going over the steps take to get this far.

Emscripten
----------

[Emscripten SDK](https://github.com/emscripten-core/emscripten) is a LLVM to Javascript compiler. Specifically it can take an existing C/C++ code base and compile it to Javascript or Webassembly.

For this application I used Emscripten's CMake toolchain to cross compile `GameboyCore` and Emscripten wrapper to Webassembly.

**Setting up Emscripten**

Download Emscripten:

```
git clone https://github.com/juj/emsdk.git
```

Activate latest Emscripten SDK:

```
cd emsdk

./emsdk install latest
./emsdk activate latest
```

This adds the Emscripten tools to your path.

**Building Embind Wrapper**

Next I created a CMake project that contains `embind` code for `GameboyCore`. `Embind` is used to interface C++ code with Javascript/Webassembly like `Boost.Python`, `pybind11`, `luabind`, etc.

Project structure:

```
gameboycore-web/
    src/
        external/
            gameboycore/
            CMakeLists.txt
        gameboycore_web.cpp
    CMakeLists.txt
```

Where `src/external/gameboycore` is a submodule pointing to `GameboyCore`.

Below in the CMakeList.txt for `gameboycore-web`.

`CMakeLists.txt`:

```bash
########################################################################################################################
### This is a Emscripten build for gameboycore-web
### Must invoke with CMAKE_TOOLCHAIN_FILE=$EMSCRIPTEN/cmake/Modules/Platform/Emscripten.cmake
########################################################################################################################

cmake_minimum_required(VERSION 3.0.0)

project(gameboycore-web)

set(CMAKE_CXX_STANDARD 14)

set(EMSDK_ROOT $ENV{EMSCRIPTEN})
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${EMSDK_ROOT}/cmake/Modules")
set(CMAKE_PREFIX_PATH ${CMAKE_PREFIX_PATH} "${EMSDK_ROOT}/cmake/Modules")

########################################################################################################################
### External Dependencies                                                                                            ###
########################################################################################################################

add_subdirectory(src/external)

########################################################################################################################
### GameboyCore Web                                                                                                  ###
########################################################################################################################

add_executable(${PROJECT_NAME}
    src/gameboycore_web.cpp
)

target_link_libraries(${PROJECT_NAME}
    # Link to GameboyCore
    gameboycore::gameboycore

    # Emscripten compiler options
    "-o ${CMAKE_CURRENT_SOURCE_DIR}/dist/gameboycore.js"
    "--bind"
    "-s WASM=1"
    "-s MODULARIZE=1"
    "-s EXPORT_ES6=1"
    "--post-js ${CMAKE_CURRENT_SOURCE_DIR}/src/js/post.js"
    "-s DISABLE_EXCEPTION_CATCHING=0"
    "-s ALLOW_MEMORY_GROWTH=1"
)

target_compile_definitions(${PROJECT_NAME} PRIVATE GAMEBOYCORE_STATIC=1)
```

`src/external/CMakeLists.txt`:

```bash
set(BUILD_TESTS OFF CACHE BOOL "Disable tests")
set(BUILD_TOOLS OFF CACHE BOOL "Disable tools")

add_subdirectory(gameboycore)
```

So a few things.

First, I append `${EMSDK_ROOT}/cmake/Modules` to `CMAKE_MODULE_PATH` and `CMAKE_PREFIX_PATH`. This is necessary to build `GameboyCore` as Emscripten provides patches to make `TestBigEndian` and `CheckTypeSize` cmake modules work.

Next I included `gameboycore` via `add_subdirectory(src/external)` and added the gameboycore emscripten wrapper.

The call to `target_link_libraries` links `GameboyCore` to the Emscripten wrapper and sets some `emcc` flags. `MODULARIZE` and `EXPORT_ES6` are import to make the output Javascript an imported module (I import it into Typescript later).

**Emscripten Wrapper**

To create an Emscripten binding for GameboyCore I needed to make a class that adapts the Emscripten library to the GameboyCore API.

The first thing to do in allow ROM file loading. The ROM file will be loading from disk by Javascript and passed to C++ code. The pointer is actaully passed as an `int` and needs to be casted to a pointer GameboyCore can work with.

Here is the `loadROM` function:

```c++
bool loadROM(const uintptr_t handle, size_t size)
{
    try
    {
        const auto buffer = reinterpret_cast<const uint8_t*>(handle);
        core_->loadROM(buffer, size);
    }
    catch(const std::runtime_error& e)
    {
        return false;
    }

    return true;
}
```

The code I used to load the ROM file into C++:

```javascript
function loadFromArrayBuffer(core, buffer, length) {
    var ptr = Module._malloc(length);
    Module.HEAPU8.set(new Uint8Array(buffer), ptr);

    var result = core.loadROM(ptr, length);
    Module._free(ptr);

    return result;
}
```

One silly thing about `embind` is that arrays must be explictly defined include EACH index. For example, defining a simple 2 element array might look like the following.

```c++
    value_arrray<std::array<int, 2>>("array_int_2")
        .element(index<0>())
        .element(index<1>());
```

Which is fine for a two element array. In my case, `GPU::Scanline` is an array of pixels of size 160. You can't call `element` in a for loop because the integer is a template argument. However I used a simple meta-programming quick to get it to work. A recurvice struct.

```c++
template<typename ArrayT, size_t N>
struct ArrayInitializer : public ArrayInitializer<ArrayT, N-1>
{
    explicit ArrayInitializer(emscripten::value_array<ArrayT>& arr) : ArrayInitializer<ArrayT, N-1>{arr}
    {
        arr.element(emscripten::index<N-1>());
    }
};

template<typename ArrayT>
struct ArrayInitializer<ArrayT, 0>
{
    explicit ArrayInitializer(emscripten::value_array<ArrayT>& arr)
    {
    }
};

...

// Register array of Pixels as a Scanline
value_array<GPU::Scanline> scanline_value_array("Scanline");
ArrayInitializer<GPU::Scanline, std::tuple_size<GPU::Scanline>::value>{scanline_value_array};
```


**Building Emscripten Project**

Configure the CMake project by setting `CMAKE_TOOLCHAIN_FILE` to `$EMSCRIPTEN/cmake/Modules/Platform/Emscripten.cmake`

```bash
mkdir build && build
cmake .. -DCMAKE_TOOLCHAIN_FILE=$EMSCRIPTEN/cmake/Modules/Platform/Emscripten.cmake
```

I did this on Windows, so I needed to specify a different build system to work with the `emcc` compiler (The default is Visual Studio on Windows). I used `Ninja`.

```bash
cmake .. -GNinja -DCMAKE_TOOLCHAIN_FILE=$EMSCRIPTEN/cmake/Modules/Platform/Emscripten.cmake
```

Then build:

```
cmake --build .
```

This produces `dist/gameboycore.js` and `dist/gameboycore.wasm`.

React and Typescript
--------------------

At this point the library is ready to use. However, to learn more about web development I decided to use Typescript and React.

Typescript is a superset of Javascript and can import any javascript code, assuming you have the necessary declaration file.

For GameboyCore that is:

```typescript
declare module "gameboycore" {
    export interface Pixel {
        r: number;
        g: number;
        b: number;
    }

    export interface GameboyCore {
        new(): GameboyCore;
        loadROM(handle: number, length: number): void;
        setScanlineCallback(callback: (scanline: Pixel[], line: number) => void): void;
        setVBlankCallback(callback: () => void): void;
        emulateFrame(): void;
        release(): void;
    }

    export interface GameboyCoreJS {
        GameboyCore: GameboyCore;
        Pixel: Pixel,

        loadFromArrayBuffer(core: GameboyCore, buffer: ArrayBuffer, length: number): boolean;
    }

    export default function Module(emscriptenArgs: any): GameboyCoreJS;
}
```

`GameboyCoreJS` is an instance of `Module` generated by Emscripten.


And using the library

```typescript
import gameboy_wasm from 'gameboycore/dist/gameboycore.wasm';

private initializeGameboyCoreRuntime() {
    import('gameboycore').then(gb => {
        if (gb != null) {
            const runtime = gb.default({
                locateFile: (filename: string, dir: string): string => {
                    if (filename === 'gameboycore.wasm') {
                        return gameboy_wasm;
                    }
                    else {
                        return "";
                    }
                },
                onRuntimeInitialized: () => {
                    console.log('GameboyCoreJS runtime has been initialized');
                    this.initializeCore(runtime);
                }
            });

            this.setState({gbjs: runtime});
        }
    });
}

private initializeCore(runtime: GameboyCoreJS) {
    const core = new runtime.GameboyCore();
    if (core != null) {
        console.log('GameboyCore has been instantiated');
    }
    else {
        console.log('Failed to instanitate GameboyCore object');
    }
    this.setState({core});
}
```

The module is dynamically loaded and the default function is called. The default function is defined in the gameboycore declaration file and is a reference to the Emscripten Module function.

Importing `gameboycore.wasm` is important as it will allow webpack to bundle the file. Notice how it is used in the `locateFile` function.

Future Work
-----------

* Clean up the UI
* Save state to HTML internal storage
* Download ROM files from online hosts such as Vimm's Lair
* Deploy to Github Pages and Itch.io
