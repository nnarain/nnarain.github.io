---
layout: post
title: ROS 2 Integration Tests
tag: ['ros2', 'ros']
repo: 
---

Quick example on how to setup integration tests in ROS 2. Specifically running tests on a life cycle node.

The information is generally available online in pieces, but I didn't see a complete example for what I wanted to do.

This example is primarily sourced from [here](https://docs.ros.org/en/jazzy/Tutorials/Intermediate/Testing/Integration.html) and [here](https://github.com/ros2/launch_ros/blob/rolling/launch_ros/examples/lifecycle_pub_sub_launch.py) (jazzy).

**Package Dependencies**

First off add the following dependencies for `launch_testing` to your `package.xml` file.

```xml
<test_depend>ament_cmake_ros</test_depend>
<test_depend>launch</test_depend>
<test_depend>launch_ros</test_depend>
<test_depend>launch_testing</test_depend>
<test_depend>launch_testing_ament_cmake</test_depend>
<test_depend>rclpy</test_depend>
```

**CMake**

```cmake
cmake_minimum_required(VERSION 3.8)
project(app)

########
# test #
########

if(BUILD_TESTING)
  # Integration tests
  find_package(ament_cmake_ros REQUIRED)
  find_package(launch_testing_ament_cmake REQUIRED)
  function(add_ros_isolated_launch_test path)
    set(RUNNER "${ament_cmake_ros_DIR}/run_test_isolated.py")
    add_launch_test("${path}" RUNNER "${RUNNER}" ${ARGN})
  endfunction()

  add_ros_isolated_launch_test(tests/integration_tests/simple_test.launch.py)
endif()
```

I added my first test at: `tests/integration_tests/simple_test.launch.py`

**Writing the Test**

```python
# simple_test.launch.py
import unittest

import os
import rclpy
import launch
import time
import launch_ros
import launch.actions
import launch_testing.actions
import launch_testing.markers

import pytest

import lifecycle_msgs
from lifecycle_msgs.srv import ChangeState

# This function specifies the processes to be run for our test
@pytest.mark.launch_test
def generate_test_description():
    pass

```

**Launching the Lifecycle Node**

Originally I thought I'd call the lifecycle state change service directly, but that does work (most likely the test runner is not multi-threaded and therefore calling the service causes a deadlock)

The way you're supposed to do this is adding the state change events to the launch file actions.

```python
@pytest.mark.launch_test
def generate_test_description():
    node = launch_ros.actions.LifecycleNode(
            package='nifty',
            executable='nifty_node',
            name='nifty',
            namespace='',
          )
    inactive_event = launch.actions.RegisterEventHandler(
        launch_ros.event_handlers.OnStateTransition(
            target_lifecycle_node=node, goal_state='inactive',
            entities=[
                launch.actions.LogInfo(
                    msg="node 'nifty' reached the 'inactive' state, 'activating'."),
                launch.actions.EmitEvent(event=launch_ros.events.lifecycle.ChangeState(
                    lifecycle_node_matcher=launch.events.matches_action(node),
                    transition_id=lifecycle_msgs.msg.Transition.TRANSITION_ACTIVATE,
                )),
            ],
        )
    )
    active_event = launch.actions.RegisterEventHandler(
        launch_ros.event_handlers.OnStateTransition(
            target_lifecycle_node=node, goal_state='active',
            entities=[
                launch.actions.LogInfo(
                    msg="node 'nifty' reached the 'active' state")
            ],
        )
    )
    configure_transition = launch.actions.EmitEvent(
                            event=launch_ros.events.lifecycle.ChangeState(
                                lifecycle_node_matcher=launch.events.matches_action(node),
                                transition_id=lifecycle_msgs.msg.Transition.TRANSITION_CONFIGURE,
                            )
                          )

    return launch.LaunchDescription([
        node,
        inactive_event,
        active_event,
        configure_transition,
        # Tell launch to start the test
        launch.actions.TimerAction(period=1.0, actions=[launch_testing.actions.ReadyToTest()]),
    ])
```

I wish there was a less verbose way to write this. But effectively all it's doing is telling the launch system to transition the node into configure and then active state.

**Writing a Test**

```python
# Active tests
class TestNifyNode(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rclpy.init()

    @classmethod
    def tearDownClass(cls):
        rclpy.shutdown()

    def setUp(self):
        self.node = rclpy.create_node('simple_test')

    def tearDown(self):
        self.node.destroy_node()

    def test_publishes_pose(self, proc_output):
        """Check whether pose messages published"""
        msgs_rx = []
        sub = self.node.create_subscription(
            Pose, 'nifty/topic',
            lambda msg: msgs_rx.append(msg), 100)
        try:
            # Listen to the pose topic for 10 s
            end_time = time.time() + 10
            while time.time() < end_time:
                # spin to get subscriber callback executed
                rclpy.spin_once(self.node, timeout_sec=1)
            # There should have been 100 messages received
            assert len(msgs_rx) > 100
        finally:
            self.node.destroy_subscription(sub)
```

