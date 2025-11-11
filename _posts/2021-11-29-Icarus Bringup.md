---
layout: post
title: Icarus Bringup
tag: ['electronics', 'firmware', 'rust']
repo: nnarain/icarus-firmware
project_id: icarus-fc
---

In my [previous post]({% post_url 2021-11-28-Icarus Controller %}) I showed the design for my own controller board. In this post I'll go over the basic bring up.


Assembly
--------

Hand soldering a board is this is... *possible*, but difficult (At least for me). Can't say I want to risk a bunch of manual errors either. Instead I had the board assembled through JLCPCB.

So really I just had to wait for the board in the mail... Behold!

![image not found!](/assets/2021/11/29/board.jpg)

I did have to solder the SWD header.

A few things regarding the layout:

* The SWD headers I bought are too big and don't match the footprint I used. Actually got lucky it fit on the board.
* When I submitted my files to JLCPCB they said the USB part I had selected did not match the footprint (the footprint in their part library is just 'MICRO-USB-SMD'). Anyways, I'll have to take better care measuring the footprints next time
* Test points. I thought about them, but it's hard to appreciate when they come in handy until you need them. In this case I would have been a good idea to put test points on the SWD pins, that way I can check continuity between the header and the MCU.

Generally there is a lot of potential space on this board. In the Rev B design I intend on optimizing that.

Firmware Setup
--------------

**Build**

Ok now to write some firmware and see if this thing even works! I've written the firmware in Rust.

Embedded Rust typically comes in 3 layers:

* Peripheral Access Crate (Containing register definitions)
* Hardware Abstraction Layer (Abstract the direct register access into common traits)
* Board support package (A Rust crate containing code for a specific board)

I created a new repo with two packages:

```
    icarus/
        src/
            lib.rs
        Cargo.toml
        build.rs
        memory.x
    icarus-test/
        examples/
        Cargo.toml
```

The package `icarus` is the board support package (bsp). `icarus-test` is the testing grounds for now (This will probably disappear when the project matures).

In the `Cargo.toml` I've defined the per-package-target and setup my dependencies with the STM32F3 HAL crate.

```toml
cargo-features = ["per-package-target"]

[package]
name = "icarus"
version = "0.1.0"
edition = "2018"
forced-target = "thumbv7em-none-eabihf"

[dependencies]
cortex-m = "0.6"
cortex-m-rt = "0.6"
stm32f3xx-hal = {version = "0.8.1", features = ["stm32f302x8", "rt"]}
```

Now the linker script needs to be added for the specific processor I'm using. In this case the STM32F302C8 has 64kB of flash and 16kB of SRAM. The linker script is usually called `memory.x`.

```
/* Linker script for the STM32F302C8T6 */
MEMORY
{
  /* NOTE 1 K = 1 KiBi = 1024 bytes */
  FLASH : ORIGIN = 0x08000000, LENGTH = 64K
  RAM : ORIGIN = 0x20000000, LENGTH = 16K
}
```

Typically a `build.rs` is used to copy the `memory.x` file to the build directory:

```
use std::env;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

fn main() {
    let out = &PathBuf::from(env::var_os("OUT_DIR").unwrap());
    File::create(out.join("memory.x"))
        .unwrap()
        .write_all(include_bytes!("memory.x"))
        .unwrap();
    println!("cargo:rustc-link-search={}", out.display());

    println!("cargo:rerun-if-changed=memory.x");
}
```

This is boiler plate you'll see in most Rust embedded projects.

`icarus-test` depends on `icarus`, and just for a test I re-exported the usual dependencies

```rust
#![no_std]

pub use cortex_m;
pub use cortex_m_rt as rt;

pub use rt::entry;

pub use stm32f3xx_hal as hal;

pub mod prelude {
    pub use crate::hal::prelude::*;
}
```

And imported them into the test crate. The goal is to just get something building.

Below in a simple program to blink the two status LEDs on the board.

```rust
#![no_std]
#![no_main]

use panic_halt as _;

use icarus::{
    entry,
    prelude::*,
    hal::pac,
    cortex_m::asm,
};

#[entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();

    let mut rcc = dp.RCC.constrain();
    let mut gpioa = dp.GPIOA.split(&mut rcc.ahb);

    let mut stat1 = gpioa
        .pa4
        .into_push_pull_output(&mut gpioa.moder, &mut gpioa.otyper);
    let mut stat2 = gpioa
        .pa5
        .into_push_pull_output(&mut gpioa.moder, &mut gpioa.otyper);

    stat2.toggle().unwrap();

    loop {
        stat1.toggle().unwrap();
        stat2.toggle().unwrap();
        asm::delay(8_000_000);
    }
}
```

A simple `cargo build`, builds the firmware.

**Flashing**

I'm using a Black Magic Probe and a GDB script to load programs onto the board.

```
target extended-remote \\.\COM15

monitor swdp_scan

attach 1

# print demangled symbols
set print asm-demangle on

# set backtrace limit to not have infinite backtrace loops
set backtrace limit 32

# detect unhandled exceptions, hard faults and panics
break DefaultHandler
break HardFault
break rust_begin_unwind

# *try* to stop at the user entry point (it might be gone due to inlining)
break main

load

# start the process but immediately halt the processor
stepi
```

At the moment this is hard coded to COM15 on my PC until I sort out a better way. But this is enought to flash!

In `.cargo/config.toml` I setup the runner and an alias for convenience:

```toml
[alias]
icarus-flash = "run --package icarus-test --target thumbv7em-none-eabihf"

[target.'cfg(all(target_arch = "arm", target_os = "none"))']
runner = "gdb -q -x stm32.gdb"
rustflags = [
  "-C", "link-arg=-Tlink.x",
]
```

Running:

```
cargo icarus-flash
```

And....

![image not found!](/assets/2021/11/29/lights.jpg)

And they did light up!

**Board Support Package**

Time to create a better board support crate. I want to setup all the correct pins to model the board functionality.

I created a new `Icarus` struct:

```rust
use crate::{
    hal::{
        self,
        prelude::*,
        pac,
        gpio::{self, Output, PushPull, Alternate},
    },
    IcarusError
};

/// Pinout for icarus controller
pub struct Icarus {
    pub stat1: gpio::PA4<Output<PushPull>>, // Status LED 1
    pub stat2: gpio::PA5<Output<PushPull>>, // Status LED 2
}

impl Icarus {
    pub fn new() -> Result<Icarus, IcarusError> {
        let dp = hal::pac::Peripherals::take().unwrap();

        let mut rcc = dp.RCC.constrain();

        let mut gpioa = dp.GPIOA.split(&mut rcc.ahb);
        let mut gpiob = dp.GPIOB.split(&mut rcc.ahb);

        // Status LEDs
        let stat1 = gpioa.pa4.into_push_pull_output(&mut gpioa.moder, &mut gpioa.otyper);
        let stat2 = gpioa.pa5.into_push_pull_output(&mut gpioa.moder, &mut gpioa.otyper);

        Ok(
            Icarus {
                stat1,
                stat2,
            }
        )
    }
}
```

This just holds the pins I created in the previous example. And to use:

```rust
use icarus::{
    entry,
    prelude::*,
    cortex_m::asm,
};

#[entry]
fn main() -> ! {
    let icarus = Icarus::new().unwrap();

    let mut stat1 = icarus.stat1;
    let mut stat2 = icarus.stat2;

    stat2.toggle().unwrap();

    loop {
        stat1.toggle().unwrap();
        stat2.toggle().unwrap();
        asm::delay(8_000_000);
    }
}
```

Setting up USART is similar:

```rust
use crate::{
    hal::{
        self,
        prelude::*,
        pac,
        gpio::{self, Output, PushPull, Alternate},
        serial::Serial,
    },
    IcarusError
};

type PinTx1 = gpio::PA9<Alternate<PushPull, 7>>;
type PinRx1 = gpio::PA10<Alternate<PushPull, 7>>;
type PinTx2 = gpio::PB3<Alternate<PushPull, 7>>;
type PinRx2 = gpio::PB4<Alternate<PushPull, 7>>;

pub struct Icarus {
    // ...
    pub usart1: Serial<pac::USART1, (PinTx1, PinRx1)>, // Serial Port 1
    pub usart2: Serial<pac::USART2, (PinTx2, PinRx2)>, // Serial Port 2
}

impl Icarus {
    pub fn new() -> Result<Icarus, IcarusError> {
        let dp = hal::pac::Peripherals::take().unwrap();

        let mut flash = dp.FLASH.constrain();
        let mut rcc = dp.RCC.constrain();

        let clocks = rcc.cfgr.freeze(&mut flash.acr);

        // ...

        let mut gpiob = dp.GPIOB.split(&mut rcc.ahb);

        // Serial ports

        // USART 1
        let tx1 = gpioa.pa9.into_af7_push_pull(&mut gpioa.moder, &mut gpioa.otyper, &mut gpioa.afrh);
        let rx1 = gpioa.pa10.into_af7_push_pull(&mut gpioa.moder, &mut gpioa.otyper, &mut gpioa.afrh);

        let usart1 = Serial::new(dp.USART1, (tx1, rx1), 115200.Bd(), clocks, &mut rcc.apb2);

        // USART 2
        let tx2 = gpiob.pb3.into_af7_push_pull(&mut gpiob.moder, &mut gpiob.otyper, &mut gpiob.afrl);
        let rx2 = gpiob.pb4.into_af7_push_pull(&mut gpiob.moder, &mut gpiob.otyper, &mut gpiob.afrl);

        let usart2 = Serial::new(dp.USART2, (tx2, rx2), 115200.Bd(), clocks, &mut rcc.apb1);

        Ok(
            Icarus {
                // ...
                usart1,
                usart2,
            }
        )
    }
}
```

And to use:

```rust
#![no_std]
#![no_main]

use panic_halt as _;

use icarus::{
    entry,
    prelude::*,
    cortex_m::asm,
};

use core::fmt::Write;

#[entry]
fn main() -> ! {
    let icarus = Icarus::new().unwrap();
    let mut usart1 = icarus.usart1;
    let mut usart2 = icarus.usart2;

    let mut stat1 = icarus.stat1;

    loop {
        // Show activity
        stat1.toggle().unwrap();

        write!(usart1, "Hello USART1!\r\n").unwrap();
        write!(usart2, "Hello USART2!\r\n").unwrap();

        asm::delay(8_000_000);
    }
}
```

And that's both serial ports working!

**Next steps**

There's still more bring up to do on this board:

* IMU
* USB
* SPI / Plus the other GPIO
