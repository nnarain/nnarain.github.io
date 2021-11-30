---
layout: post
title: Procedural World - Player Controller
description: 
tag: ['unity', 'c#', 'pcg']
thumbnail: /assets/2018/01/17/
repo: nnarain/World.git
---

Collision
---------

Before movement and placing blocks can be done the terrain needs to be represented by a collision mesh.

Luckily this is made really easy using a `MeshCollider` in Unity. The generated mesh is used as the collision mesh, with no modification, for now.

Basic Movement
--------------

Basic movement is achieved using the `RigidbodyFirstPersonController` script from Unity standard assets.

Now I might decide to write my own player controller for the experience. Also the standard assets controller will eventually need to be modified for additional gameplay and debugging machanics (like a flying mode, etc) but for now it fits my needs.

Here's what walking around the procedural island looks like!

![Image not found!](/assets/2018/01/17/exploring.gif)

Place and Remove Blocks
-----------------------

There's two steps to selecting blocks. Getting the world space position of the block and then determining the corresponding chunk and block index.

To get the world space position, perform a Raycast to determine which point on the mesh is being clicked by the player.

```c#
// Perform a raycast and call a callback function if it hits a mesh
private void PerformRaycast(Action<Ray, RaycastHit> action)
{
    Ray inputRay = Camera.main.ScreenPointToRay(Input.mousePosition);
    RaycastHit hit;

    if (Physics.Raycast(inputRay, out hit))
    {
        action(inputRay, hit);
    }
}
```

But there is a slight problem with this. The `hit.point` of the raycast will alway be on the surface of the block never inside it. 
This makes it ambiguous as to which block is selected.

![Image not found!](/assets/2018/01/17/raycast1.png)

Is it the block to the left or right?

The solution to this is simple. The `RaycastHit` object provides the normal to the surface that it collided with. So to get the adjacent block add `hit.normal * HALF_BLOCK_WIDTH` to the `hit.point`. Subtract for the center of the current block. 

```c#
private Vector3 RaycastHitToAdjacentBlockWorldPosition(RaycastHit hit)
{
    // Take the hit point and add the normal vector of the surface scale to a half block width
    return hit.point + (hit.normal * HALF_BLOCK_WIDTH);
}

private Vector3 RaycastHitToBlockWorldPosition(RaycastHit hit)
{
    return hit.point - (hit.normal * HALF_BLOCK_WIDTH);
}
```

Note: This doesn't actually give the center of the block. But that doesn't matter. It just needs to be a non-ambiguous point.

Next step is to calculate the corresponding chunk and block index.

in the `ChunkManager` script.

```c#
// ChunkManager.cs
public Vector3Int GetChunkPosition(Vector3 position)
{
    Vector3Int chunkPosition = new Vector3Int();

    chunkPosition.x = ((int)position.x / chunkPrefab.chunkSizeX) - ((position.x < 0) ? 1 : 0);
    chunkPosition.y = ((int)position.y / chunkPrefab.chunkSizeY) - ((position.y < 0) ? 1 : 0);
    chunkPosition.z = ((int)position.z / chunkPrefab.chunkSizeZ) - ((position.z < 0) ? 1 : 0);

    return chunkPosition;
}
```

In the `PickAndRemove` script.

```c#
private Vector3Int BlockPosition(Vector3 position)
{
    int px = (int)Mathf.Abs(position.x) % chunkSizeX;
    int py = (int)Mathf.Abs(position.y) % chunkSizeY;
    int pz = (int)Mathf.Abs(position.z) % chunkSizeZ;


    int x = (position.x >= 0) ? px : chunkSizeX - (px + 1);
    int y = (position.y >= 0) ? py : chunkSizeY - (py + 1);
    int z = (position.z >= 0) ? pz : chunkSizeZ - (pz + 1);

    return new Vector3Int(x, y, z);
}
```

To use:

```c#
private void PlaceBlock()
{
    PerformRaycast((ray, hit) => {
        SetBlockType(RaycastHitToAdjacentBlockWorldPosition(hit), 1);
    });
}


private void RemoveBlock()
{
    PerformRaycast((ray, hit) => {
        SetBlockType(RaycastHitToBlockWorldPosition(hit), 0);
    });
}

private void SetBlockType(Vector3 position, byte type)
{
    Chunk chunk = chunkManager.GetChunkFromWorldPosition(position);

    if (chunk != null)
    {
        var bp = BlockPosition(position);

        chunk.Field.Set(bp.x, bp.y, bp.z, type);
        chunkManager.UpdateChunk(chunk);
    }
}
```

**In action**

![Image not found!](/assets/2018/01/17/placeandremove.gif)

Some things that need to be done:
* selecting what blocks to place
* highlighting the block the cursor is over
