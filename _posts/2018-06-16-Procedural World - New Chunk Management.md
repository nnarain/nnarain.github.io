---
layout: post
title: Procedural World - New Chunk Management
tag: ['pcg', 'unity']
repo: nnarain/World
project_id: world-procgen
---

Recently I improved chunk loading in my procedural world project. To be honest the way I was loading chunks before was rather.. bad. I used a breath-first search to search all the chunk neighbors and spiraled out from the players current position, until the player's view area was filled. So this isn't bad on the initial load. However, what about when the player moves? You could re-run the search everytime the player moved a threshold distance but if the threshold is too small you are wasting cycles finding chunks that are already loaded. You could find a search location some distance ahead of where the player is currently heading, but then you end up with gaps where chunks are missed.

I needed a more precise way of determining which chunks need to be loaded.

**New Method**

The new approach is to keep track of what chunk position the player is currently in. If the player moves to a new chunk. Load the new chunks that have come into view. And unload the chunks that have moved outside of view.

![Image not found!](/assets/2018/06/16/visiblechunks.svg)

Since the chunks have references to their neighbors in each direction, they form a graph structure. I can leverage this to keep track on which chunks need to be loaded and unloaded.

![Image not found!](/assets/2018/06/16/chunkgraph.svg)

On initial load, the top-left and bottom-right chunks are set as the 'head' and the 'tail' of the graph. This is so I can always reference the outer edges of chunks.

![Image not found!](/assets/2018/06/16/newchunkloading2.svg)

The above two diagrams show how chunks are moved into their new positions. The red chunks indicates removal, green addition and yellow is a reference to where the new chunks are linked to. 

Removed chunks are unlinked from the graph, set to inactive and moved to a chunk queue. New chunks are dequeued from the queue and positioned adjacent to the yellow chunks.


Looks like the following.

![Image not found!](/assets/2018/06/16/cap1.gif)

