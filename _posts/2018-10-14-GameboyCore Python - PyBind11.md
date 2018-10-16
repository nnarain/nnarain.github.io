---
layout: post
title: GameboyCore Python - PyBind11
tag: ['gameboycore', 'python', 'c++', 'pybind11', 'emulator']
repo_url: https://github.com/nnarain/gameboycore-python
---

Recently an old issue with `GameboyCore Python` [popped up](https://github.com/nnarain/gameboycore-python/issues/19) again where users were having problems opening ROMs files.

I was not able to reproduce this problem however the two possible causes that I found while searching indicated that they are `Boost.Python` related.

I was stuck. And then today, a [PR](https://github.com/nnarain/gameboycore/pull/132) popped up on the `gameboycore` repo.

The user pointed out the two biggest usability issues with the gameboycore python package. The first was that pip packages are not supported on Linux and the second was requiring Boost!

Now a `pip install gameboycore` would be ideal for installation but atleast if it is not possible a user should still be able to install the package easily from source.

Welp. A source installation requires installing Boost! A massive dependency for a very small python binding! Not to mention the many different version of Boost. you can build against.

Removing Boost.Python
---------------------

Enter `pybind11`. A C++11/14 library for building python extensions.

I was blown away that this library existed. It's basically `Boost.Python` but without Boost! The interface for creating python modules is 99% indentical to that of Boost.Python. In most cases I was just changing the namespace name when I ported everything over.

```c++
PYBIND11_MODULE(gameboycore, m) {
    namespace py = pybind11;

    py::class_<gb::Pixel>(m, "Pixel")
        .def_readwrite("r", &gb::Pixel::r)
        .def_readwrite("g", &gb::Pixel::g)
        .def_readwrite("b", &gb::Pixel::b);

    py::enum_<gb::Joy::Key>(m, "JoypadKey")
        .value("KEY_RIGHT",  gb::Joy::Key::RIGHT)
        .value("KEY_LEFT",   gb::Joy::Key::LEFT)
        .value("KEY_UP",     gb::Joy::Key::UP)
        .value("KEY_DOWN",   gb::Joy::Key::DOWN)
        .value("KEY_A",      gb::Joy::Key::A)
        .value("KEY_B",      gb::Joy::Key::B)
        .value("KEY_SELECT", gb::Joy::Key::SELECT)
        .value("KEY_START",  gb::Joy::Key::START);

    py::enum_<GameboyCorePython::KeyAction>(m, "KeyAction")
        .value("ACTION_PRESS", GameboyCorePython::KeyAction::PRESS)
        .value("ACTION_RELEASE", GameboyCorePython::KeyAction::RELEASE);

    py::class_<gb::Sprite>(m, "Sprite")
        .def_readwrite("y",      &gb::Sprite::y)
        .def_readwrite("x",      &gb::Sprite::x)
        .def_readwrite("tile",   &gb::Sprite::tile)
        .def_readwrite("attr",   &gb::Sprite::attr)
        .def_readwrite("height", &gb::Sprite::height);

    py::bind_vector<GameboyCorePython::ByteList>(m, "ByteList");
    py::bind_vector<GameboyCorePython::PixelList>(m, "PixelList");
    py::bind_vector<GameboyCorePython::SpriteList>(m, "SpriteList");

    py::class_<GameboyCorePython>(m, "GameboyCore")
        .def(py::init<>())
        .def("open",                       &GameboyCorePython::open)
        .def("input",                      &GameboyCorePython::input)
        .def("update",                     &GameboyCorePython::update)
        .def("register_scanline_callback", &GameboyCorePython::registerScanlineCallback)
        .def("register_vblank_callback",   &GameboyCorePython::registerVBlankCallback)
        .def("get_background_hash",        &GameboyCorePython::getBackgroundHash)
        .def("get_background_tilemap",     &GameboyCorePython::getBackgroundTileMap)
        .def("get_sprite_cache",           &GameboyCorePython::getSpriteCache);

}
```

Not only is the interface the same, the library is 1000x easier to get start with than Boost. You install `pybind11` pip package which installs the library headers. You then configure `setup.py` to include the `pybind11` include directory and build the extension. That's it. No complicated installation and linking to Boost libraries.

The following is the new method for source installation:

```bash
    $ git clone https://github.com/nnarain/gameboycore-python
    $ cd gameboycore-python
    $ pip install -e .
```

And it works!

![Image not found!](/assets/2018/10/14/tests.png)

Building a source package for Linux
-----------------------------------

Ideally, since this is a native extension, the package would be pre-compiled and uploaded as a `wheel` file to `pypi`. However, Linux does not (easily) support wheel files. It is possible see [pypa/manylinux](https://github.com/pypa/manylinux) but requires a somewhat more complicated setup. The next best option is using a source distribution.

As I mentioned above I didn't use a source distribution before because of Boost. But now I can!

So in general this is pretty easy, you would run:

```bash
    $ python setup.py sdist upload

    or the prefered way

    $ python setup.py sdist
    $ twine upload dist/*
```

In my case I am deploying with Travis CI:

```yaml
deploy:
  provider: pypi
  user: nnarain
  password:
    secure: ...
  distributions: sdist
```

This actually appeared to work on the first attempt, however when I attempted to import the gameboycore module, it failed claiming the `initgameboycore` function was not present.

Now what I realized was that the source files for `gameboycore` were not being installed in the source distribution. And the build command that setuptools was running will actually still generate the shared library just with nothing in it! That command is below for interest's sake.

```
$ x86_64-linux-gnu-gcc -pthread -shared -Wl,-O1 -Wl,-Bsymbolic-functions -Wl,-Bsymbolic-functions -Wl,-z,relro -fno-strict-aliasing -DNDEBUG -g -fwrapv -O2 -Wall -Wstrict-prototypes -Wdate-time -D_FORTIFY_SOURCE=2 -g -fstack-protector-strong -Wformat -Werror=format-security -Wl,-Bsymbolic-functions -Wl,-z,relro -Wdate-time -D_FORTIFY_SOURCE=2 -g -fstack-protector-strong -Wformat -Werror=format-security -o build/lib.linux-x86_64-2.7/gameboycore.so
```

The reason the source files were not being copied into the source distribution was because I was using absolute paths!

```python
GAMEBOYCORE_INCLUDE_DIR = os.path.join(DIR, 'src', 'gameboycore', 'include')

# collect sources
sources = []
for current_dir, dirs, files in os.walk(os.path.join(DIR, 'src')):
    # skip test code
    if 'tests' in dirs:
        dirs.remove('tests')
    if 'example' in dirs:
        dirs.remove('example')

    for f in files:
        ext = os.path.splitext(f)[1]
        if ext == '.cpp':
            sources.append(os.path.join(current_dir, f)
```

Changing these to relative pathes worked

```python
GAMEBOYCORE_INCLUDE_DIR = os.path.join('src', 'gameboycore', 'include')

# collect sources
sources = []
for current_dir, dirs, files in os.walk('src'):
    # skip test code
    if 'tests' in dirs:
        dirs.remove('tests')
    if 'example' in dirs:
        dirs.remove('example')

    for f in files:
        ext = os.path.splitext(f)[1]
        if ext == '.cpp':
            filepath = os.path.join(current_dir, f)
            sources.append(os.path.relpath(filepath, DIR))
```

Well that covers the source files, but what about the header files?

Well apparently setuptools simply does not do this automatically, even though it probably should.

[https://stackoverflow.com/questions/7522250/how-to-include-package-data-with-setuptools-distribute](https://stackoverflow.com/questions/7522250/how-to-include-package-data-with-setuptools-distribute)

[https://github.com/pypa/setuptools/issues/1162](https://github.com/pypa/setuptools/issues/1162)

[https://bitbucket.org/blais/beancount/src/ccb3721a7811a042661814a6778cca1c42433d64/setup.py?fileviewer=file-view-default#setup.py-36](https://bitbucket.org/blais/beancount/src/ccb3721a7811a042661814a6778cca1c42433d64/setup.py?fileviewer=file-view-default#setup.py-36)

[https://github.com/pypa/pip/issues/2381](https://github.com/pypa/pip/issues/2381)


But there is a solution and that is adding a `MANIFEST.in` file. In the root directory I added `MANIFEST.in` with the following:

```
recursive-include src *.h
recursive-include src *.hpp
```

Now source source installations from pypi are working.

```
$ pip install gameboycore
```
