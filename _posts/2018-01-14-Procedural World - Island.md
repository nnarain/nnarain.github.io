---
layout: post
title: Procedural World - Island
description: 
tag: ['unity', 'c#', 'pcg']
thumbnail: /assets/2018/01/14/
repo: nnarain/World.git
---

Humble Beginnings!
------------------

![Image not found!](/assets/2018/01/14/island3.PNG)

In the process of trying to develop a terrain engine in Unity I'm tackling some micro-projects to teach myself more about procedural content generation.

This project is generating a procedural island.

I decided to do this because.. well generating infinite terrain isn't very intuitive at the moment. Mostly refering to biome generation.

So I'm starting smaller. Generating something with smaller scope that is easier to reason and make assumptions about.

Requirements for the Island
---------------------------

As always it is important to have an idea of what needs to be accomplished.

Island attributes
* Finite size
* Surrounded by water
* Beaches / Sand on the coast line
* Inland vegatation
* hills / mountains

Here are the attributes I considered in the rough order I did them in. Details in the following sections.

Generating Landmass
-------------------

Generating the land mask is pretty straight forward to start. Simply use a perlin noise height map!

Now I wanted some more variation on the terrain that was generated and it is really hard to do that using a single noise function.

So I used two: One for general landmass shape and another for mountains and combined them.

```c#
    public Perlin continentNoise;
    public AnimationCurve continentCurve;
    public Perlin mountainNoise;
    public AnimationCurve mountainCurve;
    public float terrainScale;

    public override void Generate(VoxelField field, Vector3 position)
    {
        AnimationCurve continentEval = continentCurve.Copy();
        AnimationCurve mountainEval = mountainCurve.Copy();

        float[,] continentMap = continentNoise.Generate(field.X, field.Z, chunkPosition);
        float[,] mountainMap = mountainNoise.Generate(field.X, field.Z, chunkPosition);

        field.ForEachXZ((x, z) =>
        {
            float continent = continentEval.Evaluate(continentMap[x, z]) * continentWeight;
            float mountain = mountainEval.Evaluate(mountainMap[x, z]) * mountainWeight;

            float height = (continent + mountain) * terrainScale * (field.Y - 1);
            height = Mathf.Clamp(height, 0, field.Y - 1);

            int maxY = Mathf.RoundToInt(height);

            for (int y = 0; y < field.Y; ++y)
            {
                if (y <= seaLevel)
                {
                    field.Set(x, y, z, (byte)VoxelType.Water);
                }
                else if (y <= maxY)
                {
                    field.Set(x, y, z, (byte)VoxelType.Land);
                }
            }

        });
    }
```

Now the thing is this doesn't give you an island! It gives you infinite landmass with a sea level. There isn't anything here fixing the size of the terrain. So the first 3 criteria are not met.

To match the first two criteria we use an `island mask` to get the general shape of the island. The island mask I am using is a radial gradient. The further from the center of the island the lower the height will be.

```c#
    ...
    public AnimationCurve islandMaskCurve;

    public override void Generate(VoxelField field, Vector3 position)
    {
        ...
        AnimationCurve islandMaskEval = islandMaskCurve.Copy();

        field.ForEachXZ((x, z) =>
        {
           
            float islandMask = IslandMask(position.x + x, position.z + z, islandMaskEval);

            float height = (continent + mountain) * terrainScale * islandMask * (field.Y - 1);
            height = Mathf.Clamp(height, 0, field.Y - 1);

            int maxY = Mathf.RoundToInt(height);

            for (int y = 0; y < field.Y; ++y)
            {
                if (y <= seaLevel)
                {
                    field.Set(x, y, z, (byte)VoxelType.Water);
                }
                else if (y <= maxY)
                {
                    field.Set(x, y, z, (byte)VoxelType.Land);
                }
            }

        });
    }


    private float IslandMask(float x, float y, AnimationCurve curve)
    {
        return curve.Evaluate(Mathf.Max(0f, InverseIslandCenter(x, y)));
    }

    private float InverseIslandCenter(float x, float y)
    {
        return 1.0f - PercentOfIslandCenter(x, y);
    }

    private float PercentOfIslandCenter(float x, float y)
    {
        float d = DistanceFromCenter(x, y);
        return d / islandRadius;
    }

    private float DistanceFromCenter(float x, float y)
    {
        return Mathf.Sqrt((x * x) + (y * y));
    }
```

Now I broke this into a few components so they could be used elsewhere.
Also a note on the excess use of `AnimationCurves`. They are not all necessary but are fun to tweak in the Unity editor and see what happens.

And we get:
![Image not found!](/assets/2018/01/14/island4.PNG)

Now to generate the sandy coast lines we just set the blocks to sand that are a certain height above sea level. This works because of the island mask!

Generating Biomes
-----------------

I attempted some basic biomes using a combination of temperature and moisture. 

Where moisture is determined by distance from the coast and slightly distorted by noise.

And the temperature is proportional to the elevation.

 ```c#
     public override void Generate(VoxelField field, Vector3 position)
    {
        ...
        float[,] moistureMap = moistureNoise.Generate(field.X, field.Z, chunkPosition);

        field.ForEachXZ((x, z) =>
        {
            float blockX = position.x + x;
            float blockZ = position.z + z;
            
            ...

            float temperature = temperatureEval.Evaluate(height / (float)(field.Y - 1));
            float moisture = (moistureMap[x, z] * moistureMapWeight) + (PercentOfIslandCenter(blockX, blockZ) * (1.0f - moistureMapWeight));

            for (int y = 0; y < field.Y; ++y)
            {
                if (y <= seaLevel)
                {
                    field.Set(x, y, z, (byte)VoxelType.Water);
                }
                else if (y <= maxY)
                {
                    field.Set(x, y, z, (byte)Biome(height, temperature, moisture, field.Y - 1));
                }
            }

        });
    }

    private VoxelType Biome(float e, float t, float m, float maxE)
    {
        // mountains and snow caps
        if (e >= 0.50 * maxE)
        {
            if (e >= 0.75 * maxE)
            {
                return VoxelType.Snow;
            }
            else
            {
                return VoxelType.Stone;
            }
        }
        else
        {
            // sand/beaches
            if (e <= seaLevel + 3)
            {
                return VoxelType.Sand;
            }
            else
            {
                // in land biomes
                if (t >= 0.7)
                {
                    if (m >= 0.25)
                    {
                        if (m <= 0.55)
                        {
                            return VoxelType.GrassLand;
                        }
                        else
                        {
                            return VoxelType.RainForest;
                        }
                    }
                    else
                    {
                        return VoxelType.Scorched;
                    }
                }
            }
        }

        return VoxelType.Land;
    }
 ```

![Image not found!](/assets/2018/01/14/island6.PNG)

Generation in Action
--------------------

![Image not found!](/assets/2018/01/14/gen1.gif)

Neat!

I'm definitively going to improve on this.