---
layout: post
title: Icarus Rev E - Firmware Bringup
tag: ['icarus', 'electronics', 'drone', 'rust', 'embedded']
repo: nnarain/icarus-firmware
project_id: icarus-fc
---

Quick update on the new icarus controller.

Having issues with the USB connection to the board. What's odd is I'm having the same issue with USB to the Rev D version (ESP32-C3 module) and my STM32F4 devboard.

So instead of using the bootloader DFU I'm falling back to flashing over UART. Luckily this worked without issue but I've lost a convenient "run" option for uploading firmware (now I have to explicitly flashing the board using the STM32 Cube Programmer).

![image not found!](/assets/2024/07/04/icarus-reve.jpg)

Probably going to make another attempt to do the firmware in Rust using Embassy but I love the idea of async-io on embedded. But I'll go back to C++ if things get iffy.

Embassy firmware for simple UART hello world.

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use defmt::*;
use embassy_stm32::usart::{Config, Uart};
use embassy_stm32::{bind_interrupts, peripherals, usart};
use {defmt_rtt as _, panic_probe as _};

#[entry]
fn main() -> ! {
    info!("Hello World!");

    let p = embassy_stm32::init(Default::default());

    let config = Config::default();
    let mut usart = Uart::new_blocking(p.USART1, p.PA10, p.PA9, config).unwrap();

    loop {
        unwrap!(usart.blocking_write(b"Hello Embassy World!\r\n"));
    }
}
```

![image not found!](/assets/2024/07/04/embassy.png)

This was just to ensure the board was programmable and working.

**Next Steps**

* RC controller input over UART
* IMU
* State estimation
* STAT LED

Honestly I think having the USB connector on this board is a waste of space and getting USB devices to show up on my PC is wasting time. I think I'll opt to remove it as well as the WS2812 status LED. Keep it simple.
