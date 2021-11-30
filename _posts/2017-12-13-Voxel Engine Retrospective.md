---
layout: post
title: Voxel Engine Retrospective
description: 
tag: ['voxels', 'voxel-engine', '3d']
thumbnail: /assets/2017/12/13/
repo: 
---

Small reflection on the `voxel engine` I worked on a few years ago and future projects.

**Github**
* [Voxel Engine](https://github.com/nnarain/VoxelEngine)

**Post**
* [Intro to my Voxel Engine]({% post_url 2015-06-26-Intro to my Voxel Engine %})
* [Voxel Lighting!]({% post_url 2015-07-23-Voxel Lighting! %})

The Goal
--------

I find procedurally generated content to be extremely interesting and one of the major pulls to use it is the ability to generate a whole world randomly. As a hobbyist who isn't particularly good making art assets.. its very appealing.

So the goal of my voxel engine was to generate procedural terrain and allow users to write scripts to build a game in the procedural world.

Problems
---------

**Feature Priority**

Focusing on the wrong things at the wrong times. Embedding a scripting language is cool but it should have been one of the last things I worked on. I should have has a complete voxel engine that can render infinite terrain before worrying about the scripting API. 

**Reinventing the Wheel**

Not only was I building a voxel engine, I was building a graphics engine built on OpenGL. My OpenGL util library SGL had: OpenGL utils, linear math, frustum culling, colliders, deferred shading, etc, etc. All really interesting stuff and fun to work on but a big task.

If I want to build a game why not use an actual game engine?!

Future
------

Procedural generation is interesting and I would like to explore what you can do with it.

* 2D maps
* 3D infinite terrain
  * trees/vegataion.rocks
  * cliffs/overhang
  * rivers
  * oceans
  * different biomes
* Cities
  * Houses/Castles
* Dungeons
* Weapons
* Creatures
* Planets
* Mapping terrain to planet surface
* Solar systems
* Galaxies

You get the idea.

So my new plan is pretty much the old plan except keeping past mistakes in mind.

Work in segments. All the above can be worked on indepently and there is a lot to learn for each topic.
Make small projects to enforce individual concepts.

Eventually things can start coming together.

