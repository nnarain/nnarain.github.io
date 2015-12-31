---
layout: post
title: Voxel Lighting!
description: Update on my Voxel Engine!
tag: opengl c++
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

<div id="image-carousel" class="carousel slide" data-ride="carousel" data-interval="false">
  <!-- Indicators -->
  <ol class="carousel-indicators">
    <li data-target="#image-carousel" data-slide-to="0" class="active"></li>
    <li data-target="#image-carousel" data-slide-to="1"></li>
    <li data-target="#image-carousel" data-slide-to="2"></li>
    <li data-target="#image-carousel" data-slide-to="3"></li>
    <li data-target="#image-carousel" data-slide-to="4"></li>
    <li data-target="#image-carousel" data-slide-to="5"></li>
    <li data-target="#image-carousel" data-slide-to="6"></li>
  </ol>

  <!-- Wrapper for slides -->
  <div class="carousel-inner" role="listbox">
    <div class="item active">
      <img src="/assets/2015/07/23/terrain-normalmap.png" alt="...">
      <div class="carousel-caption">
        You can visually see where the normals are pointing (or atleast a general idea)
      </div>
    </div>
    <div class="item">
      <img src="/assets/2015/07/23/terrain2.png" alt="...">
      <div class="carousel-caption">
        The cube meshes created now have per vertex normals
      </div>
    </div>
    <div class="item">
      <img src="/assets/2015/07/23/terrain-multiple-lights.png" alt="...">
      <div class="carousel-caption">
        The lights are propagated outwards to each adjacent block, using a breath-first search.
      </div>
    </div>
    <div class="item">
      <img src="/assets/2015/07/23/terrain-multiple-lights-lightmap.png" alt="...">
      <div class="carousel-caption">
        Here's the light map texture.
      </div>
    </div>
    <div class="item">
      <img src="/assets/2015/07/23/terrain-per-face-lightning.png" alt="...">
      <div class="carousel-caption">
        Lighting is per face meaning light propagates up and around other blocks
      </div>
    </div>
    <div class="item">
      <img src="/assets/2015/07/23/terrain-per-face-lightning2.png" alt="...">
      <div class="carousel-caption">
        another example of per face lighting
      </div>
    </div>
    <div class="item">
      <img src="/assets/2015/07/23/terrain-per-face-lightning3.png" alt="...">
      <div class="carousel-caption">
        Same scene from another angle
      </div>
    </div>
  </div>

  <!-- Controls -->
  <a class="left carousel-control" href="#image-carousel" role="button" data-slide="prev">
    <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
    <span class="sr-only">Previous</span>
  </a>
  <a class="right carousel-control" href="#image-carousel" role="button" data-slide="next">
    <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
    <span class="sr-only">Next</span>
  </a>
</div>

**TODO**

- Working on debug utilities
- More user interface features (Working on a command line)