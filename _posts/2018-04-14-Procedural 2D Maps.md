---
layout: post
title: Procedural 2D Maps
tag: ['pcg', 'sfml', 'imgui', 'c++']
repo_url: https://github.com/nnarain/mapgen
---

I've been having trouble working on my procedural world project. I can get some have decent terrain but biomes are difficult to implement. They end up just not looking quite right.

I decided to focus on 2D map generation. Focus on the high level concepts of biome placement along with the terrain.

![Image not found!](/assets/2018/04/14/cap1.png)

Above is a tool I've made using `FastNoise`, `SFML` and `ImGui`. I'm going to use it to quickly iterate over different terrain generation methods.

The program loads parameters from a `yaml` file and allows adjusting of those values in the parameter window. When the parameters are updated the map display is regenerated with the new parameters.

The biggest problem with the procedural world project is that I can't quick iterate over different values. I shouldn't have that problem with this tool.

![Image not found!](/assets/2018/04/14/cap2.png)

My experience with `FastNoise` so far has been really good and luckly there is a C# implementation of it. I'll will probably add it to my unity project and get rid of the inidiviual noise classes.

Future additions to this tool

* multithreaded generation of the texture
* move generation logic to scripts (lua)

