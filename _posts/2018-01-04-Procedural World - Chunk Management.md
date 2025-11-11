---
layout: post
title: Procedural World - Chunk Management
description: 
tag: ['unity', 'c#', 'pcg']
thumbnail: /assets/2018/01/04/
repo: nnarain/World.git
project_id: world-procgen
---

In this post I will be going over how chunks are managed in my procedural world project.

All chunk management occurs in the `ChunkManager` script. This is probably going to be the most import script in the whole project!

So what does it need to do?

Scope
-----

The chunk manager is responsible for adding, updating and removing all the chunks around the player. Too many chunks and we lose performance, not enough and the world looks choppy and unappealing.

This would involve creating chunk gameobjects if they don't exist, loading chunks, building chunks and destroying chunks when they are no longer needed.

This is independent of the data that is loaded into the chunks or how the chunks are built. That is handled by the currently selected `FieldGenerator` and `MeshExtractor`.

Storing Chunks in Memory
------------------------

An important subject is how chunks are organized and iterated over in memory.

For now I'm going with a simple dictionary. But this could be adapted to a QuadTree or an Octree.

Finding Chunks Around the Player
--------------------------------

Before deciding what to do with chunks we have to find them first.

My first attempt at that was to iterate over a box of chunks with the player at the center.

Something like:

```
for x = playerPosition.x - n; x < playerPosition.x + n; ++x:
    for z = playerPosition.z - n; z < playerPosition.z + n; ++z:
        var chunk = GetChunk(x, z);
```

But this is extremely inflexible.

A much better way is to perform a `breath-first search` on the player's current chunk position that scans outwards into the neighboring chunks.


```c#
    private void UpdateVisibleChunks(Vector3 playerPosition)
    {
        // the player's chunk position
        Vector3Int playerChunkPosition = GetChunkPosition(playerPosition);

        // explored chunks
        HashSet<Vector3Int> explored = new HashSet<Vector3Int>();

        // queue of chunk positions
        Queue<Vector3Int> queue = new Queue<Vector3Int>();

        // load initial chunk positions to check
        queue.Enqueue(playerChunkPosition);
        foreach (var key in GetChunkNeighbors(playerChunkPosition))
        {
            queue.Enqueue(key);
        }

        // loop while items are in the queue
        while (queue.Count > 0)
        {
            // grab first position
            Vector3Int p = queue.Dequeue();

            if (explored.Contains(p)) continue;

            // explore neighbors
            Vector3Int[] neighbors = GetChunkNeighbors(p);

            foreach (var neighbor in neighbors)
            {
                // get the world position of the chunk
                Vector3 chunkPosition = GetChunkWorldCenter(neighbor);

                // check the chunk is in the render distance of the player
                var distanceFromPlayer = (playerPosition - chunkPosition).magnitude;

                if (distanceFromPlayer <= generalRenderDistance)
                {
                    queue.Enqueue(neighbor);
                }
            }

            explored.Add(p);

            // check if the current chunk is in the chunk list
            if (chunkList.ContainsKey(p))
            {
                // the chunk already exists, ensure it is enabled
                var chunk = chunkList[p];
                chunk.gameObject.SetActive(true);
            }
            else
            {
                // the chunk does not exist yet, create it
                var chunk = CreateChunk(p.x, p.z);
                chunkList.Add(p, chunk);
            }
        }
    }
```

I think this is pretty straight forward. One thing to note is the variable `generalRenderDistance`. This is the radius around the player to queue neighbor chunks.

An improvement that can be made to this is loading more chunks that are in the view on the camera. Actually we only really want the chunks in view of the camera and a minial number of chunks behind/outside of view of the player.

So we can add something like:

```c#
 private void UpdateVisibleChunks(Vector3 playerPosition)
    {
        ...
            foreach (var neighbor in neighbors)
            {
                // get the world position of the chunk
                Vector3 chunkPosition = GetChunkWorldCenter(neighbor);

                // check the chunk is in the render distance of the player
                var distanceFromPlayer = (playerPosition - chunkPosition).magnitude;

                if (distanceFromPlayer <= generalRenderDistance)
                {
                    queue.Enqueue(neighbor);
                }
                else if (IsChunkInFrustum(chunkPosition))
                {
                    // check if the chunk is in the camera's view frustum

                    // check if the chunk is in the forward render distance
                    if (distanceFromPlayer <= forwardRenderDistance)
                    {
                        queue.Enqueue(neighbor);
                    }
                }
            }
        ...
    }
```

To check if the chunks is in the camera view frustum we check if the top four corners of the chunk are in the frustum.
To check if the point is in the frustum:

* Convert point to viewport corrdinates 
* Check if the  x and y of the point is in range [0,1]

I use a margin value to apply a buffer for loading chunks on the edge of the view frustum.

```c#
    // ChunkManager.cs
    // check if the corners of the chunk are in the camera frustum
    private bool IsChunkInFrustum(Vector3 chunkCenter)
    {
        float offsetX = (float)chunkPrefab.chunkSizeX / 2.0f;
        float offsetY = (float)chunkPrefab.chunkSizeY / 2.0f;
        float offsetZ = (float)chunkPrefab.chunkSizeZ / 2.0f;

        Vector3[] corners =
        {
            new Vector3(chunkCenter.x - offsetX, chunkCenter.y + offsetY, chunkCenter.z + offsetZ),
            new Vector3(chunkCenter.x + offsetX, chunkCenter.y + offsetY, chunkCenter.z + offsetZ),
            new Vector3(chunkCenter.x - offsetX, chunkCenter.y + offsetY, chunkCenter.z - offsetZ),
            new Vector3(chunkCenter.x + offsetX, chunkCenter.y + offsetY, chunkCenter.z - offsetZ)
        };

        foreach (var corner in corners)
        {
            if (playerCamera.IsPointInFrustum(corner, viewportMargin))
            {
                return true;
            }
        }

        return false;
    }

    // CameraExtension.cs
    public static class CameraExtension
    {
        public static bool IsPointInFrustum(this Camera camera, Vector3 point, float margin = 0.0f)
        {
            float min = 0 - margin;
            float max = 1 + margin;

            Vector3 viewportPoint = camera.WorldToViewportPoint(point);

            return viewportPoint.x >= min && viewportPoint.x <= max && viewportPoint.y >= min && viewportPoint.y <= max && viewportPoint.z > 0;
        }
    }
```


Loading Chunks
--------------

Chunks are loaded using the `ChunkLoader` script. Its purpose is to queue chunks using `ThreadPool`. We queue chunks for loading when they are created.


```c#
    private void UpdateVisibleChunks(Vector3 playerPosition)
    {
        ...
            // check if the current chunk is in the chunk list
            if (chunkList.ContainsKey(p))
            {
                // the chunk already exists, ensure it is enabled
                var chunk = chunkList[p];
                chunk.gameObject.SetActive(true);
            }
            else
            {
                // the chunk does not exist yet, create it
                var chunk = CreateChunk(p.x, p.z);
                chunkList.Add(p, chunk);

                chunkLoader.Load(chunk);
            }
        ...
    }
```


Removing Chunks
---------------

Only the chunks infront and immediately around the player need to be active. We can check the chunks distance to the player and use a few parameters to determine if the chunk should be set inactive or destroyed.


```c#
private void RemoveFarChunks(Vector3 playerPosition)
{
    List<Vector3Int> toRemove = new List<Vector3Int>();

    // iterate over chunks in the dictionary
    foreach (var pair in chunkList)
    {
        var chunk = pair.Value;
        var chunkPosition = GetWorldPositionFromChunkPosition(pair.Key);

        // calculate distance between player and chunk
        var distanceToChunk = (playerPosition - chunkPosition).magnitude;

        // check if the chunk is not in the view frustum
        if (!IsChunkInFrustum(chunkPosition))
        {
            // if the distance is greater than the distance to which the chunk should be inactive, but not removed
            if (distanceToChunk >= distanceToInactive)
            {
                // set the chunk to inactive
                chunk.gameObject.SetActive(false);
            }

            // if the distance is grater tan the distance to which the chunk shoould be destroyed
            if (distanceToChunk >= distanceToDestroy)
            {
                // set the chunk for removal from the list
                toRemove.Add(pair.Key);
                // and destroy the gamebobject
                Destroy(chunk);
            }
        }
    }

    // remove destroyed chunks from the list
    foreach (var key in toRemove)
    {
        chunkList.Remove(key);
    }
}
```

Parameters
----------

![Image not found!](/assets/2018/01/04/chunkmanager.PNG)