---
layout: post
title: Simple 2D Terrain
tag: ['pcg', 'sfml', 'imgui', 'c++']
repo_url: https://github.com/nnarain/mapgen
---

Been spending some more time working on 2D map generation using the tool from the [previous]({% post_url 2018-04-14-Procedural 2D Maps %}) post. I ended up with the following terrain map.

![Image not found!](/assets/2018/04/22/terrain.png)

Not a bad start however it needs more variation.

The process is simple, but I'm not sure how well it will scale to 3D infinite terrain.

The first step was to create a "land mask". This is done using a fractal noise function and setting any value above sea level (zero) to land and anything below to water. Which gives the following land mass.

![Image not found!](/assets/2018/04/22/land.png)

Next step is to use another noise function (could just be a different seed) to determine elevation.

![Image not found!](/assets/2018/04/22/elevation.png)

Followed by moisuture/rainfall using a different noise function.

![Image not found!](/assets/2018/04/22/moisture.png)

Temperature is determined by 2 factors.

1. Elevation (The greater the altitude, the colder the temperature)
2. Latitude (north, south)

```python
elevation_temperature = 1.0 - elevation
latitude_temperature = 1.0 - distance_from_center

temperate = elevation_temperature + latitude_temperate # [0, 2]
```

![Image not found!](/assets/2018/04/22/temperature.png)

Next is figuring out what the current biome is. Biomes are determined by using the above moisture and temperature maps.

I found a really cool reference for biomes with respect to temperature and moisture.

![Image not found!](/assets/2018/04/22/biomes_ref.jpg)

I added 3 temperature threshold parameters to represent the 4 termperature regions. And 3 moisture threshold parameters to represent the change in rainfall.

Then simply use a series of `if/else` to find the right biome. Resulting in:

![Image not found!](/assets/2018/04/22/biomes.png)

Something to keep in mind is that biomes are informational. They do not dictate what specific block is at that location. They instead indicate a number of blocks that could be used or information on what that biome may contain (like trees).

For this map, Boreal and Temperate forests will have trees.

And in the final layer I wanted to show elevation using moutain ranges. So we end up with the first image.

![Image not found!](/assets/2018/04/22/terrain.png)

**Problems**

One problem is determining temperature in infinite terrain. It would mean that temperature would only be tied to elevation since there is no far north and south regions. Meaning you can't have low cold areas.

