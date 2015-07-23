---
layout: post
title: Voxel Lighting!
description: Update on my Voxel Engine!
tag: opengl c++
thumbnail: /assets/2015/07/23/terrain-multiple-lights-lightmap.png
---

Quick update on the progress of my voxel engine.

**Update 1**

- Moved from forward shading to deferred shading (which I started a blog post on!). 
- Since deferred shading breaks up the lightng information into textures, I can select which texture is displayed to visualize the information

For example below is the normal map of a generated terrain:

![Image not found!](/assets/2015/07/23/terrain-normalmap.png)

You can visually see where the normals are pointing (or atleast a general idea)

**Update 2**

- The cube meshes created now have per vertex normals

![Image not found!](/assets/2015/07/23/terrain2.png)

**Update 3**

- Voxel Lighting

![Image not found!](/assets/2015/07/23/terrain-multiple-lights.png)

The lights are propagated outwards to each adjacent block, using a breath-first search.

Here's the light map texture:

![Image not found!](/assets/2015/07/23/terrain-multiple-lights-lightmap.png)

- The lighting is also per face. Meaning it will wrap around corner and up walls.

![Image not found!](/assets/2015/07/23/terrain-per-face-lightning.png)

Another example, same scene from different angles:

![Image not found!](/assets/2015/07/23/terrain-per-face-lightning2.png)
![Image not found!](/assets/2015/07/23/terrain-per-face-lightning3.png)

**TODO**

- Working on debug utilities
- More user interface features (Working on a command line)