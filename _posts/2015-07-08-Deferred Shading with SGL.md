---
layout: post
title: Deferred Shading with SGL
description: Deferred Shading example using SGL
tag: ["opengl", "c++"]
thumbnail: /assets/2015/07/08/deferredshading1.png
prev_post: 2015-05--03-SGL FPS Counter
next_post:
---

This post is going to show an implementation of deferred shading using [SGL](https://github.com/nnarain/sgl-wrapper).

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

	sgl::PerspectiveCamera _camera;       //

	sgl::ShaderProgram     _geometryPass; // first pass shader
	sgl::ShaderProgram     _lightPass;    // secound pass shader

	GBuffer                _gBuffer;      // container for output textures

	sgl::ObjModel          _model;        // a model to draw
	sgl::Matrix4           _transform;    // the models transform matrix

	sgl::SpriteBatch       _batch;        // for some visulization

};

{% endhighlight %}

Let's take a look at the init function, then we'll look at the GBuffer class.

{% highlight c++ %}

// Example.cpp

#include <SGL/Util/Exception.h>
#include <SGL/Util/ObjLoader.h>

#include <iostream>

using namespace sgl;

Example::Example() : _camera(45, 1080, 720)
{

}

Example::init()
{
	try
	{
		// load geometry pass shader
		_geometryPass.loadFromFile(
			"assets/geometrypass.vert.glsl",
			"assets/geometrypass.frag.glsl"
		);

		_geometryPass.addAttribute("vPosition");
		_geometryPass.addAttribute("vNormal");
		_geometryPass.addAttribute("vTexCoord");

		// bind targets to their output locations
		// order matters!
		// i.e, outPosition is render target 0, outNormal is render target 1, etc
		_geometryPass.bindFragOutput("outPosition");
		_geometryPass.bindFragOutput("outNormal");
		_geometryPass.bindFragOutput("outTexCoord");
		_geometryPass.bindFragOutput("outDiffuse");

		_geometryPass.link();

		//
		_camera.setPosition(0, 3, 3);
		_camera.lookAt(0,0,0);

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

The GBuffer contains a underlying frame buffer object that we will render, along with 4 textures that will be used to store data shading data from the fragment shader.

The depth buffer is required as we need to do depth testing.

{% highlight c++ %}

#include "GBuffer.h"

using namespace sgl;

GBuffer::GBuffer() :
	// initialize every texture as a texture 2d
	_pos(Texture::Target::TEXTURE2D),
	_texCoord(Texture::Target::TEXTURE2D),
	_diffuse(Texture::Target::TEXTURE2D),
	_normal(Texture::Target::TEXTURE2D)
{
}

void GBuffer::init(int width, int height)
{
	// initialize all textures

	initTexture(_pos, width, height);
	initTexture(_texCoord, width, height);
	initTexture(_diffuse, width, height);
	initTexture(_normal, width, height);

	// init depth buffer
	_depth.bind();
	_depth.storage(RenderBuffer::Storage::DEPTH, 1080, 720);
	_depth.unbind();

	// start working with this frame buffer
	_fbo.bind();

	// set the depth buffer
	_fbo.setRenderBuffer(_depth, FrameBuffer::Attachment::DEPTH);

	// add the specified textures to a render target
	// order matters!
	// i.e. _pos texture will be added to the first render target (target 0), _normal to render target 1, etc.

	// this is the same order as the frag outputs that were bound to the shader earlier.

	_fbo.addMRT(_pos);
	_fbo.addMRT(_normal);
	_fbo.addMRT(_texCoord);
	_fbo.addMRT(_diffuse);

	// finalize the render targets
	_fbo.setMRTBuffers();

	// check that the frame buffer status is ok
	_fbo.checkError();

	_fbo.unbind();
}

void GBuffer::bindForWriting()
{
	_fbo.bind(FrameBuffer::Target::DRAW);
}

void GBuffer::bindForReading()
{
	_pos.bind(Texture::Unit::T0);
	_normal.bind(Texture::Unit::T1);
	_texCoord.bind(Texture::Unit::T2);
	_diffuse.bind(Texture::Unit::T3);
}

void GBuffer::unbind()
{
	_fbo.unbind();
}

void GBuffer::initTexture(sgl::Texture& texture, int w, int h)
{
	texture.bind();

	// set data type
	texture.setPixelDataType(GLType::FLOAT);

	// set dimesions
	texture.setWidth(w);
	texture.setHeight(h);

	// set formats
	texture.setFormat(Texture::Format::RGB);
	texture.setInternalFormat(Texture::InternalFormat::RGB);

	// empty texture to start
	texture.setData(0);

	// linear filtering
	texture.parameter(Texture::ParamName::MAG_FILTER, Texture::Param::LINEAR);
	texture.parameter(Texture::ParamName::MIN_FILTER, Texture::Param::LINEAR);

	texture.unbind();
}

Texture& GBuffer::getDiffuseTexture()
{
	return _diffuse;
}

Texture& GBuffer::getPositionTexture()
{
	return _pos;
}

Texture& GBuffer::getNormalTexture()
{
	return _normal;
}

Texture& GBuffer::getTexCoordTexture()
{
	return _texCoord;
}

GBuffer::~GBuffer()
{
}

{% endhighlight %}

The magic happens where textures are added to the frame buffer as a render target.

{% highlight c++ %}

...
_fbo.addMRT(...)
...

{% endhighlight %}

SGL makes it easy to added a texture as a render target.

Last, the function bindForWriting() simply binds the frame buffer in draw mode (drawing to the output render targets). And bindForReading simply binds all of the render textures to their corresponding positions.

Thats all the setup complete, lets look at the rendering code.

The first phase is to collect the required geometry data and store in the G-buffer, so we'll have a function to perform the first pass.

{% highlight c++ %}

...

void Example::geometryPass()
{
	//
	glEnable(GL_DEPTH_TEST);

	// bind the gbuffer in draw mode
	_gBuffer.bindForWriting();

	// clear the screen buffer
	Context::clear(Context::BufferBits::COLOR_DEPTH);

	// start the geometry pass shader
	_geometryPass.begin();
	{
		//
		Matrix4 P = _camera.projection();
		Matrix4 V = _camera.view();

		// compute model view projection matrix
		Matrix4 MVP = P * V * _transform;

		// get the normal matrix
		Matrix3 N = _transform.toNormalMatrix();

		// bind the ships texture
		_ship.bind(Texture::Unit::T0);

		// send data to shader uniforms
		_geometryPass["MVP"].set(MVP);
		_geometryPass["M"].set(_transform);
		_geometryPass["N"].set(N);
		_geometryPass["shipTexture"].set(_ship.getTexture());

		// draw the model
		_ship.draw();

		_ship.unbind();
	}
	_geometryPass.end();

	_gBuffer.unbind();
}

{% endhighlight %}

Wait a second?! Where is the code to render to multiple textures?

It's right here:

{% highlight c++ %}

...
// bind the gbuffer in draw mode
_gBuffer.bindForWriting();
...

{% endhighlight %}

Thats it. The only thing left is to make sure that the appropriate data is written to its output in the fragment shader.

{% highlight glsl %}

// geometrypass.vert.glsl

in vec3 vPosition; // input position
in vec3 vNormal;   // input normals
in vec2 vTexCoord; // input tex coords

// to fragment shader
out vec3 fPosition;
out vec3 fNormal;   
out vec2 fTexCoord;

uniform mat4 MVP;
uniform mat4 M;
uniform mat3 N;

void main()
{
	gl_Position = MVP * vec4(vPosition, 1);

	fPosition = (M * vec4(vPosition, 1)).xyz;
	fNormal   = N * vNormal;
	fTexCoord = vTexCoord;
}

{% endhighlight %}

{% highlight glsl %}
// geometrypass.frag.glsl

out vec3 outPosition;
out vec3 outNormal;
out vec3 outTexCoord;
out vec3 outDiffuse;

in vec3 fPosition;
in vec3 fNormal;
in vec2 fTexCoord;

uniform sampler2D shipTexture;

void main()
{
	// store data to their render targets

	// store interpolated positions
	outPosition = fPosition;
	// store interpolated, normalized, normals
	outNormal   = normalize(fNormal);
	// store texture coordinates
	outTexCoord = vec3(fTexCoord, 0);
	// store the diffuse texture color
	outDiffuse  = texture(shipTexture, fTexCoord).xyz;
}

{% endhighlight %}

Our main render function looks like this:

{% highlight c++ %}

void Example::render(float delta)
{
	Context::clear(Context::BufferBits::COLOR_DEPTH);

	_camera.update();

	geometryPass();

}

{% endhighlight %}

{% highlight glsl %}

// remember these guys? They are the outputs we bound to our shader

out vec3 outPosition;
out vec3 outNormal;
out vec3 outTexCoord;
out vec3 outDiffuse;

...
{% endhighlight %}

The next part is really easy. we just render to a full screen quad. We'll will call this the lighting pass (because in this phase we do the light calculations).

{% highlight c++ %}

void Example::lightPass()
{
	_gBuffer.bindForReading();

	glDisable(GL_DEPTH_TEST);

	_lightPass.begin();
	{
		_lightPass["screenSize"].set(Context::getViewPortDimensions());

		_lightPass["positionMap"].set(_gBuffer.getPositionTexture());
		_lightPass["normalMap"].set(_gBuffer.getNormalTexture());
		_lightPass["diffuseMap"].set(_gBuffer.getDiffuseTexture());

		_screenMesh.bind();
		_screenMesh.draw();
		_screenMesh.unbind();
	}
	_lightPass.end();

	glEnable(GL_DEPTH_TEST);
}

{% endhighlight %}

Here we bind the G-buffer in read mode (binding our textures), set the required textures to the light pass shader and then draw a full screen quad to access all the pixels store in the G-buffer's frame buffer.

{% highlight glsl %}

in vec2 vPosition;

void main()
{
	gl_Position = vec4(vPosition, 0, 1);
}

{% endhighlight %}

{% highlight glsl %}


out vec3 fragColor;

uniform vec2 screenSize;

uniform sampler2D positionMap;
uniform sampler2D normalMap;
uniform sampler2D diffuseMap;

vec2 calcTexCoord();

void main()
{
	vec2 texCoord = calcTexCoord();

	vec3 position   = texture(positionMap, texCoord).xyz;
	vec3 normal     = texture(normalMap,   texCoord).xyz;
	vec3 baseColor  = texture(diffuseMap,  texCoord).xyz;

	// ambient light
	vec3 ambientColor = vec3(1,1,1) * 0.3;

	vec3 diffuseColor = vec3(0,0,0);

	float diffuseFactor = dot(normal, -vec3(-1,-1,-1));

	if(diffuseFactor > 0)
	{
		diffuseColor = vec3(1,1,1) * vec3(1,1,1) * 0.8 * diffuseFactor;
	}

	fragColor = baseColor * (ambientColor + diffuseColor);
}

vec2 calcTexCoord()
{
	return gl_FragCoord.xy / screenSize;
}


{% endhighlight %}

In the light pass fragment shader we do a fairly common diffuse light lighting calculation using the provided textures.

Our main render function:

{% highlight c++ %}

void Example::render(float delta)
{
	Context::clear(Context::BufferBits::COLOR_DEPTH);

	_camera.update();

	geometryPass();
	lightPass();

}

{% endhighlight %}

As an aside, lets render all the textures at the sametime to get a idea of whats happening.

{% highlight c++ %}

void Example::renderTextures()
{
	_batch.begin(&_shader2D);
	{
		_batch.draw(_topLeft,     &_gBuffer.getDiffuseTexture());
		_batch.draw(_topRight,    &_gBuffer.getPositionTexture());
		_batch.draw(_bottomLeft,  &_gBuffer.getTexCoordTexture());
		_batch.draw(_bottomRight, &_gBuffer.getNormalTexture());
	}
	_batch.end();
}

void Example::render(float delta)
{
	Context::clear(Context::BufferBits::COLOR_DEPTH);

	_camera.update();

	geometryPass();
//	lightPass();
	renderTextures();
}

{% endhighlight %}

Here's what the different output targets look like:


![Image not found!](/assets/2015/07/08/deferredshading1.png)
