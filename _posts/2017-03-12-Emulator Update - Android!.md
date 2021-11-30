---
layout: post
title: Emulator Update - Android!
description:
tag: ['C++', 'Java', 'Android']
thumbnail: /assets/2017/03/12/
repo: nnarain/dotrix-android
---

Here's a recording of GameboyCore running inside of an Android emulator. It's running surprising fast..

The GameboyCore library is included in the Android Studio build directly with Git submodules.

A `JNI` wrapper is was then made around the `GameboyCore` class along with the necessary native functions.

![Image not found!](/assets/2017/03/12/rec.gif)

There is currently no method of input so a gamepad overlay is what needs to be added next.
