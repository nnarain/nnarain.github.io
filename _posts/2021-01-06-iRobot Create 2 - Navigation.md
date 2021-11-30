---
layout: post
title: iRobot Create 2 - Navigation
tag: ['irobot', 'create2', 'ros', 'robotics', 'simulation', 'navigation']
repo: nnarain/create_navigation
---

In my [previous post]({% post_url 2021-01-03-iRobot Create 2 - Simulation %}) I setup the iRobot Create 2's sensors in Gazebo. The following is how I used those sensors with the ROS navigation stack to map and navigate the a maze.

All of the following will be in a new package called: `create_navigation`.

Move Base
---------

My setup for move_base is from the [ROS navigation tutorials](http://wiki.ros.org/navigation/Tutorials/RobotSetup)

In the file `create_navigation/launch/base_navigation.launch` I have:

```xml
<launch>
    <arg name="using_map" default="false" />
    <arg name="global_costmap_frame"
         value="$(eval 'map' if arg('using_map') else 'odom')" />

    <!-- Spawn pointcloud generator node(s) -->
    <include file="$(find create_navigation)/launch/pointcloud.launch" />

    <!-- Move base -->
    <node pkg="move_base" type="move_base" name="move_base">
        <rosparam file="$(find create_navigation)/config/move_base.yaml" command="load" />

        <!-- Global Costmap Config -->
        <rosparam file="$(find create_navigation)/config/global_costmap.yaml"
                  command="load" />
        <rosparam file="$(find create_navigation)/config/costmap_common.yaml"
                  command="load" ns="global_costmap" />
        <rosparam if="$(arg using_map)"
                  file="$(find create_navigation)/config/global_costmap_map.yaml"
                  command="load" ns="global_costmap" />
        <param name="global_costmap/global_frame" value="$(arg global_costmap_frame)" />

        <!-- Local Costmap Config -->
        <rosparam file="$(find create_navigation)/config/local_costmap.yaml"
                  command="load" />
        <rosparam file="$(find create_navigation)/config/costmap_common.yaml"
                  command="load" ns="local_costmap" />

        <!-- Planner Config -->
        <rosparam file="$(find create_navigation)/config/planner.yaml"
                  command="load" />
    </node>
</launch>
```

For now `create_navigation/launch/navigation.launch` has:

```xml
<launch>
    <include file="$(find create_navigation)/launch/base_navigation.launch">
        <arg name="using_map" value="false" />
    </include>
</launch>
```

At this point the robot can be command to drive to positions in `odom` frame using rviz.

I'll touch on mapping in a later section, but the point behind `using_map` and `global_costmap_frame` is to load an additional set of parameters when using/creating a map file.

Point Clouds
------------

The ROS navigation stack can use two types of sensor input to add information to the global and local costmaps: Laser scans and point clouds.

The Create 2 doesn't have a LIDAR but its sensors can be mapped into a point cloud (knowing the sensor's position in the `base_link` frame).

I created a ROS node to consume `create_msgs/Bumper` messages and convert them into a single point cloud message. At this time I have not added `create_msgs/Cliff` to the point cloud.

This node allocates a fixed number of points. The points are set to valid values in the point cloud when the corresponding sensor is detecting an obstacle. They are cleared using an invalid point if the sensor is not detecting an obstacle.

Point cloud publisher setup and point initialization:

```c++
class CreatePointCloud
{
    using PointCloud = pcl::PointCloud<pcl::PointXYZ>;

    // All points that will be added to the point cloud
    enum class PointIndex
    {
        // Contact sensors
        ContactFront, ContactLeft, ContactRight,
        // Light sensors
        LightLeft, LightLeftFront, LightLeftCenter,
        LightRight, LightRightFront, LightRightCenter,
        // An invalid point
        Invalid,
    };

    static constexpr auto INVALID = std::numeric_limits<float>::quiet_NaN();

public:
    CreatePointCloud()
    {
    }

    bool initialize(ros::NodeHandle& nh)
    {
        ros::NodeHandle pnh{"~"};

        std::string frame{"base_link"};
        pnh.getParam("frame", frame);

        // Invalid point will be used to clear the point cloud, so is_dense must be marked false
        cloud_.header.frame_id = frame;
        cloud_.is_dense = false;

        // Points contains one invalid point, therefore cloud points in one less.
        cloud_.resize(points_.size() - 1);

        points_[static_cast<size_t>(PointIndex::Invalid)] = pcl::PointXYZ{INVALID, INVALID, INVALID};

        // Insert defaults points
        insertPoint(PointIndex::ContactFront, PointIndex::Invalid);
        insertPoint(PointIndex::ContactLeft, PointIndex::Invalid);
        insertPoint(PointIndex::ContactRight, PointIndex::Invalid);
        insertPoint(PointIndex::LightLeft, PointIndex::Invalid);
        insertPoint(PointIndex::LightLeftFront, PointIndex::Invalid);
        insertPoint(PointIndex::LightLeftCenter, PointIndex::Invalid);
        insertPoint(PointIndex::LightRight, PointIndex::Invalid);
        insertPoint(PointIndex::LightRightFront, PointIndex::Invalid);
        insertPoint(PointIndex::LightRightCenter, PointIndex::Invalid);

        pc_pub_ = nh.advertise<PointCloud>("bumper/pointcloud", 1);
        pub_timer_ = nh.createTimer(ros::Duration{0.1}, &CreatePointCloud::pubTimerCallback, this);

        return true;
    }

private:
    void pubTimerCallback(const ros::TimerEvent&)
    {
        pcl_conversions::toPCL(ros::Time::now(), cloud_.header.stamp);
        pc_pub_.publish(cloud_);
    }

    void insertPoint(PointIndex idx)
    {
        insertPoint(idx, idx);
    }

    void insertPoint(PointIndex cloud_idx, PointIndex point_idx)
    {
        cloud_[static_cast<size_t>(cloud_idx)] = points_[static_cast<size_t>(point_idx)];
    }

    ros::Publisher pc_pub_;
    ros::Timer pub_timer_;

    // The cloud to populate with sensor data
    // In base_link frame
    PointCloud cloud_;
    // An array of possible points in the point cloud
    // 3 contact position points + 6 light sensor points + 1 invalid
    std::array<pcl::PointXYZ, 3 + 6 + 1> points_;
};
```

Setup publisher/timer for point cloud messages. Set all points in the cloud to invalid.

Now the point cloud must be added to the global and local costmap parameters:

```yaml
#...

obstacles_layer:
  observation_sources: bumper_pointcloud

  bumper_pointcloud:
    sensor_frame: base_link
    data_type: PointCloud2
    topic: /bumper/pointcloud
    marking: true
    clearing: true
    obstacle_range: 2.5
    raytrace_range: 3.0

inflation_layer:
  inflation_radius: 0.15
  cost_scaling_factor: 12
```

**Bump sensors**

The bump sensors can be added to the point cloud by placing a corresponding point on the edge of the robot depending on the state of the contact sensors.

For example: If the left contact sensor is pressed, place a point on the left of the robot. If the right contact sensor is pressed, place a point on the right of the robot. If both are pressed, place a point on the front of the robot.

Since the point cloud is generated in `base_link` frame the bumper positions can be pre-calculated at startup using the radius of the robot.

```c++
class CreatePointCloud
{
public:

    bool initialize(ros::NodeHandle& nh)
    {
        float radius = 0;
        if (!pnh.getParam("radius", radius))
        {
            ROS_ERROR("Point cloud radius not defined!");
            return false;
        }

        float height = 0;
        if (!pnh.getParam("height", height))
        {
            ROS_ERROR("Point clod height not defined!");
            return false;
        }

        // Create the three points used when the bumper detects an obstacle
        points_[static_cast<size_t>(PointIndex::ContactFront)] = getPointOnRadius(radius, 0, height);
        points_[static_cast<size_t>(PointIndex::ContactLeft)] = getPointOnRadius(radius, M_PI / 4.0f, height);
        points_[static_cast<size_t>(PointIndex::ContactRight)] = getPointOnRadius(radius, -M_PI / 4.0f, height);

        points_[static_cast<size_t>(PointIndex::Invalid)] = pcl::PointXYZ{INVALID, INVALID, INVALID};

        return true;
    }

private:
    pcl::PointXYZ getPointOnRadius(float radius, float angle, float height)
    {
        const auto x = radius * cos(angle);
        const auto y = radius * sin(angle);

        return pcl::PointXYZ{x, y, height};
    }
};
```

Basic trig to get a point on the edge of the robot, 45 degrees to the left and right of the X axis (The X axis is always the direction the robot is facing in the base_link frame). Also, set the Z component to the specified height.


The contact position is determined from the `create_msgs/Bumper` message and the corresponding point is placed in the point cloud.


```c++
class CreatePointCloud
{
private:
    // ...

    void bumperCallback(const create_msgs::BumperConstPtr& msg)
    {
        processContactSensors(*msg);
    }

    void processContactSensors(const create_msgs::Bumper& msg)
    {
        const auto bump_state = getBumpState(msg);

        // Set points in the cloud depending on what the bump position is
        // When there is no contact on one of the sensors a point is added at infinity
        switch(bump_state)
        {
        case ContactPosition::Front:
            insertPoint(PointIndex::ContactFront);
            insertPoint(PointIndex::ContactLeft, PointIndex::Invalid);
            insertPoint(PointIndex::ContactRight, PointIndex::Invalid);
            break;
        case ContactPosition::Left:
            insertPoint(PointIndex::ContactLeft);
            insertPoint(PointIndex::ContactFront, PointIndex::Invalid);
            insertPoint(PointIndex::ContactRight, PointIndex::Invalid);
            break;
        case ContactPosition::Right:
            insertPoint(PointIndex::ContactRight);
            insertPoint(PointIndex::ContactFront, PointIndex::Invalid);
            insertPoint(PointIndex::ContactLeft, PointIndex::Invalid);
            break;
        case ContactPosition::None:
            insertPoint(PointIndex::ContactFront, PointIndex::Invalid);
            insertPoint(PointIndex::ContactLeft, PointIndex::Invalid);
            insertPoint(PointIndex::ContactRight, PointIndex::Invalid);
            break;
        }
    }

    ContactPosition getBumpState(const create_msgs::Bumper& msg)
    {
        if (msg.is_left_pressed && msg.is_right_pressed)
        {
            return ContactPosition::Front;
        }
        else if (msg.is_left_pressed)
        {
            return ContactPosition::Left;
        }
        else if (msg.is_right_pressed)
        {
            return ContactPosition::Right;
        }

        return ContactPosition::None;
    }
};
```

Here is how navigating looks with just bump sensors.

![image not found!](/assets/2021/01/06/bump-nav.gif)

First off, the point is projected slightly in front of the robot. This is because I made the `radius` parameter slightly bigger than the robot.

The issue with solely using the bump sensors is that the robot will bump into something and try to push through it as opposed to backing up and re-planning.

**Light Sensors**

When the light sensor value exceeds a detection threshold, a point is placed in front of the robot, projected out from the sensors position.

Calculating sensor positions:

```c++
class CreatePointCloud
{
public:
    bool initialize(ros::NodeHandle& nh)
    {
        // ...

        int detect = 200;
        pnh.getParam("light_detect", detect);
        light_detection_threshold_ = detect;

        // ...

        tf_init_timer_ = nh.createTimer(ros::Duration{0.1}, &CreatePointCloud::tfInitTimerCallback, this, true);

        return true;
    }

private:
    void tfInitTimerCallback(const ros::TimerEvent&)
    {
        ros::NodeHandle pnh{"~"};

        float light_point_range = 0.075f;
        pnh.getParam("light_range", light_point_range);

        points_[static_cast<size_t>(PointIndex::LightLeft)] = getSensorPoint("left_light_sensor_link", light_point_range);
        points_[static_cast<size_t>(PointIndex::LightLeftFront)] = getSensorPoint("left_front_light_sensor_link", light_point_range);
        points_[static_cast<size_t>(PointIndex::LightLeftCenter)] = getSensorPoint("left_center_light_sensor_link", light_point_range);
        points_[static_cast<size_t>(PointIndex::LightRight)] = getSensorPoint("right_light_sensor_link", light_point_range);
        points_[static_cast<size_t>(PointIndex::LightRightFront)] = getSensorPoint("right_front_light_sensor_link", light_point_range);
        points_[static_cast<size_t>(PointIndex::LightRightCenter)] = getSensorPoint("right_center_light_sensor_link", light_point_range);
    }

    pcl::PointXYZ getSensorPoint(const std::string& frame, float distance_offset)
    {
        geometry_msgs::PointStamped sensor_base;
        sensor_base.header.frame_id = frame;
        sensor_base.header.stamp = ros::Time{};
        sensor_base.point.x = distance_offset;
        sensor_base.point.y = 0;
        sensor_base.point.z = 0;

        geometry_msgs::PointStamped sensor_position_base_link;

        try
        {
            listener_.waitForTransform("base_link", frame, ros::Time{}, ros::Duration(10.0));
            listener_.transformPoint("base_link", sensor_base, sensor_position_base_link);
        }
        catch(const std::runtime_error& e)
        {
            ROS_ERROR_STREAM("Error computing light sensor positions: " << e.what());
        }


        pcl::PointXYZ sensor_point;
        sensor_point.x = sensor_position_base_link.point.x;
        sensor_point.y = sensor_position_base_link.point.y;
        sensor_point.z = sensor_position_base_link.point.z;

        return sensor_point;
    }


    // ...
    ros::Timer tf_init_timer_;
    tf::TransformListener listener_;
};
```

Had a minor issue getting the transform immediately at startup so I calculated the sensor points in a callback of a one shot timer.

The `getSensorPoint` function converts a point in sensor frame to the `base_link` frame. In this case, I added an offset on the X axis to shift the point out from the robot. This has to be done since the light sensors are not distance sensors.

These points are added to the points array.

Adding the light sensor data to the point cloud:

```c++
class CreatePointCloud
{
    // ...
private:
    // ...

    void bumperCallback(const create_msgs::BumperConstPtr& msg)
    {
        processContactSensors(*msg);
        processLightSensors(*msg);
    }

    void processLightSensors(const create_msgs::Bumper& msg)
    {
        processLightSensor(PointIndex::LightLeft, msg.light_signal_left);
        processLightSensor(PointIndex::LightLeftFront, msg.light_signal_front_left);
        processLightSensor(PointIndex::LightLeftCenter, msg.light_signal_center_left);
        processLightSensor(PointIndex::LightRight, msg.light_signal_right);
        processLightSensor(PointIndex::LightRightFront, msg.light_signal_front_right);
        processLightSensor(PointIndex::LightRightCenter, msg.light_signal_center_right);
    }

    void processLightSensor(PointIndex idx, uint16_t sensor)
    {
        if (sensor >= light_detection_threshold_)
        {
            insertPoint(idx);
        }
        else
        {
            insertPoint(idx, PointIndex::Invalid);
        }
    }

    // ...
};
```

![image not found!](/assets/2021/01/06/light-nav.gif)


Now the robot is detecting the wall before bumping into it, allowing it to plot a more reasonable course.


Mapping
-------

The ROS tutorials use the `gmapping` node to create a map. However, this node only subscribes to laser scans. I decided to use the [octomap_server](http://wiki.ros.org/octomap_server) package to get the point cloud data into a static map.

I've also defined `nav_mode` to specify whether the robot is navigating using odom, creating a map or using an existing map file.

```xml
<launch>
    <!--
        nav_mode:
            odom    - No map / not mapping
            mapping - Building a map
            map     - Has a map
    -->
    <arg name="nav_mode" default="odom" />
    <arg name="map_file" default="$(optenv MAP_FILE '')" />

    <arg name="using_map" value="$(eval arg('nav_mode') == 'map')" />
    <arg name="using_map_server" value="$(eval arg('nav_mode') != 'odom')" />

    <include file="$(find create_navigation)/launch/base_navigation.launch">
        <arg name="using_map" value="$(arg using_map)" />
    </include>

    <!-- Mapping -->
    <group if="$(arg using_map_server)">
        <arg name="static_map" value="$(eval map_file if nav_mode == 'map' else '')" />
        <node pkg="octomap_server" type="octomap_server_node" name="octomap" args="$(arg static_map)">
            <param name="frame_id" value="map" />
            <param name="base_frame_id" value="base_footprint" />
            <!-- Set to false when building maps -->
            <param name="latch" value="$(eval arg('nav_mode') != 'mapping')" />

            <remap from="cloud_in" to="/bumper/pointcloud" />
            <remap from="projected_map" to="map" />
        </node>
        <!-- Static transform for odom to map frame -->
        <node pkg="tf" type="static_transform_publisher" name="tf_odom_map" args="0 0 0 0 0 0 map odom 100" />
    </group>
</launch>
```

I command the robot to a point outside of the maze forcing it to navigate all the way around.

![image not found!](/assets/2021/01/06/mapping_1.gif)

![image not found!](/assets/2021/01/06/mapping_2.gif)

![image not found!](/assets/2021/01/06/mapping_3.gif)

Not perfect, but the gaps can be filled by manually controlling the robot to those points.

The map can be saved using:

```bash
rosrun octomap_server octomap_saver mapfile.bt
```

Map Navigation
--------------

When using the map I load an additional config file that tells the global costmap to use a static map layer:

```yaml
# Parameters for when the map server is running and supplying a map file
plugins:
  - {name: static_layer, type: "costmap_2d::StaticLayer" }

static_layer:
  map_topic: /map
  subscribe_to_updates: true
```

Also the global costmap frame is now set to `map`.

In the `maze.launch` file, specify the saved map:

```xml
<launch>
    <arg name="map_file" default="$(find create_gazebo)/maps/maze/maze.bt" />

    <arg name="nav" default="true" />
    <arg name="nav_mode" default="odom" />
    <arg name="verbose" default="false" />

    <include file="$(find create_gazebo)/launch/gazebo.launch">
        <arg name="world" value="$(find create_gazebo)/worlds/maze.world" />
        <arg name="nav" value="$(arg nav)" />
        <arg name="nav_mode" value="$(arg nav_mode)" />
        <arg name="map_file" value="$(arg map_file)" />
        <arg name="verbose" value="$(arg verbose)" />
    </include>
</launch>
```

At the command line, use `nav_mode:=map`:

```bash
roslaunch create_gazebo maze.launch nav_mode:=map
```

Speed up 2x:

![image not found!](/assets/2021/01/06/static-map-nav.gif)
