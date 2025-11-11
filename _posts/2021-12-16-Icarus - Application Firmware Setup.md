---
layout: post
title: Icarus - Application Firmware Setup
tag: ['rust', 'embedded', 'electronics', 'rtos']
repo: nnarain/icarus-firmware
project_id: icarus-fc
---

Since the initial [bring up]({% post_url 2021-11-29-Icarus Bringup %}) of the board I've tested the PWM and IMU. Time to setup the actual framework for building the application firmware.

Ultimately the controller will have to do the following:

* Process incoming user input (i.e. A controller)
* Estimate its orientation using the IMU
* Control PWM outputs
* Report its state

Everything needs to happen in a timely manner so the system response is consistent and predicable.

This is where usage of a Real Time Operation System (RTOS) comes in.

**RTIC**

[RTIC](https://github.com/rtic-rs/cortex-m-rtic) stands for "Real time interrupt driven concurrency", and is a framework for building real time systems.

The key features I like about RTIC are:

* Scheduling software tasks
* Handling hardware interrupts
* Shared resource management

RTIC application setup is done with several derive macros. Combined with board support package I've already created for Icarus the setup is quiet clean.

```rust
#![no_std]
#![no_main]

use panic_halt as _;

#[rtic::app(device = icarus::hal::pac, peripherals = true, dispatchers = [EXTI3, EXTI4])]
mod app {
    use icarus::{
        prelude::*,
        cortex_m,
    };

    use systick_monotonic::*;

    #[monotonic(binds = SysTick, default = true)]
    type IcarusMono = Systick<100>;

    #[shared]
    struct Shared {}

    #[local]
    struct Local {
        stat1: PinStat1,
    }

    #[init]
    fn init(cx: init::Context) -> (Shared, Local, init::Monotonics) {
        let systick = cx.core.SYST;
        let mono = Systick::new(systick, 8_000_000);

        // Initialize hardware
        let hw = Icarus::new(cx.device).unwrap();

        // LED indicators
        let stat1 = hw.stat1;

        (
            Shared {},
            Local{
                stat1,
            },
            init::Monotonics(mono)
        )
    }

    ///
    /// Spawn tasks to handle incoming data and system state
    ///
    #[idle]
    fn idle(cx: idle::Context) -> ! {
        loop {
            cortex_m::asm::nop();
        }
    }

    ///
    /// Show activity using the status LEDs
    ///
    #[task(local = [stat1])]
    fn status_task(cx: status_task::Context) {
        cx.local.stat1.toggle().unwrap();
        status_task::spawn_after(500.millis()).unwrap();
    }
}
```

This sets up a RTIC application using the PAC from the icarus board support package. What is cool is I could swap the MCU type for something completely different (but still ARM based) and everything would still work.

This application is setup simply to toggle the STAT1 LED at 500ms intervals.

Hardware tasks can be bound to interrupt handlers.


**defmt**

I figured setting up logging sooner rather then later would be better as it can be a significant help with debugging. `defmt` is an efficient logging framework for embedded Rust applications. Though its typical examples have it logging through a debugger probe. I'd like it to log over a serial port (This will probably be over USB in the future).

[defmt-bbq](https://github.com/jamesmunns/defmt-bbq) is a relatively new library for forwarding defmt frames into a global buffer. It provides a consumer that can be used to get the data from the defmt encoder.

```rust
#[rtic::app(device = icarus::hal::pac, peripherals = true, dispatchers = [EXTI3, EXTI4])]
mod app {
    // ...

    use icarus::{
        prelude::*,
        hal::{
            block,
            Toggle,
        },
        types::{PinStat1, Serial2},
    };

    #[local]
    struct Local {
        logger: defmt_bbq::Consumer,

        stat1: PinStat1,

        serial2: Serial2,
    }

    #[init]
    fn init(cx: init::Context) -> (Shared, Local, init::Monotonics) {
        // Setup defmt logging
        let logger = defmt_bbq::init().unwrap();

        let systick = cx.core.SYST;
        let mono = Systick::new(systick, 8_000_000);

        // Initialize hardware
        let hw = Icarus::new(cx.device).unwrap();

        // LED indicators
        let stat1 = hw.stat1;

        // Serial 2 used as logger port
        let serial2 = hw.usart2;

        // Spawn tasks
        status_task::spawn().unwrap();

        (
            Shared {},
            Local{
                logger,
                stat1,
                serial2,
            },
            init::Monotonics(mono)
        )
    }

    ///
    /// Spawn tasks to handle incoming data and system state
    ///
    #[idle(local = [logger, serial2])]
    fn idle(cx: idle::Context) -> ! {
        loop {
            // Write logs to serial port 2
            if let Ok(grant) = cx.local.logger.read() {
                for byte in grant.buf() {
                    block!(cx.local.serial2.write(*byte)).unwrap();
                }

                let glen = grant.len();
                grant.release(glen);
            }
        }
    }

    ///
    /// Show activity using the status LEDs
    ///
    #[task(local = [stat1])]
    fn status_task(cx: status_task::Context) {
        defmt::println!("hello!");
        cx.local.stat1.toggle().unwrap();
        status_task::spawn_after(500.millis()).unwrap();
    }
}
```

What makes `defmt` efficient is that it actually does the formatting of a log message on the host system. The format strings are store in the ELF file and need to be loaded by a program and used to decode the serial stream.

The code is used for this is almost an exact copy of https://github.com/knurling-rs/defmt/blob/main/print/src/main.rs with the difference being the incoming data is from the serial port.

``` rust
    let mut buf: Vec<u8> = vec![0; READ_BUF_SIZE];
    let mut stream_decoder = table.new_stream_decoder();

    loop {
        // Check if the user attempted to exit the program
        let exit = rx.try_recv();
        if exit.is_ok() {
            break;
        }

        match ser.read(buf.as_mut_slice()) {
            Ok(n) => {
                stream_decoder.received(&buf[..n]);

                match stream_decoder.decode() {
                    Ok(frame) => forward_to_logger(&frame, location_info(&locs, &frame, &current_dir)),
                    Err(DecodeError::UnexpectedEof) => break,
                    Err(DecodeError::Malformed) => match table.encoding().can_recover() {
                        false => return Err(DecodeError::Malformed.into()),
                        true => {
                            eprintln!("Frame Malformed, recoverable");
                            continue;
                        }
                    }
                }
            },
            Err(ref e) if e.kind() == io::ErrorKind::TimedOut => (),
            Err(e) => bail!("{:?}", e),
        }
    }
```

The log command requires the path to the elf file to be specified:

```bash
icarus-cli --port <port> log ./target/thumbv7em-none-eabihf/release/icarus-app
```

Though this could be found automatically, or built directly into the binary.


Next steps:

* Remote commands
* IMU state
