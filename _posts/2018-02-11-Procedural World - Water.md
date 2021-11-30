---
layout: post
title: Procedural World - Water
description: 
tag: ['unity', 'pcg', 'shaders']
thumbnail: /assets/2018/02/11/
repo: nnarain/World
---

In this post I'll be going over a simple water material I made for my procedural world project.


Multiple Materials in a Mesh
----------------------------

Water blocks use a different material than the other blocks in the engine for far. It's fairly easy to set this up.

Each mesh in unity can have any number of `submeshes`. The material used for that submesh corresponds to the list of materials specified in the `MeshRenderer` component. So I simple adjusted the mesh generators return an array of MeshData. Different blocks are assigned to different meshes. So far all blocks are added to the "default" submesh with the exception of water which is added to another submesh.

Water Shader
------------

I wrote a really simple water shader to test out having multiple materials in a mesh. 

I used [this tutorial](https://lindseyreidblog.wordpress.com/2017/12/15/simple-water-shader-in-unity/) as a reference.

```
Shader "Custom/Water" {
	Properties {
		// color of the water
		_Color("Color", Color) = (1,1,1,1)
		// color of the edge effect
		_EdgeColor("Edge Color",  Color) = (1,1,1,1)
		// width of the edge
		_DepthFactor("Depth Factor", float) = 1.0
		
		_WaterTexture("Water Texture", 2D) = "white"{}
		_WaveSpeed("Wave Speed", float) = 0.0
		_WaveTexture("Wave Texture", 2D) = "white" {}
	}
	SubShader {
		Tags {
			"Queue" = "Transparent"
			"RenderType" = "Transparent" 
		}
		LOD 100

		CGPROGRAM
		#pragma surface surf Standard fullforwardshadows alpha
		#pragma target 3.0

		#include "UnityCG.cginc"

		struct Input
		{
			float3 worldPos;
			float4 screenPos;
		};


		sampler2D _CameraDepthTexture;
		sampler2D _WaterTexture;
		sampler2D _WaveTexture;

		fixed4 _Color;
		fixed4 _EdgeColor;
		half _DepthFactor;
		half _WaveSpeed;
		half _WaveAmp;

		void surf(Input i, inout SurfaceOutputStandard o) {

			// get depth at screen position
			float4 depthSample = SAMPLE_DEPTH_TEXTURE_PROJ(_CameraDepthTexture, i.screenPos);
			// get the depth [0, 1]
			float depth = LinearEyeDepth(depthSample).r;

			fixed4 foamLine = 1 - saturate(_DepthFactor * (depth - i.screenPos.w));

			// water texture
			float2 texCoord = float2(frac(i.worldPos.x), frac(i.worldPos.z));
            // sample random noise
			float2 waveOffset = tex2D(_WaveTexture, texCoord) * sin(_Time * _WaveSpeed);

            // get color of water from offset
			fixed4 waterColor = tex2D(_WaterTexture, texCoord + waveOffset);

            // foam color
			fixed4 c = _Color + foamLine * _EdgeColor;
			
            // mix colors together
			o.Albedo = c.rgb * waterColor;
			o.Alpha = _Color.a;
			o.Metallic = 0.5;
			o.Smoothness = 0.5;
		}
		ENDCG
	}
}
```

**Important Notes**
- The `Queue` field in `Tags` needs to be set to `Transparent`
- The `alpha` option needs to be specified `#pragma surface surf Standard fullforwardshadows alpha`

![Image not found!](/assets/2018/02/11/cap1.png)


**Issues**

A problem that has come up is that since the water material is transparent you can now see hidden faces of adjacent chunks. See below.

![Image not found!](/assets/2018/02/11/cap2.png)


The best thing to do is to fix the greedy mesher so that it does not create these hidden faces.

