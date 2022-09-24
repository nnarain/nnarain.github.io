---
layout: post
title: Helios Light Controller Rev D
tag: ['esp', 'esp32', 'kicad', 'wled', 'leds', 'led-controller']
repo: nnarain/esp-light-controller
---

A few months back I re-design my [light controller using an ESP32]({% post_url 2022-05-19-ESP32 Light Controller %}). It worked out pretty good, but not quite ready to use. In the last few weeks I've fixed the hardware bugs and added some new functionality.

The new functionality I needed for real usage was:

* Mounting holes
* Temperature sensor
* Fan support

I didn't want to have this controller plugged in long term without a cooling solution.

**Fixing Hardware Bugs**

The old design had an issue where I had a pull-up resistor on one of the strapping pins, causing a bad boot configuration. This was fixed by moving all the IO I used to non-strapping pins.

**Temperature sensor and PWM Fan Support**

WLED has usermods for temperature sensing and fan control. This requires a `DS18B20` temperature sensor.

![image not found!](/assets/2022/09/23/temperature-sensor.png)

Now, there's a 4.7k resistor here that I originally missed. So in the pictures below you'll see it fly-wired.

The fan requires a new logic shifter circuit and a pin header.

![image not found!](/assets/2022/09/23/fan-tach.png)

The firmware configuration for WLED is the following:

```ini
[platformio]
default_envs = esp32dev

[env:esp32dev]
board = esp32dev
platform = ${esp32.platform}
platform_packages = ${esp32.platform_packages}
build_unflags = ${common.build_unflags}
build_flags = ${common.build_flags_esp32}
             -D WLED_RELEASE_NAME=ESP32
             -D USERMOD_DALLASTEMPERATURE
             -D USERMOD_DALLASTEMPERATURE_CELSIUS
             -D USERMOD_PWM_FAN
             -D PWM_PIN=16
             -D TACHO_PIN=17
lib_deps = ${esp32.lib_deps}
monitor_filters = esp32_exception_decoder
board_build.partitions = ${esp32.default_partitions}
```

**Results**

![image not found!](/assets/2022/09/23/connected.jpg)

**Rev E**

As I've mentioned above, I missed a resistor. I also realized I should add a break out for I2C and some extra IO.

So the next rev will look something like:

![image not found!](/assets/2022/09/23/reve.png)

