---
layout: post
title: Building Boost.Python
description:
tag: ['boost', 'python', 'c++']
thumbnail: /assets/2016/12/03/
repo_url:
---


Having made a fair amount of progress on the [GameboyCore](https://github.com/nnarain/) I wanted to start extending is functionality.

Since GameboyCore is a standalone library it can be compiled on any platform with a C++11 compiler.

This post is about setting up Boost.Python and building Python bindings for GameboyCore.


Python
------

I'm using Python 3.5. The reason is because Python 2.7 needs to be compiled with Visual Studio 9.0 which does not support C++11.

Boost.Python
------------

Building Boost.Python was actually rather painless...

**Build Configuration**

```bash
bootstrap --with-python=python3.5
bjam --with-python python-debugging=off threading=multi variant=debug link=static stage
```

The options specified above really matter (at least on Windows). Boost.Python is linked statically.

Lastly it is important to define `BOOST_PYTHON_STATIC_LIB` to prevent boost from linking shared libraries by default.

Here's what the module .cpp file looks like so far:

```c++
#define BOOST_PYTHON_STATIC_LIB
#include <boost/python.hpp>

#include "gameboycore_python.h"

using namespace boost::python;

BOOST_PYTHON_MODULE(gameboycore)
{
    class_<gb::APU, boost::noncopyable>("APU", no_init);
    class_<gb::CPU, boost::noncopyable>("CPU", no_init);
    class_<gb::GPU, boost::noncopyable>("GPU", no_init);
    class_<gb::Joy, boost::noncopyable>("Joy", no_init);
    class_<gb::MMU, boost::noncopyable>("MMU", no_init);


    class_<GameboyCorePython>("GameboyCore")
        .def("apu", &GameboyCorePython::apu, return_internal_reference<>())
        .def("cpu", &GameboyCorePython::cpu, return_internal_reference<>())
        .def("gpu", &GameboyCorePython::gpu, return_internal_reference<>())
        .def("joy", &GameboyCorePython::joy, return_internal_reference<>())
        .def("mmu", &GameboyCorePython::mmu, return_internal_reference<>());
}
```
