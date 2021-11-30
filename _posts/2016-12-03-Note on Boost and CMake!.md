---
layout: post
title: Note on Boost and CMake!
description: hahahahahahahahahaha
tag: ['cmake', 'boost']
thumbnail: /assets/2016/12/03/
repo:
---

The below Boost CMake variables might be needed for CMake to find Boost on Windows!

```bash
cmake .. -DBoost_USE_STATIC_LIBS=ON -DBoost_USE_MULTITHREADED=ON
```

That is all...
