---
layout: post
title: Voxel Lighting!
description: Update on my Voxel Engine!
tag: ["opengl", "c++"]
thumbnail: /assets/2015/07/23/terrain-multiple-lights-lightmap.png
repo_url: https://github.com/nnarain/VoxelEngine
prev_post: 2015-06-26-Intro to my Voxel Engine
next_post:
---

Quick update on the progress of my voxel engine.

**Updates**

- Moved from forward shading to deferred shading (which I started a blog post on!).
- Since deferred shading breaks up the lightng information into textures, I can select which texture is displayed to visualize the information
- The cube meshes created now have per vertex normals
- Voxel Lighting

<div class="image-list">
/assets/2015/07/23/terrain-normalmap.png;
/assets/2015/07/23/terrain2.png;
/assets/2015/07/23/terrain-multiple-lights.png;
/assets/2015/07/23/terrain-multiple-lights-lightmap.png;
/assets/2015/07/23/terrain-per-face-lightning.png;
/assets/2015/07/23/terrain-per-face-lightning2.png;
/assets/2015/07/23/terrain-per-face-lightning3.png
</div>

**TODO**

- Working on debug utilities
- More user interface features (Working on a command line)
