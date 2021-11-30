---
layout: post
title: Intro to my Voxel Engine
description: Introduction to my cubic voxel renderer
tag: ["opengl", "c++", "lua"]
thumbnail: /assets/2015/06/26/voxelterrain.png
repo: nnarain/VoxelEngine/tree/develop
prev_post:
next_post: 2015-07-23-Voxel Lighting!
---

I don't really have a name for this project, so I have just been calling it "Voxel Engine" ...

What is it? An application that renders cubic voxel, creates terrain through procedural generation and is controlled through Lua scripting. Well that's the goal :P

Project repo is located [here](https://github.com/nnarain/VoxelEngine/tree/develop)

Voxel Engine is made using my opengl library [SGL](https://github.com/nnarain/sgl-wrapper)


Here's what it can do so far:

![image not found!](/assets/2015/06/26/voxelterrain.png)

With a little shading:

![image not found!](/assets/2015/06/26/voxelterrain2.png)

So not super impressive visually, though I think it's pretty neat!

I'm still working on the under the hood stuff (mainly chunk managment).

And the script that generates the world:

{% highlight c++ %}

-- main.lua

-- Voxel Engine Script
-- @author Natesh Narain

package.path = '?.lua;' .. package.path

require("player")

-- -------------------------------------------------------------------------
-- Main
-- -------------------------------------------------------------------------
function main()
	--
	engine = Engine.getEngine()

	-- get the camera
	camera = engine:getCamera()

	-- create the opengl window and initial context
	engine:createWindow("Voxel Engine Test", 1080, 720)

	-- register the window for UI callbacks
	window = engine:getWindow()
	registerUICallbacks(window)

	-- load assets
	engine:loadAtlas("assets/atlas.png")

	-- create a chunk manager for the terrain
	local terrain = ChunkManager(32, 32, 32, 16, 1, "atlas")
	generateTerrain(terrain, 7)

	-- add the chunk managers to the engine
	engine:addManager(terrain)

	-- create a timer to get the delta frame time
	timer = Timer()

	-- create the player
	player = Player(camera)

	-- Window Event Loop: loop while window hasn't been signaled to close
	while not window:shouldClose() do
		-- poll user events
		window:pollEvents()

		-- get the delta time
		delta = timer:getElapsed()

		-- update game logic
		update(delta)

		-- render
		engine:render()

		--
		window:swapBuffers()
	end
end

function update(delta)
	engine:updateCameraView(delta)
	updatePlayer(delta)
end

-- update the cameras movement on the xz plane
function updatePlayer(delta)

	-- update forward \ backward movement
	if window:isKeyPressed(Window.Key.W) then
		player:advanceForward(delta)
	elseif window:isKeyPressed(Window.Key.S) then
		player:advanceForward(-delta)
	end

	-- update right \ left movement
	if window:isKeyPressed(Window.Key.A) then
		player:advanceRight(-delta)
	elseif window:isKeyPressed(Window.Key.D) then
		player:advanceRight(delta)
	end

end

-- use a height map generating using a Noise class the create the terrain
function generateTerrain(terrain, octaves)

	local x = terrain:getBlockX()
	local z = terrain:getBlockZ()

	local heightMap = Noise(x, z)
	heightMap:generate(octaves)

	for i = 0,x-1 do
		for k = 0,z-1 do
			local h = math.floor(heightMap:at(i, k) * 20)

			for j = 0,h do
				if j == h then
					terrain:setBlock(i, j, k, 2)
				elseif j == h-1 then
					terrain:setBlock(i, j, k, 4)
				else
					terrain:setBlock(i, j, k, 3)
				end
			end

		end
	end
end

function onKeyEvent(keycode)

end

function onMouseMove(x, y)

end


-- run main
main()

{% endhighlight %}

{% highlight lua %}

-- Player.lua


Player = {}
Player.__index = Player

setmetatable(Player, {
	__call = function(cls, ...)
		local self = setmetatable({}, Player)
		self:_init(...)
		return self
	end
})

function Player:_init(camera)
	self.camera = camera
	self.speed = 20
end

function Player:advanceForward(delta)
	self.camera.position = self.camera.position + (self.camera.direction * self.speed * delta)
end

function Player:advanceRight(delta)
	self.camera.position = self.camera.position + (self.camera.right * self.speed * delta)
end


{% endhighlight %}

The idea here is that a chunk manager is a grid of blocks that the user has control over, to make a height map terrain for example. Eventually there will be multiple chunk managers interacting together. So one manager can be terrain and another can be a building or a character.


**TODO**

* explore an octree implementation that can speed up chunk culling
* implement voxel lighting
* get blocks selected by the user
