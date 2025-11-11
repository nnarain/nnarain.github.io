---
layout: post
title: Interfacing with ESCs
tag: ['drone', 'electronics', 'embedded', 'esp32', 'esp32-c3']
repo:
---


Given the failure to get significant lift from using small brushed DC motors mentioned in a [previous post]({% post_url 2022-08-28-Icarus Frame Design %}), I'm opting to interface with real drone hardware.

Now, I was originally trying to avoid this since there are many options and it's somewhat hard to sort through everything. However, I realized that for ESCs it is hard to go wrong when it comes to finding something that will work with a generic flight controller.

So might as well get started somewhere..

**What is an ESC?**

OK so first off, what is an ESC? ESC stands for "Electronic Speed Controller". They are used to control brushless DC motors (like the kind used in drones).

**Types of ESCs**

They come in a few different varieties and interfacing options. Some are dedicated for a single motor. Others are 4-in-1 ESCs in single package.

I'm using a 4-in-1 ESC using the BLHeli_32 firmware (Specifically a `Diatone Mamba F40 40A 6S BLS 4-in-1 ESC `).

**BLHeli_32**

BLHeli_32 seems to be the most common ESC firmware available. It handles controlling the motors and can take a variety of input options.

For example:

* OneShot
* MultiShot
* DShot 150/300/600/1200
* PWM

BLHeli_32 can actually auto detect the input signal at startup. So while my ESC board description says it supports DSHOT 300/600 it actually supports PWM as well, without any other configuration as far as I can tell.

I selected the ESP32-C3 for Icarus with PWM control in mind. Though it seems DShot would be a better long term option. However, the ESP32-C3 doesn't have enough peripherals to support 4x Dshot outputs.

**BLHeli_32 Arming Sequence**

The ESC firmware needs to be explicitly armed before it will start driving the motors.

The arming process is pretty straight forward. See the BLHeli_32 manual below:

![image not found!](/assets/2023/01/29/arm-seq.png)

In summary:

* 3 beeps at start up
* 1 beep to confirm throttle signal detected
* 1 beep to confirm a throttle of zero commanded.
    * The actual waveform of the throttle depends on the protocol used

At this point the ESC is ready to drive the motors.

**PWM Control**

I wanted to test DShot control as well, so I'm using a PlatformIO project setup to test everything using the Arduino Framework.

I'm using my [ESP32-C3 dev board]({% post_url 2022-06-18-ESP32-C3-MINI-1 Dev Board %}) to test

```c++
#include <Arduino.h>

#define LED_PIN GPIO_NUM_7

#define RTRCTL GPIO_NUM_10
#define LEDC_CHNL 0

uint16_t throttle = 0;
unsigned long start_ms = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Setup LEDC channel with 200Hz and 8-bit resolutions
  ledcSetup(LEDC_CHNL, 200, 8);
  // Attach rotor control output pin to the LEDC channel
  ledcAttachPin(RTRCTL, LEDC_CHNL);

  // Set initial duty cycle for zero throttle
  throttle = 51;
  ledcWrite(LEDC_CHNL, throttle);
}

void loop() {
  // Wait 3s. Then set duty cycle to max throttle
  const auto now = millis();
  if (now >= start_ms + 3000)
  {
    throttle = 102;
    digitalWrite(LED_PIN, HIGH);
  }

  ledcWrite(LEDC_CHNL, throttle);
}
```

For PWM control the ESC expects a pulse width of 1ms - 2ms (like a typical RC servo).

For some reason I haven't figured out the ESP32-C3's LEDC peripheral won't output a signal below 200Hz. So I had to calculate the duty cycle to achieve the desired pulse width.

```
200Hz -> 5ms
8-bit resolution -> 255 steps
5ms / 255 -> 0.0196078431372549 ms per step

Max Throttle -> 2ms pulse width
2ms / 0.0196078431372549 = 102

Min Throttle -> 1ms pulse width
1ms / 0.0196078431372549 = 51
```

Confirming PWM output:

![image not found!](/assets/2023/01/29/pwm-output.png)

The code above is able to arm and drive the motor at full throttle. Though I don't have a great test setup for everything at the moment.

**DShot Control**

As mentioned above, DShot seems like the better long term option. It supports direction reversing, telemetry and other functionality.

While my flight controller design can't drive 4x dshot outputs, I thought I'd see if I could still get it going.

```c++
#include <Arduino.h>
#include <DShotRMT.h>

#define LED_PIN GPIO_NUM_7
#define RTRCTL GPIO_NUM_10
#define RTRCTL_RMT_CHNL RMT_CHANNEL_1

DShotRMT dshot(RTRCTL, RTRCTL_RMT_CHNL);
uint16_t throttle = 0;
unsigned long start_ms = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  dshot.begin(DSHOT600);

  start_ms = millis();
}

void loop() {
  const auto now = millis();
  if (now >= start_ms + 3000)
  {
    throttle = 1000;
    digitalWrite(LED_PIN, HIGH);
  }

  dshot.send_dshot_value(throttle);

  delay(1);
}

```

I'm using this library https://github.com/derdoktor667/DShotRMT.git to implement the DShot protocol. It uses the ESP32-C3's RMT module.

**Future Work**

* Need to get the motors at least partially assembled to the frame to make things easier to test
* Get the other motors working
* Port to Rust
