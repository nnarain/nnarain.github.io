---
layout: post
title: iRobot Create 2 - Simulation
tag: ['irobot', 'create2', 'ros', 'robotics', 'simulation']
repo: nnarain/create_simulator
---

In my [previous post]({% post_url 2020-12-27-ROS Development Environment on Windows 10 using Docker %}) I mentioned that I was starting to experiment with an iRobot Create 2. With the development environment setup the next step is setting up Gazebo simulations.

There wasn't much available upstream for setting up simulation, so I did most of it myself poking around Github for any examples I could find. All of the robot's sensors needed to be modeled and publishing appropriate `create_msgs` messages.

All of the following will be in a catkin package called `create_gazebo`.

Spawning
--------

First setup launch files to spawn the create robot in an empty world. This will using Gazebo's pre-installed `empty.world` file.

```xml
<!-- gazebo.launch -->
<?xml version="1.0"?>
<launch>
  <arg name="use_sim_time" default="true" />
  <arg name="gui" default="true" />
  <arg name="headless" default="false" />
  <arg name="world" default="worlds/empty.world" />
  <arg name="verbose" default="false" />

  <include file="$(find gazebo_ros)/launch/empty_world.launch">
    <arg name="gui" value="$(arg gui)" />
    <arg name="use_sim_time" value="$(arg use_sim_time)" />
    <arg name="headless" value="$(arg headless)" />
    <arg name="world_name" value="$(arg world)" />
    <arg name="debug" value="0" />
    <arg name="verbose" value="$(arg verbose)" />
  </include>

  <include file="$(find create_gazebo)/launch/spawn_create_2.launch"/>
</launch>
```

At the bottom, another launch file is included to spawn the robot.

```xml
<!-- spawn_create_2.launch -->
<?xml version="1.0"?>
<launch>
  <!-- Setup robot description and spawn into Gazebo sim -->
  <include file="$(find create_description)/launch/create_2.launch" />
  <node name="spawn_create2" pkg="gazebo_ros" type="spawn_model" args="-param robot_description -urdf -model robot" />
</launch>
```

The `create_description` package is provided by upstream with the necessary URDF files. We'll come back to those files later when adding the sensors. My fork of the upstream packages is [here](https://github.com/nnarain/create_robot).

That is all that is needed to spawn the robot in Gazebo, and the robot can be commanded velocities as is (since the diff drive plugins are loaded by the URDF file already). Navigation and move_base setup will come in a following post.

Sensors
-------

Now that the robot in spawned in a simulated world, it needs to interact with its environment.

The iRobot Create 2 has the following sensors along the bumper that can be used to sense the environment:

* Left and Right bump sensors
* Four cliff sensors (left, front left, front right, right)
* Six light sensors (left, front left, center left, center right, front right, right)

The general approach I took to sensor plugins was that there would be one sensor plugin allocated per sensor, which publishes some representation of the sensor data, and a model plugin that consumes the simulated sensor data and publishes the `create_msgs` messages.

```
simulated world -> sensor plugins -> simulated sensor data -> model plugin -> create_msgs
```

**Building and Installing Plugins**

Package XML dependencies and export tags:

```xml
  ...
  <depend>create_msgs</depend>
  <depend>create_navigation</depend>
  <depend>gazebo_msgs</depend>
  <depend>gazebo_ros</depend>
  <depend>gazebo_plugins</depend>
  <depend>nav_msgs</depend>
  <depend>roscpp</depend>
  <depend>std_msgs</depend>
  <depend>tf</depend>

  <exec_depend>create_description</exec_depend>

  <export>
    <gazebo_ros plugin_path="${prefix}/lib"/>
  </export>
  ...
```

```cmake
cmake_minimum_required(VERSION 3.0.2)
project(create_gazebo)

add_compile_options(-std=c++17 -Wall -Wextra)

find_package(catkin REQUIRED COMPONENTS
    create_msgs
    gazebo_msgs
    gazebo_plugins
    gazebo_ros
    nav_msgs
    roscpp
    std_msgs
    tf
)

find_package(gazebo REQUIRED)

catkin_package(
    CATKIN_DEPENDS
        create_msgs
        gazebo_msgs
        gazebo_plugins
        gazebo_ros
        nav_msgs
        roscpp
        std_msgs
        tf
    LIBRARIES
        create_bumper_model_plugin
        create_cliff_sensor_plugin
)

#-----------------------------------------------------------------------------------------------------------------------
# Gazebo plugins
#-----------------------------------------------------------------------------------------------------------------------
link_directories(${GAZEBO_LIBRARY_DIRS})

# Bumper plugin
add_library(create_bumper_model_plugin
    src/plugins/bumper_model_plugin.cpp
)
target_include_directories(create_bumper_model_plugin
    PUBLIC
        include/
        ${catkin_INCLUDE_DIRS}
        ${GAZEBO_INCLUDE_DIRS}
)
target_link_libraries(create_bumper_model_plugin
    ${catkin_LIBRARIES} ${GAZEBO_LIBRARIES} RayPlugin
)
add_dependencies(create_bumper_model_plugin ${catkin_EXPORTED_TARGETS})

# Cliff sensor plugin
add_library(create_cliff_sensor_plugin
    src/plugins/cliff_sensor_plugin.cpp
)
target_include_directories(create_cliff_sensor_plugin
    PUBLIC
        include/
        ${catkin_INCLUDE_DIRS}
        ${GAZEBO_INCLUDE_DIRS}
)
target_link_libraries(create_cliff_sensor_plugin
    ${catkin_LIBRARIES} ${GAZEBO_LIBRARIES} RayPlugin
)
add_dependencies(create_cliff_sensor_plugin ${catkin_EXPORTED_TARGETS})

# Cliff Model Plugin
add_library(create_cliff_model_plugin
    src/plugins/cliff_model_plugin.cpp
)
target_include_directories(create_cliff_model_plugin
    PUBLIC
        include/
        ${catkin_INCLUDE_DIRS}
        ${GAZEBO_INCLUDE_DIRS}
)
target_link_libraries(create_cliff_model_plugin
    ${catkin_LIBRARIES} ${GAZEBO_LIBRARIES}
)
add_dependencies(create_cliff_model_plugin ${catkin_EXPORTED_TARGETS})

# Light sensor plugin
add_library(create_light_sensor_plugin
    src/plugins/light_sensor_plugin.cpp
)
target_include_directories(create_light_sensor_plugin
    PUBLIC
        include/
        ${catkin_INCLUDE_DIRS}
        ${GAZEBO_INCLUDE_DIRS}
)
target_link_libraries(create_light_sensor_plugin
    ${catkin_LIBRARIES} ${GAZEBO_LIBRARIES} RayPlugin
)
add_dependencies(create_light_sensor_plugin ${catkin_EXPORTED_TARGETS})

#-----------------------------------------------------------------------------------------------------------------------
# Installs
#-----------------------------------------------------------------------------------------------------------------------
install(
    TARGETS
        create_bumper_model_plugin
        create_cliff_sensor_plugin
        create_cliff_model_plugin
        create_light_sensor_plugin
    DESTINATION         ${CATKIN_PACKAGE_BIN_DESTINATION}
    LIBRARY DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
)

install(
    DIRECTORY launch
    DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}
)
```

**Bump / Contact Sensors**

Gazebo already has a plugin for bump detection, which derives from a contact sensor. It publishes a `gazebo_msgs/ContactsState` message.

The URDF file gives the `base_link` a collision cylinder. I attached the bump detector to the `base_link` collision object since that will allow detecting collisions anywhere on the robot's body.

For reference here is what the `base_link` looks like:

```xml
<link name="base_link">
  <inertial>
    <mass value="2" />
    <origin xyz="0 0 0.0" />
    <inertia ixx="0.01" ixy="0.0" ixz="0.0" iyy="0.01" iyz="0.0" izz="0.5" />
  </inertial>

  <visual>
    <origin xyz=" 0 0 0.0308" rpy="0 0 0" />
    <geometry>
      <xacro:insert_block name="mesh" />
    </geometry>
  </visual>

  <collision>
    <origin xyz="0.0 0.0 0.0308" rpy="0 0 0" />
    <geometry>
      <cylinder length="0.0611632" radius="0.16495" />
    </geometry>
  </collision>
</link>
```

In `create_base_gazebo.urdf.xacro` I added a new macro to setup bump detection.

```xml
<xacro:macro name="sim_create_bump_sensor">
  <gazebo reference="base_link">
    <sensor name="bumper" type="contact">
      <always_on>true</always_on>
      <update_rate>20.0</update_rate>
      <pose>0 0 0 0 0 0</pose>
      <visualize>false</visualize>
      <contact>
        <collision>base_footprint_fixed_joint_lump__base_link_collision_1</collision>
      </contact>
      <plugin name="gazebo_ros_bumper_controller" filename="libgazebo_ros_bumper.so">
        <bumperTopicName>/sim/bumper</bumperTopicName>
      </plugin>
    </sensor>
  </gazebo>
</xacro:macro>
```

* Reference the `base_link` link
* Sensor type is a contact sensor (name doesn't really matter here)
* Reference the collision object, `base_footprint_fixed_joint_lump__base_link_collision_1`, from `base_link` (more on this in a second)
* Load the `libgazebo_ros_bumper.so` plugin from gazebo
* Set the topic name to `/sim/bumper` (I put all simulated data under the /sim namespace)

Regarding the collision object name:

I found out that when the URDF file is converted to a SDF file, a collision name is generated and referenced by the sensor plugin. I wasn't sure how to get it to use its assigned name explicitly. So the way to get the generated name is to convert the URDF file to SDF and inspect the contents.

```bash
xacro ./src/create_robot/create_description/urdf/create_2.urdf.xacro > test.urdf
gz sdf -p test.urdf > test.sdf
```

Not ideal but that's what works.

Now the Gazebo contact state must be converted to a `create_msgs/Bumper` message type. This will be done using a model plugin.

This plugin must subscribe to the contact state message from Gazebo, only consider collisions on the front half of the robot, determine if the bump is on the left or right sensor and finally publish the `create_msgs/Bumper` message.

```c++
namespace gazebo
{
/**
 * Model plugin that consolidates bumper sensor states into a single create_msgs/Bumper message
*/
class CreateBumperModelRos : public ModelPlugin
{
public:
    CreateBumperModelRos();
    ~CreateBumperModelRos() = default;

    void Load(physics::ModelPtr parent, sdf::ElementPtr sdf);

private:
    /**
     * Contact sensor callback
    */
    void sensorCallback(const gazebo_msgs::ContactsStateConstPtr& msg);

    /**
     * Odom callback
    */
    void odomCallback(const nav_msgs::OdometryConstPtr& msg);

    /**
     * Light sensor callback
    */
    void lightSensorCallback(const std_msgs::UInt16ConstPtr& msg, uint16_t& field);

    /**
     * Update bumper publisher
    */
    void bumperPubTimerCallback(const ros::TimerEvent&);

    // Bumper message, publisher and timer
    ros::Publisher bumper_pub_;
    create_msgs::Bumper bumper_msg_;
    ros::Timer bumper_pub_timer_;
    // Subscriber for contact states
    ros::Subscriber contact_sub_;
    // Odom to get robot heading
    ros::Subscriber odom_sub_;

    // Contact parameters
    double front_contact_threshold_;

    // Robot heading
    tf::Vector3 heading_;
};
}
```

```c++
#include "create_gazebo/plugins/bumper_model_plugin.hpp"

#include "tf/tf.h"

namespace gazebo
{
// Register the plugin with Gazebo
GZ_REGISTER_MODEL_PLUGIN(CreateBumperModelRos)

CreateBumperModelRos::CreateBumperModelRos()
    : front_contact_threshold_{10.0} // Threshold for what is considered a bump at the front of the robot
    , heading_{1, 0, 0}              // The robot's current heading
{
}

void CreateBumperModelRos::Load(physics::ModelPtr, sdf::ElementPtr sdf)
{
    // Initialize ROS
    if (!ros::isInitialized())
    {
        int argc = 0;
        char** argv = nullptr;

        ros::init(argc, argv, "create_bumper_model_plugin");
    }

    // Load parameters
    double updateRate = 10.0;
    if (sdf->HasElement("updateRate"))
    {
        updateRate = sdf->Get<double>("updateRate");
    }

    std::string topic_name{"/bumper"};
    if (sdf->HasElement("topicName"))
    {
        topic_name = sdf->Get<std::string>("topicName");
    }

    std::string odom_topic{"/odom"};
    if (sdf->HasElement("odomTopic"))
    {
        odom_topic = sdf->Get<std::string>("odomTopic");
    }

    if (sdf->HasElement("frontContactThreshold"))
    {
        front_contact_threshold_ = sdf->Get<double>("frontContactThreshold");
    }

    // Setup publishers
    ros::NodeHandle nh;

    // The publisher for the bumper state
    bumper_pub_ = nh.advertise<create_msgs::Bumper>(topic_name, 1);
    // Timer that publishes the bumper message at {updateRate}
    bumper_pub_timer_ = nh.createTimer(ros::Duration{1.0 / updateRate}, 
                                       &CreateBumperModelRos::bumperPubTimerCallback, this);

    // Subscribe to the gazebo contact state message
    contact_sub_ = nh.subscribe("sim/bumper", 10, &CreateBumperModelRos::sensorCallback, this);

    // Odometry callback for getting the heading of the robot
    odom_sub_ = nh.subscribe(odom_topic, 10, &CreateBumperModelRos::odomCallback, this);
}

void CreateBumperModelRos::sensorCallback(const gazebo_msgs::ContactsStateConstPtr& msg)
{
    bumper_msg_.is_left_pressed = false;
    bumper_msg_.is_right_pressed = false;

    for (const auto& state : msg->states)
    {
        for (const auto& normal : state.contact_normals)
        {
            tf::Vector3 n;
            tf::vector3MsgToTF(normal, n);

            // Contact points are on a cylindrical collision body.
            // Therefore, the contact normals are all pointed inwards to the robot's center (base_link origin)

            // Invert the normal (point outwards from origin)
            n *= -1.0;

            tf::Vector3 x{1.0, 0.0, 0.0};
            // Check if the contact comes from the front of the robot
            if (heading_.dot(n) >= 0.0)
            {
                if (x.angle(n) <= tfRadians(front_contact_threshold_))
                {
                    bumper_msg_.is_left_pressed = true;
                    bumper_msg_.is_right_pressed = true;
                }
                else if (n.y() > 0.0)
                {
                    // left
                    bumper_msg_.is_left_pressed = true;
                    bumper_msg_.is_right_pressed = false;
                }
                else
                {
                    // right
                    bumper_msg_.is_left_pressed = false;
                    bumper_msg_.is_right_pressed = true;
                }
            }
        }
    }
}

void CreateBumperModelRos::odomCallback(const nav_msgs::OdometryConstPtr& msg)
{
    // Convert the orientation from odom into a tf type
    tf::Quaternion r{};
    tf::quaternionMsgToTF(msg->pose.pose.orientation, r);

    // Calculate the heading by rotating a X direction vector by the given quaternion
    const tf::Vector3 d{1, 0, 0};
    heading_ = tf::quatRotate(r, d);
}

void CreateBumperModelRos::bumperPubTimerCallback(const ros::TimerEvent&)
{
    // Update the bumper message
    bumper_pub_.publish(bumper_msg_);
}

}
```

Adding the model plugin to the URDF:

```xml
<gazebo>
  <plugin name="create_bumper_model_plugin" filename="libcreate_bumper_model_plugin.so">
    <updateRate>10.0</updateRate>
  </plugin>
</gazebo>
```

**Cliff Sensors**

Gazebo does not have a built in cliff sensor. So I created one based off a ray sensor and attached it to the existing cliff sensor links in the URDF.

```c++
namespace gazebo
{
/**
 * iRobot Create Cliff Sensor Plugin
*/
class CreateCliffRos : public RayPlugin
{
public:
    CreateCliffRos();
    ~CreateCliffRos() = default;

    /**
     * Load plugin
    */
    void Load(sensors::SensorPtr parent, sdf::ElementPtr sdf);

private:
    /**
     * Topic connect callback
    */
    void onConnect();
    /**
     * Topic disconnect callback
    */
    void onDisconnect();
    /**
     * Ray scan callback
    */
    void onScan(const ConstLaserScanStampedPtr& msg);

    // Parent sensor
    sensors::RaySensorPtr parent_;

    // Plugin parameters
    float min_range_;

    // ROS publisher
    PubMultiQueue pmq_;
    PubQueue<std_msgs::Bool>::Ptr pub_queue_;
    ros::Publisher pub_;

    // Gazebo subscriber
    transport::NodePtr node_;
    transport::SubscriberPtr scan_sub_;
};
}
```

```c++
#include "create_gazebo/plugins/cliff_sensor_plugin.hpp"

#include <gazebo_plugins/gazebo_ros_utils.h>


namespace gazebo
{
    GZ_REGISTER_SENSOR_PLUGIN(CreateCliffRos)

    CreateCliffRos::CreateCliffRos()
    {
    }

    void CreateCliffRos::Load(sensors::SensorPtr parent, sdf::ElementPtr sdf)
    {
        // Load the base plugin
        RayPlugin::Load(parent, sdf);

        parent_ = std::dynamic_pointer_cast<sensors::RaySensor>(parent);

        if (!parent_)
        {
            gzthrow("Parent sensor must be a Ray sensor");
        }

        // Load plugin parameters
        if (!sdf->HasElement("cliffRange"))
        {
            ROS_INFO_NAMED("cliff", "Cliff plugin missin parameter 'cliffRange', defaulting to 5cm");
            min_range_ = 0.05;
        }
        else
        {
            min_range_ = sdf->Get<double>("cliffRange");
        }

        std::string topic_name = "/cliff";
        if (sdf->HasElement("topicName"))
        {
            topic_name = sdf->Get<std::string>("topicName");
        }

        // Ensure ROS is up
        if (!ros::isInitialized())
        {
            ROS_FATAL_STREAM_NAMED("cliff", "ROS is not initialized, cannot load plugin");
            return;
        }

        // Get the world name and robot namespace
        // These will be used to subscribe to Gazebo laser scan messages (not ROS).
        const auto world_name = parent_->WorldName();
        const auto robot_namespace = GetRobotNamespace(parent_, sdf, "Cliff");

        // Gazebo node is used to subscribe to gazebo laser scan messages
        node_ = transport::NodePtr{new transport::Node{}};
        node_->Init(world_name);

        pmq_.startServiceThread();

        ros::NodeHandle nh{robot_namespace};

        ros::AdvertiseOptions opts = ros::AdvertiseOptions::create<std_msgs::Bool>(
            topic_name, 1,
            std::bind(&CreateCliffRos::onConnect, this),
            std::bind(&CreateCliffRos::onDisconnect, this),
            ros::VoidPtr{}, nullptr
        );

        pub_ = nh.advertise(opts);
        pub_queue_ = pmq_.addPub<std_msgs::Bool>();

        parent_->SetActive(false);

        ROS_INFO_STREAM_NAMED("cliff", "Starting cliff plugin: " << robot_namespace);
    }

    void CreateCliffRos::onConnect()
    {
        if (!scan_sub_)
        {
            // Only process scans in a subscriber is connected
            ROS_INFO_STREAM_NAMED("cliff", "Subscribing to scan messages");
            scan_sub_ = node_->Subscribe(parent_->Topic(), &CreateCliffRos::onScan, this);
        }
    }

    void CreateCliffRos::onDisconnect()
    {
        ROS_INFO_STREAM_NAMED("cliff", "Disconnecting from scan messages");
        scan_sub_.reset();
    }

    void CreateCliffRos::onScan(const ConstLaserScanStampedPtr& laser)
    {
        // If the detected distance is outside the minimum range, indicate that a cliff is detected
        std_msgs::Bool msg;
        msg.data = laser->scan().ranges(0) > min_range_;

        pub_queue_->push(msg, pub_);
    }
}
```

Attached to links as the following:

```xml
<gazebo reference="left_cliff_sensor_link">
  <sensor type="ray" name="left_cliff_sensor">
    <always_on>true</always_on>
    <update_rate>20.0</update_rate>
    <pose>0 0 0 0 0 0</pose>
    <visualize>false</visualize>
    <ray>
      <scan>
        <horizontal>
          <samples>1</samples>
          <resolution>1</resolution>
          <min_angle>0</min_angle>
          <max_angle>0</max_angle>
        </horizontal>
      </scan>
      <range>
        <min>0.01</min>
        <max>0.04</max>
        <resolution>0.1</resolution>
      </range>
    </ray>
    <plugin name="gazebo_left_cliff_sensor" filename="libcreate_cliff_sensor_plugin.so">
      <topicName>/sim/left_cliff</topicName>
      <cliffRange>0.05</cliffRange>
    </plugin>
  </sensor>
</gazebo>

<!--
  Repeated for each sensor
-->
```

The upstream driver did not contain a cliff sensor message, so I added the following that created a model plugin to publish it.

```
# Cliff.msg
Header header

bool is_cliff_left
bool is_cliff_front_left
bool is_cliff_front_right
bool is_cliff_right
```

```c++
namespace gazebo
{
/**
 * Model plugin that consolidates individual cliff sensor sim topics into a single
 * /cliff topic that would be emitted by the ROS driver
*/
class CreateCliffModelRos : public ModelPlugin
{
public:
    CreateCliffModelRos();
    ~CreateCliffModelRos() = default;

    void Load(physics::ModelPtr parent, sdf::ElementPtr sdf);

private:
    /**
     * Cliff sensor callback
    */
    void sensorCallback(const std_msgs::BoolConstPtr& msg, bool& field);

    /**
     * 
    */
    void timerCallback(const ros::TimerEvent&);

    // Main cliff message publisher
    ros::Publisher cliff_pub_;
    // Cliff message
    create_msgs::Cliff cliff_msg_;
    // Publish timer
    ros::Timer pub_timer_;

    // Subscribers for individual sensors
    ros::Subscriber left_sub_;
    ros::Subscriber leftfront_sub_;
    ros::Subscriber right_sub_;
    ros::Subscriber rightfront_sub_;

    // Individual sensor states
    bool left_state_;
    bool leftfront_state_;
    bool right_state_;
    bool rightfront_state_;
};
}
```

```c++
#include "create_gazebo/plugins/cliff_model_plugin.hpp"

#include <functional>

namespace gazebo
{
// Register plugin with Gazebo
GZ_REGISTER_MODEL_PLUGIN(CreateCliffModelRos)

CreateCliffModelRos::CreateCliffModelRos()
{
}

void CreateCliffModelRos::Load(physics::ModelPtr, sdf::ElementPtr sdf)
{
    // Initialized ROS
    if (!ros::isInitialized())
    {
        int argc = 0;
        char** argv = nullptr;

        ros::init(argc, argv, "create_cliff_model_plugin");
    }

    // Load parameters
    double updateRate = 10.0;
    if (sdf->HasElement("updateRate"))
    {
        updateRate = sdf->Get<double>("updateRate");
    }

    std::string topic_name{"/cliff"};
    if (sdf->HasElement("topicName"))
    {
        topic_name = sdf->Get<std::string>("topicName");
    }

    ros::NodeHandle nh;

    // Setup publisher
    cliff_pub_ = nh.advertise<create_msgs::Cliff>(topic_name, 1);
    pub_timer_ = nh.createTimer(ros::Duration{1.0 / updateRate}, &CreateCliffModelRos::timerCallback, this);

    // Setup subscribers
    using namespace boost::placeholders;

    left_sub_ = nh.subscribe<std_msgs::Bool>("/sim/left_cliff", 1,
                             boost::bind(&CreateCliffModelRos::sensorCallback, this, _1, boost::ref(left_state_)));
    right_sub_ = nh.subscribe<std_msgs::Bool>("/sim/right_cliff", 1,
                             boost::bind(&CreateCliffModelRos::sensorCallback, this, _1, boost::ref(right_state_)));
    leftfront_sub_ = nh.subscribe<std_msgs::Bool>("/sim/leftfront_cliff", 1,
                             boost::bind(&CreateCliffModelRos::sensorCallback, this, _1, boost::ref(leftfront_state_)));
    rightfront_sub_ = nh.subscribe<std_msgs::Bool>("/sim/rightfront_cliff", 1,
                             boost::bind(&CreateCliffModelRos::sensorCallback, this, _1, boost::ref(rightfront_state_)));
}

void CreateCliffModelRos::sensorCallback(const std_msgs::BoolConstPtr& msg, bool& field)
{
    field = msg->data;
}

void CreateCliffModelRos::timerCallback(const ros::TimerEvent&)
{
    cliff_msg_.header.stamp = ros::Time::now();
    cliff_msg_.header.seq++;

    cliff_msg_.is_cliff_left = left_state_;
    cliff_msg_.is_cliff_front_left = leftfront_state_;
    cliff_msg_.is_cliff_right = right_state_;
    cliff_msg_.is_cliff_front_right = rightfront_state_;

    cliff_pub_.publish(cliff_msg_);
}

}
```

Adding model plugin to the URDF:

```xml
<gazebo>
  <plugin name="create_cliff_model_plugin" filename="libcreate_cliff_model_plugin.so">
    <updateRate>10.0</updateRate>
  </plugin>
</gazebo>
```

**Light sensors**

My light sensor plugins are not really "light sensing". They work like cliff sensors are and based on the distance to the detected object. I did this as the easy root as actually light detection would be base on the material of the nearby object. Hopefully this provides a reasonable approximation of the real thing.

Since light sensors are only on the Create 2, I've added the light sensor links to `create_2.urdf.xacro`:

```xml
<link name="left_light_sensor_link">
<inertial>
  <mass value="0.01" />
  <origin xyz="0 0 0" />
  <inertia ixx="0.001" ixy="0.0" ixz="0.0" iyy="0.001" iyz="0.0" izz="0.001" />
</inertial>
</link>
```

And added the light sensor plugins to the `create_2_gazebo.urdf.xacro` file using a new macro:

```xml
  <xacro:macro name="sim_create_light_sensor" params="prefix topic">
    <gazebo reference="${prefix}_link">
      <sensor type="ray" name="${prefix}">
        <always_on>true</always_on>
        <update_rate>20.0</update_rate>
        <pose>0 0 0 0 0 0</pose>
        <visualize>true</visualize>
        <ray>
          <scan>
            <horizontal>
              <samples>1</samples>
              <resolution>1</resolution>
              <min_angle>0</min_angle>
              <max_angle>0</max_angle>
            </horizontal>
          </scan>
          <range>
            <min>0.0160</min>
            <max>0.50</max>
            <resolution>0.1</resolution>
          </range>
        </ray>
        <plugin name="gazebo_${prefix}" filename="libcreate_light_sensor_plugin.so">
          <topicName>${topic}</topicName>
        </plugin>
      </sensor>
    </gazebo>
  </xacro:macro>
  <xacro:macro name="sim_create_light_sensors">
    <xacro:sim_create_light_sensor prefix="left_light_sensor" topic="/sim/light_left" />
    <xacro:sim_create_light_sensor prefix="left_front_light_sensor" topic="/sim/light_frontleft" />
    <xacro:sim_create_light_sensor prefix="left_center_light_sensor" topic="/sim/light_centerleft" />
    <xacro:sim_create_light_sensor prefix="right_light_sensor" topic="/sim/light_right" />
    <xacro:sim_create_light_sensor prefix="right_front_light_sensor" topic="/sim/light_frontright" />
    <xacro:sim_create_light_sensor prefix="right_center_light_sensor" topic="/sim/light_centerright" />
  </xacro:macro>
```

Since the light sensor are setup exactly like cliff sensors here is just the scan callback function:

```c++
static constexpr uint16_t MAX_LIGHT_VALUE = 4096;
// ...
void CreateLightRos::onScan(const ConstLaserScanStampedPtr& laser)
{
    std_msgs::UInt16 msg;

    const auto distance = laser->scan().ranges(0);

    // Check if there is no obstacle within the sensor range
    if (std::isinf(distance))
    {
        msg.data = 0;
    }
    else
    {
        const auto ratio = distance / laser->scan().range_max();
        msg.data = MAX_LIGHT_VALUE * (1.0 - ratio);
    }

    pub_queue_->push(msg, pub_);
}
```

The sensor value will approach the max value as objects get closer.

Since the light sensor values are apart of the `create_msgs/Bumper`, the bumper model plugin needs to be modified to include those values.

```c++
void CreateBumperModelRos::Load(physics::ModelPtr, sdf::ElementPtr sdf)
{
    // ...

    light_subs_[0] = nh.subscribe<std_msgs::UInt16>("/sim/light_left", 1,
                                                    boost::bind(&CreateBumperModelRos::lightSensorCallback, this,
                                                    _1, boost::ref(bumper_msg_.light_signal_left)));
    light_subs_[1] = nh.subscribe<std_msgs::UInt16>("/sim/light_frontleft", 1,
                                                    boost::bind(&CreateBumperModelRos::lightSensorCallback, this,
                                                    _1, boost::ref(bumper_msg_.light_signal_front_left)));
    light_subs_[2] = nh.subscribe<std_msgs::UInt16>("/sim/light_centerleft", 1,
                                                    boost::bind(&CreateBumperModelRos::lightSensorCallback, this,
                                                    _1, boost::ref(bumper_msg_.light_signal_center_left)));
    light_subs_[3] = nh.subscribe<std_msgs::UInt16>("/sim/light_centerright", 1,
                                                    boost::bind(&CreateBumperModelRos::lightSensorCallback, this,
                                                    _1, boost::ref(bumper_msg_.light_signal_center_right)));
    light_subs_[4] = nh.subscribe<std_msgs::UInt16>("/sim/light_frontright", 1,
                                                    boost::bind(&CreateBumperModelRos::lightSensorCallback, this,
                                                    _1, boost::ref(bumper_msg_.light_signal_front_right)));
    light_subs_[5] = nh.subscribe<std_msgs::UInt16>("/sim/light_right", 1,
                                                    boost::bind(&CreateBumperModelRos::lightSensorCallback, this,
                                                    _1, boost::ref(bumper_msg_.light_signal_right)));
}

// ...

void CreateBumperModelRos::lightSensorCallback(const std_msgs::UInt16ConstPtr& msg, uint16_t& field)
{
    field = msg->data;
}

```

Custom Worlds
-------------

I wanted to create a maze to have my robot navigate. The following is a maze model included in a new world file with a launch file to bring it up.

**Maze Model**

```
create_gazebo\
  models\
    maze\
      meshes\
        maze.stl
      model.sdf
      model.config
      maze.scad
```

The model path must be added to the `export` tags in package.xml:

```xml
<gazebo_ros gazebo_model_path="${prefix}/models"/>
```

```xml
<!-- model.config -->
<?xml version="1.0" ?>
<model>
    <name>maze</name>
    <version>1.0</version>
    <sdf version="1.6">model.sdf</sdf>
    <author>
        <name>Natesh Narain</name>
    </author>
    <description>
        Maze
    </description>
</model>
```

```xml
<?xml version='1.0'?>
<sdf version='1.6'>
<model name='maze'>
  <pose frame=''>0 0 0 0 0 0</pose>
  <link name='maze_link'>
    <pose frame=''>0 0 0 0 0 0</pose>
    <visual name='maze_visual'>
      <geometry>
        <mesh>
          <uri>model://maze/meshes/maze.stl</uri>
        </mesh>
      </geometry>
      <meta>
        <layer>1</layer>
      </meta>
    </visual>
    <collision name='maze_collision'>
      <geometry>
        <mesh>
          <uri>model://maze/meshes/maze.stl</uri>
        </mesh>
      </geometry>
    </collision>
    <self_collide>0</self_collide>
    <enable_wind>0</enable_wind>
    <kinematic>0</kinematic>
  </link>
  <static>1</static>
</model>
</sdf>
```

The collision object is built from the STL file.

I used the following `OpenSCAD` script to build the STL and exported it to the `meshes` folder:

```
// Units are in meters
border_height = 1;
border_size = 5;
border_thickness = 0.25;

interior_size = border_size - (2 * border_thickness);

global_offset = [-1, -1, 0];

bind = 0.01;

module wall(length, width, height) {
    cube(size=[length, width, height]);
}

module interior_walls() {
    translate([0, border_thickness + 1.5, 0])
        wall(3, border_thickness, border_height);
    translate([border_size - 3, border_thickness + 3, 0])
        wall(3, border_thickness, border_height);
}

module border() {
    difference() {
        cube(size=[border_size, border_size, border_height]);
        translate([border_thickness, border_thickness, -bind])
            cube(size=[interior_size, interior_size, border_height + 2 * bind]);
    }
}

module maze() {
    union(){
        border();
        interior_walls();
    }
}

translate(global_offset)
    maze();
```

**World file**

```xml
<!-- maze.world -->
<?xml version="1.0" ?>
<sdf version="1.5">
  <world name="maze">
    <include>
      <uri>model://sun</uri>
    </include>
    <include>
      <uri>model://ground_plane</uri>
    </include>
    <include>
        <uri>model://maze</uri>
    </include>
  </world>
</sdf>
```

**Launch file**

Re-using the `gazebo.launch` from above. Pass the world file as a launch file argument.

```xml
<launch>
    <arg name="verbose" default="false" />

    <include file="$(find create_gazebo)/launch/gazebo.launch">
        <arg name="world" value="$(find create_gazebo)/worlds/maze.world" />
        <arg name="verbose" value="$(arg verbose)" />
    </include>
</launch>
```

```
roslaunch create_gazebo maze.launch
```

Ready to start navigation.

![image not found!](/assets/2021/01/03/robot-in-maze.png)

