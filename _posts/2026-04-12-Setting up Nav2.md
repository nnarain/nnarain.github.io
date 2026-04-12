---
layout: post
title: Nav2 Initial Bringup
tag: [ros, robotics, nav2, navigation, gazebo, simulation]
repo: nnarain/genbu_robot
project_id: genbu-robot
---

This post is about the initial bring up of Nav2 on my robot. To be honest this is mostly vibe coded as I just wanted the minimal bringup (this is mostly just nav2 yaml configs). So I'll do a bit more research now that I have the foundation working.


# Nav requirements

1. Odometry
2. Scan data
3. Command velocity topic

These are effectively the 3 things you need to make your robot navigation. You also need a transfrom between `map` to `base_link` frames, though this is handled from `slam_toolbox`.

```yaml
amcl:
  ros__parameters:
    use_sim_time: True
    ...
    base_frame_id: "base_footprint"
    ...
    global_frame_id: "map"
    ...
    odom_frame_id: "odom"
    ...
    robot_model_type: "differential"
    ...
```

Scan data is configured inside the local and global cost map

```yaml
        observation_sources: scan
        scan:
          topic: /scan
          max_obstacle_height: 2.0
          clearing: True
          marking: True
          data_type: "LaserScan"
          raytrace_max_range: 12.0
          raytrace_min_range: 0.0
          obstacle_max_range: 12.0
          obstacle_min_range: 0.0
```

# Bring up Struggles

What I mostly struggled with was actually lingering nodes and gazebo process causing stale data in `/tf`. Once I sorted that out I just can to make sure the velocity topics were mapped into the correct place.


# Results

{% include video.html webm="/assets/2026/04/12/nav.webm" %}
