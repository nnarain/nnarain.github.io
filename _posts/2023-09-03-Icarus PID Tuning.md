---
layout: post
title: Icarus PID Tuning
tag: ['flight-controller', 'pid', 'electronics']
repo: nnarain/icarus-firmware
---

I feel like I should do a whole post on burnout.. But not today!

Today I managed to find some time to work on my flight controller, Icarus.

For a while now I've been at the "make it fly" stage. Which I guess is a pretty fundamental part of the project. I've had some basic code written but now I'm finally getting around to testing it.

**How to Control a Drone**

After [arming the ESC]({% post_url 2023-01-29-Interfacing with ESCs %}), you obviously have to start sending appropriate throttle commands to each motor, but what would those be?

I'm not going to sit here and pretend to explain PID controllers better then other references on the internet. What I do want to explain is how to map the PID controllers to the rotor throttle commands.

The most basic (but not only) way to control a drone is to control it's pitch, roll and yaw (thus allowing it to move forward, backwards, left, right and turn).

The basic idea is:

1. Get the orientation of the drone (pitch, roll, yaw) using the IMU
2. Plug the calculated pitch, roll and yaw into individual PID controllers
3. Motion is defined by a certain pitch and roll angles
4. Take the PID outputs and "mix" with the rotor throttle output

I struggled the most with that last part. What does mixing mean?

Lets take a look at a drone rotor layout (forward denoted by "^^"):

              ^^
           (4)  (2)
              \/
              /\
           (3)  (1)

If the drone needs to move forward, rotors 1 and 3 would need to increase in speed so the drone pitches forward.
Similarly, rotors 2 and 4 would need to increase in speed if the drone needed to pitch backwards.

Some idea for roll control except the pairs are (3,4) and (1,2).

Also keep in mind there's always has to be some constant thrust (otherwise your drone is falling).

So for just pitch control we'd get something like:

```c++
    const auto t1 = throttle_ + pitch_output_;
    const auto t2 = throttle_ - pitch_output_;
    const auto t3 = throttle_ + pitch_output_;
    const auto t4 = throttle_ - pitch_output_;

    setThrottle(t1, t2, t3, t4);
```

Where the output of the pitch PID controller is used to adjust the constant thrust applied to each rotor.

Roll and Yaw:

```c++
    const auto t1 = throttle_ + pitch_output_ + roll_output_ - yaw_output_;
    const auto t2 = throttle_ - pitch_output_ + roll_output_ + yaw_output_;
    const auto t3 = throttle_ + pitch_output_ - roll_output_ + yaw_output_;
    const auto t4 = throttle_ - pitch_output_ - roll_output_ - yaw_output_;
```

Yaw is a bit tricky. Drone propeller direction are setup in opposing direction to cancel rotational forces.

![image not found!](/assets/2023/09/03/Motor-Order.jpg)[^1]

But adjusting the speed of the rotors on the diagonals you can control the drones yaw. Yaw is also excepted to drift without a magnetometer which I has not setup yet.

**PID tuning**

Starting with just proportional gain.

![image not found!](/assets/2023/09/03/p-controller.gif)

The drone will start to oscillate without the other terms present.

PID control:

![image not found!](/assets/2023/09/03/pid-controller.gif)

That keeps it stable but my problem at start up is the throttle command on the top side rotors don't cause them to spin at first until they dip below 0 degrees. The problem here is a can't really tell is the motors are spinning when using PWM control with the ESC so the firmware is kind of blind to this at the moment. A higher base throttle would solve this but I think that would reduce room for the PIDs to operate.

![image not found!](/assets/2023/09/03/stopped-motors.gif)

Either way a successful day!

**References**

[^1]: [https://www.getfpv.com/learn/fpv-essentials/how-to-setup-reversed-propellers/](https://www.getfpv.com/learn/fpv-essentials/how-to-setup-reversed-propellers/)
