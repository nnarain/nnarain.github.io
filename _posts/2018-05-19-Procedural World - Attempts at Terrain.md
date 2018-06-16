---
layout: post
title: Procedural World - Attempts at Terrain
tag: ['pcg', 'unity']
repo_url: https://github.com/nnarain/World
---

For the last little while I have been attempting to generate some nice looking terrain. I've been finding with somewhat difficult as it is hard to understand exactly how to space everything out. Though I have slowly started to gain some understanding and techniques for how to do this.

Below are a few screenshots I've taken at my attempts at procedural terrain.

![Image not found!](/assets/2018/05/19/cap1.png)

First attempt using 3D noise, not looking so hot..

![Image not found!](/assets/2018/05/19/cap2.png)

After following some advice in GPU Gems Chapter 3, I managed to get something with mountains and caves! Though ultimately this is rather slow and aside from this one screenshot didn't look that great. Also with 3D you still have to make it follow a sort of height map (or reduce density as you go up) or else the mountain clip off the top, as seen in the image.

3D noise is a little harder to manager, but ultimately will give better results. That being said I'm going to focus on 2D height maps for now.

![Image not found!](/assets/2018/05/19/cap3.png)

Back to 2D noise. Nice view. But too "hilly".

![Image not found!](/assets/2018/05/19/fastnoise1.png)

Move to using `Fast Noise`. Well something went wrong here but this might be a way to insert "feature" points.

Also I moved away from using textured blocks. It is much easier to iterate on colors instead of textures. Plus the textures required more optimizaion to run smoothly.
The plan is to use simple colors + shaders to define the look of the terrain. When I have established the types of block types I want to use I can make the required textures.

![Image not found!](/assets/2018/05/19/mountain3.png)

Some mountains that I actually like. These mountains have to be climbs, they have peaks but also flatter areas just at a higher elevation. They "feel" more mountainous than anything I've made so far.

![Image not found!](/assets/2018/05/19/cap4.png)

Bird's eye view.

This terrain uses 5 noise maps with different frequencies and amplitudes. I found that being able to raise the noise sample to a power is essential to getting some variety in the map. Or else everything blends together, but not in the good way.


At this point I'm going back to chunk management to improve loading chunks. I really should just be able to drop the player into the world and have them be completely unaware of the loading/generation/unloading that is going on.

Edit:

![Image not found!](/assets/2018/05/19/mountain4.png)
