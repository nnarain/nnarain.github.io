---
layout: post
title: Config issues with Qt and Visual Studio
description: Notes on issues with Qt and Visual Studio
tag: ['qt', 'visual studio']
thumbnail: /assets/2017/11/10/
repo: 
---

A recent Windows 10 update manage to break my Visual Studio installation and also my Qt installation.. Forcing me to reinstall and face some configuration issuses. 

Visual Studio
-------------

Had to reinstall.

Environment Vars
----------------

For whatever reason the Windows update decided it was a good idea to change all of my environment variables to point to the C drive instead of my D drive. I had to manually determine which pathes were valid.

Qt MSVC Environment Setup
-------------------------

The first error encountered was Qt not being able to initialize the VS environment. I got the following error:

```
Failed to retrieve msvc environment from vcvarsall.bat
```

`vcvarsall.bat` is located at `D:\Program Files (x86)\Microsoft Visual Studio 14.0\VC`. It initializes the Visual Studio environment. 

This batch file requires the `VS140COMNTOOLS` environment variable to to set (One of the variables change by the update). Ensure that it points to The correct directory.

For example: `D:\Program Files (x86)\Microsoft Visual Studio 14.0\Common7\Tools\`

`vcvarsall.bat` reads from the registry to find information about Visual Studio. Due to the update, or perhap incorrect installation, the registry value was not set correctly.

To edit the registry open run dialog (`Win + R`) and type `regedit`. Navigate to `Computer\HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\SxS\VS7` and ensure the values present are correct.

This allowed Qt to initialize the Visual Studio environment.

Missing include type_traits
---------------------------

Qt then gave this error:

```
D:\Qt\5.9.2\msvc2015\include\QtCore\qglobal.h:45: error: C1083: Cannot open include file: 'type_traits': No such file or directory
```

I should have noticed this sooner but it wasn't super apparent at first. The include path shown indicates it was using the MSVC 2015 build kit. But since I had reinstalled I was using the MSVC 2017 compiler.

Qt will pick several build kits to build against when you setup a project. Ensure the build kits selected actual have valid compilers on your system.
