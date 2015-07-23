---
layout: post
title: Deferred Shading with SGL
description: Deferred Shading example using SGL
tag: opengl c++
thumbnail: /assets/2015/07/08/deferredshading1.png
---

This post is going to show an implementation of deferred shading using SGL.

<br>

**What is Deferred Shading?**

Well first lets talk about forward shading. Forward shading is when light calculations are done for every fragment in the scene. Now the key problem here is that the calculations are done for every fragment even if that fragment doesn't end up on the screen. In a complex scene, with a lot of overlapping objects (called depth complexity), this can add up to a lot of wasted lighting calculations.

This is where deferred shading comes in. Deferred shading seperates the rendering of geometry and the light calculations. There are two passes, the first is the geometry pass, where the information needed for lighting is calculated and stored away in textures. The next pass is the lighting pass, where the calculations actually take place. The cool part is that, because of the geometry pass, only fragments that have passed the depth test are store in the textures, meaning there are no wasted light calculations.

<br>

**Time for some code!**

I'll just cover the SGL code required for deferred shading and not context creation. I'm using GLFW and Visual Studio 2013.

So what do we need? Two shader programs, one for each pass. And a new class to hold the output texture data from the geometry pass, this is called the GBuffer.

We're also going to be using some 2D rendering for visualization.

{% highlight c++ %}

// Example.h

#pragma once

#include "GBuffer.h"

#include <SGL/Util/PerspectiveCamera.h>

#include <SGL/GL/ShaderProgram.h>
#include <SGL/GL/Mesh.h>

#include <SGL/Graphics/SpriteBatch.h>

#include <SGL/Util/ObjModel.h>

#include <SGL/Math/Matrix4.h>

class Example
{
public:

	Example();
	~Example();

	void init();
	void update(float delta);
	void render();

private:

	sgl::PerspectiveCamera camera;       //

	sgl::ShaderProgram     geometryPass; // first pass shader
	sgl::ShaderProgram     lightPass;    // secound pass shader

	GBuffer                gBuffer;      // container for output textures

	sgl::ObjModel          model;        // a model to draw
	sgl::Matrix4           transform;    // the models transform matrix

	sgl::SpriteBatch       batch;        // for some visulization

};

{% endhighlight %}

Let's take a look at the init function, then we'll look at the GBuffer class.

{% highlight c++ %}

// Example.cpp

#include <SGL/Util/Exception.h>
#include <SGL/Util/ObjLoader.h>

#include <iostream>

using namespace sgl;

Example::Example() : camera(45, 1080, 720)
{

}

Example::init()
{
	try
	{
		// load geometry pass shader
		geometryPass.loadFromFile(
			"assets/geometrypass.vert.glsl",
			"assets/geometrypass.frag.glsl"
		);

		geometryPass.addAttribute("vPosition");
		geometryPass.addAttribute("vNormal");
		geometryPass.addAttribute("vTexCoord");
		
		geometryPass.bindFragOutput("outPosition");
		geometryPass.bindFragOutput("outNormal");
		geometryPass.bindFragOutput("outTexCoord");
		geometryPass.bindFragOutput("outDiffuse");

		geometryPass.link();

		//
		camera.setPosition(0, 3, 3);
		camera.lookAt(0,0,0);

		...

	}
	catch(Exception& e)
	{
		std::cout << "Failed to initialize Example" << std::endl;
		throw Exception(e.what());
	}
}

{% endhighlight %}

Alright, so pretty simple. We load a shader program from a set of files and bind vertex attributes to their locations.

Something important here is the bindFragOutput function. The GBuffer (shown below) uses Multiple Render Targets to store data from the fragment shader. The output textures in the GBuffer are attached to specfic output locations in the fragment shader, its important to explicitly set the outputs so that everything matches.



The GBuffer class is a container for the output textures from the geometry pass shader. We will be using textures to store position, normal and diffuse information from the geometry pass.

{% highlight c++ %}

// GBuffer.h

class GBuffer
{
public:

	GBuffer();
	~GBuffer();

	void init(int width, int height);

	void bindForWriting();
	void bindForReading();
	void unbind();

	sgl::Texture& getPositionTexture();
	sgl::Texture& getTexCoordTexture();
	sgl::Texture& getNormalTexture();
	sgl::Texture& getDiffuseTexture();

private:

	sgl::FrameBuffer _fbo;

	sgl::Texture _pos;
	sgl::Texture _texCoord;
	sgl::Texture _diffuse;
	sgl::Texture _normal;

	sgl::RenderBuffer _depth;

private:

	void initTexture(sgl::Texture& texture, int w, int h);

{% endhighlight %}  

