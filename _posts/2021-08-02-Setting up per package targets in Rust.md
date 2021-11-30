---
layout: post
title: Setting up per package targets in Rust
tag: ['rust', 'cargo', 'embedded']
repo: 
---

In a lot of the current embedded Rust examples the target architecture is specified in `.cargo/config.toml` in the `build` section:

```toml
[build]
target = "thumbv7em-none-eabihf"
```

However, if you are using a cargo workspace, this will be applied to every package. This can complicate how you organize packages within a repo (or even force you to move some packages to a new repo).

I'm currently working on an embedded Rust project and wanted to have the following workspace structure:

```
    fancy-project
        common-lib
        desktop
        firmware
```

Where both the `desktop` and `firmware` binaries share the `common-lib` dependency.

The `per-package-target` cargo feature allows the target architecture of `firmware` to be specified at the package level, enabling this project structure.

Firmware package setup
----------------------

At the moment I'm using an STM32F3 Discovery Kit so my setup look very similar to the [Embedded Rust Book](https://docs.rust-embedded.org/book/). I suggest checking that out.

`per-package-target` is currently an unstable cargo feature, so it needs to be switched on in `Cargo.toml` using `cargo-features`. Then `forced-target` is used to specify the target architecture for the package.

```toml
cargo-features = ["per-package-target"]

[package]
name = "firmware-disco"
version = "0.1.0"
edition = "2018"
forced-target = "thumbv7em-none-eabihf"

[dependencies]
cortex-m = "0.6.0"
cortex-m-rt = "0.6.10"
cortex-m-semihosting = "0.3.3"
panic-halt = "0.2.0"
stm32f3xx-hal = {version = "0.7", features = ["stm32f303xc", "rt"]}
```

I found that when I had a relatively simple `main.rs`, like the following from the Embedded Rust Book:

```rust
#![no_std]
#![no_main]

use panic_halt as _;

use cortex_m::asm;
use cortex_m_semihosting::hprintln;

#[cortex_m_rt::entry]
fn main() -> ! {
    hprintln("hello world").unwrap();

    loop {
        asm::nop();
    }
}

```

`rust-lld` would throw an linker error complaining about interrupt vectors not being specified. The reason for this is because no device crate has been linked in at this point and can be solved by simple adding:

```rust
use stm32f3xx_hal as _;
```

This is line in particular is unnecessary the moment you want to actually access device peripherals.

```rust
#![no_std]
#![no_main]

use panic_halt as _;

use stm32f3xx_hal::{
    prelude::*,
    pac,
};

use cortex_m::asm;
use cortex_m_semihosting::hprintln;

#[cortex_m_rt::entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();

    // ... init ...

    loop {
        // ... fancy code ...
    }
}
```

As to why this doesn't happen when not using `per-package-target` I'm not entirely sure.

At this point the package can be added as a workspace member:

```toml
[workspace]
members = [
    "common-lib",
    "firmware-disco",
    "desktop-app"
]
```

**Building**

An all inclusive `cargo build` will not work. The package must be specified:

```bash
$ cargo build --package firmware-disco
```

**Running**

I found the `cargo run` command doesn't treat the firmware package as an `arm` architecture package unless the target is specified. It therefore did not use the configured `runner` and tried to directly run the firmware binary as an exe.

To run the firmware package, ensure the runner is specified in `.cargo/config.toml` and pass `--target` to the run command:

```toml
[target.'cfg(all(target_arch = "arm", target_os = "none"))']
runner = "arm-none-eabi-gdb -q -x firmware-disco/openocd.gdb"

rustflags = [
  "-C", "link-arg=-Tlink.x",
]
```

Start `openocd` in another terminal and then run:

```
$ cargo run --package firmware-disco --target thumbv7em-none-eabihf
```

A bit lengthy. This can be added as an `alias` in `.cargo/config.toml`:

```toml
[alias]
disco = "run --package firmware-disco --target thumbv7em-none-eabihf"
```

```
$ cargo disco
```
