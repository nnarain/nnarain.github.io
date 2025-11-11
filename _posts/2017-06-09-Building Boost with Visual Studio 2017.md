---
layout: post
title: Building Boost with Visual Studio 2017
description:
tag: ['boost']
thumbnail: /assets/2017/06/09/
repo:
---

So I feel like I make a lot of posts about how to build Boost... Anyways..

The issue is that the Boost.Build system does not support building the current version of Visual Studio.

Here's how to work around that.

**Build Boost with Visual Studio 2017**

* Download and extract Boost. Currently I'm using Boost 1.64
* Navigate to Boost directory

* Run bootstrap

```bash
    /> bootstrap
```

* Open `project-config.jam` and edit the file to the following

```bash
import option ;

using msvc : 14.0 : "c:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Tools\MSVC\14.10.25017\bin\HostX86\x86\cl.exe";

option.set keep-going : false ;
```

Ensure the path to `cl` matches what is on your system.

* Build Boost

```bash
    /> b2 toolset=msvc-14.0 address-model=32 architecture=x86 link=static threading=multi stage
```

**Optional: CMake**

```bash
    /> cd /path/to/project && mkdir build && cd build
    /> cmake .. -G "Visual Studio 14" -DBoost_USE_STATIC_LIBS=ON -DBoost_USE_MULTITHREADED=ON
```
