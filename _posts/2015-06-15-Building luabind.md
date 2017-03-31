---
layout: post
title: Building luabind
description: Notes of building luabind with Visual Studio 2013
tag: ["c++", "lua", "luabind", "visualstudio"]
thumbnail: /assets/2015/06/15/thumbnail.png
---

Just some quick notes on building luabind with Visual Studio 2013

Requirements
------------

* Lua 5.2 source
* luabind source
* Boost C++ source

Compatibility
-------------

First thing to remember is lua libs and luabind libs need to be compiled with the same version of
Visual Studio. So the easiest thing to do is compile everything from source. There are lua binaries
avaiable, however if using a version of VS above 2010 this won't be much help.

Building
--------

**Boost C++**

luabind relies on Boost C++. Simple go through the installation instructions on there Getting Started page.

luabind comes with a Boost.Build jam file for compiling but I had some trouble with it, so I decided to compile
through Visual Studio

**Build Lua**

* Create a new empty project in VS
* Add lua source files
* Add lua headers to the include path
* Set project output to static library (.lib)
* Compile sources. You will have a .lib file in the output directory

**Build luabind**

* Create a new empty project in VS
* Add luabind sources
* Add luabind to the include path
* Add Boost to the include path
* Add lua's .lib file's directory to the library search path and include in Linker -> Input
* Set project output as static library
* Compile sources

And thats it.
