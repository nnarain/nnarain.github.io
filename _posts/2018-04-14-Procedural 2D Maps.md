---
layout: post
title: Procedural 2D Maps
tag: ['pcg', 'sfml', 'imgui', 'c++']
repo: nnarain/mapgen
project_id: world-procgen
---

I've been having trouble working on my procedural world project. I can get some have decent terrain but biomes are difficult to implement. They end up just not looking quite right.

I decided to focus on 2D map generation. Focus on the high level concepts of biome placement along with the terrain.

![Image not found!](/assets/2018/04/14/cap1.png)

Above is a tool I've made using `FastNoise`, `SFML` and `ImGui`. I'm going to use it to quickly iterate over different terrain generation methods.

The program loads parameters from a `yaml` file and allows adjusting of those values in the parameter window. When the parameters are updated the map display is regenerated with the new parameters.

For example:

```yaml
FastNoise:
  noise:
    noise_type: cubic_fractal
    fractal_type: fbm
    interp_type: quintic
    seed: -1026
    frequency: 0.02
    octaves: 5
    gain: 0.577
    lacunarity: 1.833
    celluar_distance: euclidean
    cellular_return: distance2add
    cellular_jitter: 0.1
```

You can also select to view any number of user defined layers. For example you could have a layers showing elevation, moisture and temperature.

![Image not found!](/assets/2018/04/14/cap2.png)

The above screenshot shows a "Land Mask" layer which indicates where land and water are located.

My experience with `FastNoise` so far has been really good and luckly there is a C# implementation of it. I'll will probably add it to my unity project and get rid of the inidiviual noise classes.


Future additions to this tool

* multithreaded generation of the texture
* move generation logic to scripts (lua)

