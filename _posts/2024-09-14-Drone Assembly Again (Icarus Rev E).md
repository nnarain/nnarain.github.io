---
layout: post
title: Drone Assembly.. Again (Icarus Rev E)
tag: ['icarus', 'drone', 'electronics', 'rust', 'embedded']
repo: nnarain/icarus-firmware
---

I have been slow and steadily working on the next drone build using [Icarus Rev E]({% post_url 2024-06-16-Icarus Rev E %}) and the[ Gamepad RC stack]({% post_url 2024-08-05-Gamepad RC Stack %}). Finally getting back to where I was with the C++ based firmware.

In this update I'm actually moved passed where I originally was and should just have to rune PIDs before a flight test..

# Build

![image not found!](/assets/2024/09/14/build.jpg)

![image not found!](/assets/2024/09/14/build2.jpg)

This is the stack up using Icarus and Gamepad RC stack.

I've just been sticking with jumper wires for now but eventually I'll shift to a more permanent setup.

# Firmware

Currently I'm having an issue where the PWM is not alway being enabled at start up. I have to hit the reset button a few times before the ESC will arm. Other then that I do have control of the rotors.


PID control is currently implemented and working in spirit but I need to tune the constants. The input is taken from the RC controller and mapped to +/- 10 degrees for pitch and roll control.

A general throttle input from the RC controller is taken to provide a constant output to get the motors spinning.

```rust
    // NOTE: The inputs are inverted
    let (chnl0, chnl1, chnl2, chnl3) = last_cmd.throttle();
    let (chnl0, chnl1, _chnl2, chnl3) = (chnl0 * -1.0, chnl1 * -1.0, chnl2 * -1.0, chnl3 * -1.0);

    // Remap input range to [-10, +10] degrees for pitch and roll
    let pitch_input = utils::map_range(chnl0, -511.0, 512.0, -10.0, 10.0);
    let roll_input = utils::map_range(chnl1, -511.0, 512.0, -10.0, 10.0);
    // let yaw_input = utils::map_range(chnl2, -511.0, 512.0, -10.0, 10.0);

    // Only use the forward portion of the joystick command
    let throttle = (chnl3).clamp(0.0, 512.0);
    // Remap the throttle to the PWM range
    let throttle = utils::map_range(throttle, 0.0, 512.0, MIN_ROTOR_THROTTLE as f32, MAX_ROTOR_THROTTLE as f32);
```

The estimated state is passed to the PIDs:

```rust
    let state = estimated_state.receive().await;

    // Update the PID controllers with the new set points
    pitch_pid.setpoint(pitch_input);
    roll_pid.setpoint(roll_input);

    // Get the output of the PID controller
    let pitch_output = pitch_pid.next_control_output(state.attitude.pitch).output;
    let roll_output = roll_pid.next_control_output(state.attitude.roll).output;
```

And the output is mapped to the PWM pins

```rust
    let t1 = throttle + pitch_output + roll_output - yaw_output;
    let t2 = throttle - pitch_output + roll_output + yaw_output;
    let t3 = throttle + pitch_output - roll_output + yaw_output;
    let t4 = throttle - pitch_output - roll_output - yaw_output;

    let t1 = (t1 as u16).clamp(MIN_ROTOR_THROTTLE, MAX_ROTOR_THROTTLE);
    let t2 = (t2 as u16).clamp(MIN_ROTOR_THROTTLE, MAX_ROTOR_THROTTLE);
    let t3 = (t3 as u16).clamp(MIN_ROTOR_THROTTLE, MAX_ROTOR_THROTTLE);
    let t4 = (t4 as u16).clamp(MIN_ROTOR_THROTTLE, MAX_ROTOR_THROTTLE);

    pwm.set_duty(PwmChannel::Ch1, t1);
    pwm.set_duty(PwmChannel::Ch2, t2);
    pwm.set_duty(PwmChannel::Ch3, t3);
    pwm.set_duty(PwmChannel::Ch4, t4);
```

I can control the throttle and pitch/roll from my Dualshock 4 controller. I couldn't do that in my last iteration (prompting the gamepad-rc-stack and rev E builds).

Next up is tuning PIDs.

# Future

I actually want the vertical throttle to be in terms of vertical velocity to eventually achieve a stable hover.

I'm also getting to the point of having to consider how I'm going to approach an actual flight test.

Preview for Icarus Rev F, mostly having QoL improvements.

![image not found!](/assets/2024/09/14/icarus-revf-preview.png)
