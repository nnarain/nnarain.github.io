---
layout: post
title: Procedural World Update and Changes
tag: ['pcg']
repo: nnarain/World
project_id: world-procgen
---


I've been working on this project on and off for a few months now, here are some thoughts.


**3D Noise is hard**

I've been playing around with using 3D noise for a while and still haven't quite wrapped my head around how to shape the noise function the way I want. It might just require more tweaking. The approach Im taking is generating a height map as a bias for the density funtion. Something like:

```python
for x, y, z in chunk:
    # initial bias using the height map
    density = seaLevel - heightMap(x, z)
    # apply 3D noise
    density += densityNoise(x, y, z)

    # if solid
    if density > 0:
        block = ...
    else:
        block = AIR
```

The point of 3D noise is to generate overhang. This approach so far hasn't really given me that. But then again my mountains may not be steep enough to notice.

This has lead me to wonder if 3D noise is really necessary. You can generate nice looking height maps that do not contain overhang. Realistically not every mountain will have overhang and that doesn't mean you can't have cliffs.

So I'm thinking the best thing to do is work on refining 2D height maps. There are lots of techniques I haven't really tried. Like domain warping, ridge noise and terracing. 

**Biomes**

The other thing to think about is how to place biomes. At this point I've been defining rainfall and temperature maps and using the Whittaker diagram to determine biomes. The problem is the biomes using strict thresholds and end up looking too blobby. As seen here:

![Image not found!](/assets/2018/05/19/cap4.png)

The better approach might be to blend the adjacent biomes together via percentages. If the current biome is transitioning to another biome, make the probability of the block being of the current biome proportional to the distance from the biome edge. So the blocks end up mixing together.

Also I like the idea of setting biomes using voronoi diagrams. Even if they weren't placed realistically. The problem I've encountered while trying this is transitioning the biomes into each other. There has to be a way of merging the different biome height maps. I believe Minecraft solves this problem by placing rivers at the biome edges. If I can get something like that working, I could make biomes "pluggable" allowing later additions without modifying any core logic.

**Moving away from Unity**

Right now I'm experimenting in a Unit3D project. Thing is I really don't have a game in mind. I don't want to make a Minecraft clone. I was thinking a rouge-like game where you complete procedurally generated quests and accomplish some overall task like "conquer this city". But that would be ridiculously far in the future.

Ultimately the terrain generation, regardless of its implementation, should be independent from the client that uses it. The terrain/world generation should be contained in a library and brought in using bindings for the given engine or framework.

I will probaby set this up as a Rust crate. Something like `terrain_gen`. Also I was thinking of moving to Godot as it can interface with external libraries using GDNative scripts. On top of being open source and all that.

**Blocks or no blocks**

I'll be sticking with the blocks for now. I think ultimately I'll want to move to smooth low poly terrain. But blocks still work pretty well and with tools like `MagicaVoxel` I can make voxel art to go along with the terrain.

**End goal**

No idea.

There really isn't an end goal here. Which does make the question of "is this good?" a challenge to answer. I not really aiming at a game. It's more of a world simulation. Generate terrain, buildings, weather, etc.
