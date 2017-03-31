---
layout: post
title: SGL - Demo
description: Simple textured cube with a FPS counter
tag: ["opengl", "c++", "programming"]
thumbnail: /assets/2015/05/03/crate5.gif
repo_url: https://github.com/nnarain/sgl-wrapper
prev_post:
next_post: 2015-07-08-Deferred Shading with SGL
---

[SGL](https://github.com/nnarain/sgl-wrapper) is a Object Oriented library that I made to teach myself OpenGL.

Recently I made some good progress in its development so I'd like to write up a little example program to show it off.

This example will be how to implement a FPS counter and rendering a textured cube. This is an example just to show what the code looks like, not a formal tutorial, I'll get to that later :p

For this example I will be using Visual Studio with GLFW to create the OpenGL context.

First lets create the OpenGL context and initialize SGL:

{% highlight c++ %}

/**
	main.cpp
*/

#include <SGL/SGL.h>
#include <SGL/Util/SGLCoordinate.h>
#include <SGL/Util/Exception.h>

#include "Example.h"

#include <GLFW/glfw3.h>

#include <iostream>

#define SCREEN_WIDTH  1080
#define SCREEN_HEIGHT 720

int main()
{
	// first initialize glfw
	if(!glfwInit())
	{
		std::cout << "Failed to initialize GLFW" << std::endl;
		return 1;
	}

	glfwWindowHint(GLFW_OPENGL_PROFILE, 0);

	// create the opengl context window
	GLFWwindow* window = glfwCreateWindow(
		SCREEN_WIDTH,
		SCREEN_HEIGHT,
		"SGL Example",
		NULL,
		NULL
	);

	if (!window){
		std::cout << "Could not create opengl window" << std::endl;
		glfwTerminate();
		return 2;
	}

	glfwMakeContextCurrent(window);

	// here we initialize SGL
	// Note that this is done after the context window is created.
	if (!sgl::init())
	{
		std::cout << "Could not init sgl" << std::endl;
		return 1;
	}

	sgl::setWindowDimensions((float)SCREEN_WIDTH, (float)SCREEN_HEIGHT);

	return 0;
}

{% endhighlight %}

First we create the opengl context window then initialize SGL. Initializing SGL initializes GLEW which is what SGL is built on. Also note that GLEW must be include before GLFW.

Next we need to create the a class to house the update and render logic.

Typically I make a class with 3 function:

* init()
* update(float delta)
* render()

init() setup all the required opengl objects, update(float) is where the game logic goes and render() renders everything to the screen.

{% highlight c++ %}

/**
	Example.h
*/

#ifndef EXAMPLE_H
#define EXAMPLE_H

class Example
{
public:
	Example(void);
	~Example(void);

	void init(void);
	void update(float);
	void render(void);

private:
};

#endif

{% endhighlight %}

Before getting to the good stuff lets add this new class to the event loop in main.cpp

{% highlight c++ %}

/**
	main.cpp
*/

...

int main()
{
	...

	Example app;

	double last = glfwGetTime();

	// Main Loop ------------------------------------->
	try
	{
		app.init();

		while(!glfwWindowShouldClose(window))
		{
			glfwPollEvents();

			// calculate time since last frame (delta time)
			double current = glfwGetTime();
			float delta = (float)(current - last);

			last = current;

			// update and render
			app.update(delta);
			app.render();

			glfwSwapBuffers(window);
		}
	}
	catch(sgl::Exception &e)
	{
		std::cout << e.what() << std::endl;
		return 1;
	}

	return 0;
}

{% endhighlight %}

Here we init the example and start the glfw window event loop. Every cycle we calculate the time since the last frame and pass it to the update function of the example. Then we render the the example and swap the front and back buffers to the context window.

Now inorder to render a cube and bind textures we will need a few objects.

* A Camera to view the world.
* A ShaderProgram to render meshes
* Textures to bind images

{% highlight c++ %}

/**
	Example.h
*/

#ifndef EXAMPLE_H
#define EXAMPLE_H

#include <SGL/GL/ShaderProgram.h>
#include <SGL/GL/Texture.h>
#include <SGL/Util/Camera.h>
#include <SGL/Util/ObjModel.h>

#include <SGL/Math/Math.h>

class Example
{
public:
	Example(void);
	~Example(void);

	void init(void);
	void update(float);
	void render(void);

private:
	sgl::Camera        _camera;       // camera for viewing the world
	sgl::ShaderProgram _modelShader;  // shader for rendering the cube
	sgl::ObjModel      _model;        // a wavefront obj model fo a cube
	sgl::Texture       _crateTexture; // a texture of a crate
	sgl::Matrix4       _transform;    // the cubes model matrix
};

#endif

{% endhighlight %}

Lets take a look at the initialization code:

{% highlight c++ %}

/**
	Example.cpp
*/

#include <SGL/Util/Exception.h>
#include <SGL/Util/ObjLoader.h>
#include <SGL/Util/Image.h>

using namespace sgl;

Example::Example() :
	// 45 degress Field of view, and viewport dimensions
	_camera(45, 1080, 720),
	// 2D texture
	_crateTexture(Texture::Target::TEXTURE2D)
{
}

Example::init()
{
	try
	{
		// load the model shader
		_modelShader.loadFromFile(
			"assets/basic.vert.glsl",
			"assets/basic.frag.glsl"
		);

		// bind the attribute names to their locations
		_modelShader.addAttribute("vPosition", 3); // location = 0
		_modelShader.addAttribute("vNormal",   3); // location = 1
		_modelShader.addAttribute("vTexCoord", 2); // location = 2

		// link the shader
		_modelShader.link();

		// make this texture active
		_crateTexture.bind();

		// load this texture with a DDS texture file
		Image::load(_crateTexture, "assets/crate.DDS");

		// set the texture filtering
		_crateTexture.parameter(
			Texture::ParamName::MAG_FILTER,
			Texture::Param::LINEAR
		);
		_crateTexture.parameter(
			Texture::ParamName::MIN_FILTER,
			Texture::Param::LINEAR
		);

		// make this texture inactive
		_crateTexture.unbind();

		// load the cube model
		ObjLoader loader;
		loader.load(_model, "assets/crate.obj");
	}
	catch(Exception &e)
	{
		std::cout << "Failed to init the example" << std::endl;
		throw Exception(e.what());
	}

	// set the camera position and where it's looking
	_camera.setPosition(5,3,5);
	_camera.lookAt(0,0,0);

	// set the model position to the origin
	_transform.toTranslation(0,0,0);
}

{% endhighlight %}

First the ShaderProgram for rendering the cube is loaded from two files. Then it binds the mesh attributes to their locations in the order they appear in the mesh buffer, in this case (position, normal then texture coordinates). Finally the shader program is linked.

Next the crate texture is loaded from a DDS file using the Image class. SGL can load BMP, TGA, PNG and DDS texture files.

Lastly the model is loaded from a wavefront obj file.


Lets take a look at the code to render the cube.

{% highlight c++ %}

/**
	Example.cpp
*/

...

Example::update(float delta)
{
	// rotate the model about the y-axis
	_transform.rotate(0, 20 * delta, 0);
}

Example::render()
{
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

	// recalculate the camera matrices (view and projection matrices)
	_camera.update();

	// render the model
	_modelShader.begin();
	{
		const Matrix4& V = _camera.view();
		const Matrix4& P = _camera.projection();

		_modelShader["M"].set(_transform);
		_modelShader["V"].set(V);
		_modelShader["P"].set(P);

		_crateTexture.bind(Texture::Unit::T0);
		_modelShader["sampler"].set(_crateTexture);

		_model.bind();
		_model.draw();
		_model.unbind();

		_crateTexture.unbind();
	}
	_modelShader.end();
}

{% endhighlight %}

The first thing to do in the render function is clear the screen.

The camera update function will recalculate the view and projection matrices if they were altered (i.e. if the camera has changed position or is set to look somewhere else).

Now to render the model we bind the model shader program.

Next we get the view and projection matrices from the camera and pass them to the shader along with the model transformation matrix.

The crate texture is bound and passed to the sampler in the fragment shader.

Finally the model is bound and drawn.

This is the result:

![image not found!](/assets/2015/05/03/crate3.gif)

Next we want to add the FPS counter. For that we will use SGL's BitmapFont and Text classes.

{% highlight c++ %}

/**
	Example.h
*/

#ifndef EXAMPLE_H
#define EXAMPLE_H

...

#include <SGL/2D/SpriteBatch.h>
#include <SGL/2D/BitmapFont.h>
#include <SGL/2D/Text.h>

class Example
{
	...

private:

	...

	sgl::ShaderProgram _textShader;   // shader for rendering text
	sgl::SpriteBatch   _batch;        // rendering 2D sprites
	sgl::BitmapFont    _font;         // loading bitmap font file
	sgl::Text          _fps;          // FPS counter text
};

#endif

{% endhighlight %}

Inorder the render 2D fonts we will need a sprite batch and another shader.

In Example::init() :

{% highlight c++ %}

/**
	Example.cpp
*/

Example::init()
{
	try
	{
		...

		// load the text shader
		_textShader.loadFromFile(
			"assets/text.vert.glsl",
			"assets/text.frag.glsl"
		);
		_textShader.addAttribute("vPosition", 2);
		_textShader.addAttribute("vTexCoord", 2);
		_textShader.link();

		// load the font file
		// and specify how many rows and columns it has
		_font.init("assets/font2.DDS", 16, 16, false);

		// set the font of the text, its position and size
		_fps.setFont(&_font);
		_fps.setPosition(10, 660);
		_fps.setDimensions(25, 30);

	}
	catch(Exception &e)
	{
		std::cout << "Failed to init the example" << std::endl;
		throw Exception(e.what());
	}

	...
}

{% endhighlight %}

And to render the text:

{% highlight c++ %}

/**
	Example.cpp
*/

void MathTest::update(float delta)
{
	...

	// clear the old text
	_fps.clear();
	// add the new value with a formatted string
	_fps.format("%02.3f", fps);
}

Example::render()
{
	...

	// render the fps counter
	_batch.begin(&_textShader);
	{
		_fps.draw(_batch, true, false);
	}
	_batch.end();
}

{% endhighlight %}

![image not found!](/assets/2015/05/03/crate5.gif)


So that sums up this first little demo of SGL. In the future I will walk through specifics of SGL and the low level functionality.
