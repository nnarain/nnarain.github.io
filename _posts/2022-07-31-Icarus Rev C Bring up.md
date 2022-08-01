---
layout: post
title: Icarus Rev C Bring up
tag: ['rust', 'embedded', 'flight-controller']
repo: nnarain/icarus-firmware
---

In my [previous post]({% post_url 2022-07-31-Icarus Rev C Bring up %}) I showed my new revision of Icarus. In this post I'll be going over the basic firmware bring up.

# ESP32-C3 Firmware

The MCU of the controller is an ESP32-C3. The Espressif team has two flavours of HALs to used for this module: A bare metal HAL and a HAL that links to the original Espressif C SDK.

The bare metal HAL is still under active development so I've been developing against the `esp-idf-hal`. Though the goal is to right the code generically enough that I can switch over to the bare metal firmware eventually.

The neat thing about the `esp-idf-hal` is that the firmware runs in an `std` environment, so it can be written like a normal Rust program. For example the `anyhow` crate can be used to handle errors:

```rust
fn main() -> anyhow::Result<()> {

    Ok(())
}
```

My main focus on the initial firmware bring up is testing the motor IO and confirming IMU data can be read. I also want to ensure I have a way to log IMU data to later create plot for debugging PID control.

# Motor IO

I did the motor IO using bare metal firmware and it was just some simple toggles to confirm the half-bridge motor configuration worked.

```rust
#![no_std]
#![no_main]

use panic_halt as _;

use riscv_rt::entry;

use icarus::{prelude::*, Icarus};

#[entry]
fn main() -> ! {
    let hw = Icarus::take().unwrap();

    let mut drv1_en = hw.drv1_en;
    let mut drv2_en = hw.drv2_en;

    let mut rtrctl1 = hw.rtrctl1;
    let mut rtrctl2 = hw.rtrctl2;
    let mut rtrctl3 = hw.rtrctl3;
    let mut rtrctl4 = hw.rtrctl4;

    let mut delay = hw.delay;

    drv1_en.set_high().unwrap();
    drv2_en.set_high().unwrap();

    loop {
        rtrctl1.toggle().unwrap();
        rtrctl2.toggle().unwrap();
        rtrctl3.toggle().unwrap();
        rtrctl4.toggle().unwrap();

        delay.delay_ms(1000u32);
    }
}
```

In the `esp-idf-hal` the peripheral setup is slightly different (though stills implements embedded-hal traits). Below I've linked the GPIO to the LEDC (PWM) peripheral.

```rust
    let _drv1_en = p.pins.gpio10.into_output()?;
    let _drv2_en = p.pins.gpio6.into_output()?;

    let config = config::TimerConfig::default().frequency(50.Hz().into());
    let timer = Arc::new(Timer::new(p.ledc.timer0, &config)?);

    let _rtrctl1 = Channel::new(p.ledc.channel0, timer.clone(), p.pins.gpio8)?;
    let _rtrctl2 = Channel::new(p.ledc.channel1, timer.clone(), p.pins.gpio7)?;
    let _rtrctl3 = Channel::new(p.ledc.channel2, timer.clone(), p.pins.gpio5)?;
    let _rtrctl4 = Channel::new(p.ledc.channel3, timer.clone(), p.pins.gpio4)?;
```

Though I've not got to the motor mixer phase yet.

# Stat LED

To provide easy runtime state reporting I'm using a single `WS2812B` (neopixel) as a status LED.

Bare metal example:

```rust
#![no_std]
#![no_main]

use panic_halt as _;

use riscv_rt::entry;

use icarus::{
    prelude::*,
    smart_leds::{
        brightness, gamma,
        hsv::{hsv2rgb, Hsv},
        SmartLedsWrite,
    },
    Icarus,
};

#[entry]
fn main() -> ! {
    let hw = Icarus::take().unwrap();
    let mut led = hw.stat;
    let mut delay = hw.delay;

    let mut color = Hsv {
        hue: 0,
        sat: 255,
        val: 255,
    };
    let mut data;

    loop {
        for hue in 0..=255 {
            color.hue = hue;
            data = [hsv2rgb(color)];

            led.write(brightness(gamma(data.iter().cloned()), 10))
                .unwrap();

            delay.delay_ms(20u8);
        }
    }
}
```

The bare-metal HAL provides a `smartled` adaptor but the `esp-idf-hal` does not. I more or less copied `smartled` adaptor code into my project. It uses the RMT (remote control) peripheral to control the LED. This peripheral can write an arbitrary waveform to the specified pin.

The core of the logic to generic the waveform is here. Effectively it copies the bit pattern representing the color data into a series of pulse that is written to the peripheral.

```rust
...

    pub fn update(&mut self, c: StatColor) -> Result<(), EspError> {
        let rgb: u32 = c.into();

        let ticks_hz = self.tx.counter_clock()?;
        let t0h = Pulse::new_with_duration(ticks_hz, PinState::High, &ns(350))?;
        let t0l = Pulse::new_with_duration(ticks_hz, PinState::Low, &ns(800))?;
        let t1h = Pulse::new_with_duration(ticks_hz, PinState::High, &ns(700))?;
        let t1l = Pulse::new_with_duration(ticks_hz, PinState::Low, &ns(600))?;

        let mut signal = FixedLengthSignal::<24>::new();

        for i in 0..24 {
            let bit = 2_u32.pow(i) & rgb != 0;
            let (high_pulse, low_pulse) = if bit { (t1h, t1l) } else { (t0h, t0l) };
            signal.set(i as usize, &(high_pulse, low_pulse))?;
        }

        self.tx.start_blocking(&signal)?;

        // Ets.delay_ms(ms)

        Ok(())
    }

...
```

Used:

```rust
let mut stat_led = StatLed::new(p.pins.gpio21, p.rmt.channel0)?;
stat_led.update(StatColor::Green).unwrap();
```

# Tasks

Quick note on tasks. They are created using `std::thread::spawn`. In a normal Rust program one might use `std::sync::mpsc::channel` for inter-thread communication, however I have no idea how these allocate memory under the hood. I've opted to use `heapless` queues instead (which have fixed sizes).

For example to transmit sensor data from the control task I setup queues like the following:

```rust
    static mut STATE_QUEUE: Queue<IcarusState, 4> = Queue::new();
    let (mut state_tx, mut state_rx) = unsafe { STATE_QUEUE.split() };
```



# Sensors

```rust
    // Sensors
    let sda = p.pins.gpio1;
    let scl = p.pins.gpio2;

    let i2c_config = <i2c::config::MasterConfig as Default>::default().baudrate(400.kHz().into());
    let i2c =
        i2c::Master::<i2c::I2C0, _, _>::new(p.i2c0, i2c::MasterPins { sda, scl }, i2c_config)?;

    let mut delay = FreeRtos {};

    let mut imu = Mpu6050::new_with_addr(i2c, 0x68);
```

Icarus has two onboard sensors: An IMU (gyro / accel) and a barometer. I'm only focusing on the IMU for now, but eventually the barometer data can be fused to the vertical accelerometer data.

IMU data typically needs to be calibrated to remove the inherent bias in the sensor readings that exist due to the manufacturing process.

IMU Calibration:

```rust
// Sample accelerometer and gyro data and calculate the device specific offset
fn calibrate_imu<F>(samples: usize, delay_ms: u64, mut f: F) -> ImuCalibrationOffset
where
    F: FnMut() -> ((f32, f32, f32), (f32, f32, f32)),
{
    let (a, g) = f();

    // Min / Max values for each axis on the accelerometer and the gyro
    let mut ax_min: f32 = a.0;
    let mut ax_max: f32 = a.0;
    let mut ay_min: f32 = a.1;
    let mut ay_max: f32 = a.1;
    let mut az_min: f32 = a.2;
    let mut az_max: f32 = a.2;
    let mut gx_min: f32 = g.0;
    let mut gx_max: f32 = g.0;
    let mut gy_min: f32 = g.1;
    let mut gy_max: f32 = g.1;
    let mut gz_min: f32 = g.2;
    let mut gz_max: f32 = g.2;

    for _ in 0..samples {
        let (a, g) = f();

        ax_min = ax_min.min(a.0);
        ax_max = ax_max.max(a.0);
        ay_min = ay_min.min(a.1);
        ay_max = ay_max.max(a.1);
        az_min = az_min.min(a.2);
        az_max = az_max.max(a.2);

        gx_min = gx_min.min(g.0);
        gx_max = gx_max.max(g.0);
        gy_min = gy_min.min(g.1);
        gy_max = gy_max.max(g.1);
        gz_min = gz_min.min(g.2);
        gz_max = gz_max.max(g.2);

        thread::sleep(Duration::from_millis(delay_ms))
    }

    ImuCalibrationOffset {
        ax_offset: (ax_max - ax_min) / 2.0 + ax_min,
        ay_offset: (ay_max - ay_min) / 2.0 + ay_min,
        az_offset: (az_max - az_min) / 2.0 + az_min,
        gx_offset: (gx_max - gx_min) / 2.0 + gx_min,
        gy_offset: (gy_max - gy_min) / 2.0 + gy_min,
        gz_offset: (gz_max - gz_min) / 2.0 + gz_min,
    }
}
```

I'm not too familiar with different IMU calibration techniques. This method calculates the bias from the specified number of samples. The bias is subtracted from the IMU readings before use.

# Wireless Communication

I'll probably go over sensor reporting in more detail later. Next up: Communication with the host.

I'm currently using WiFi, but eventually wireless communication will be Bluetooth LE.

## Wire Protocol

I need a way to easily send data between the controller and the host. I'm using a crate called `postcard`. It uses `serde` to serialize and deserialize structs to and from byte buffers. It also supports COBS encoding which is a method of packet framing in a data stream.

I have a common crate called `icarus_wire` that contains structs for data sent and received by the controller.

```rust
// lib.rs

pub use postcard::{
    to_slice_cobs as encode,
    take_from_bytes_cobs as decode,
    to_vec_cobs as decode_vec,
    accumulator::{CobsAccumulator, FeedResult},
};

/// Data reporting channels for Icarus
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum IcarusState {
    Sensors(EstimatorInput),
    EstimatedState(EstimatedState),
    Battery(BatteryState),
}

/// Icarus command channels
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum IcarusCommand {
    Throttle(i8, i8, i8),
}
```

Each enum field is considered a "channel" for communication.

## Connecting to WiFi

This is pretty straight forward as it's handled entirely my the Espressif SDK.

```rust
/// WiFi Network Stack
pub struct AppWifi {
    wifi: Box<EspWifi>,
}

impl AppWifi {
    pub fn new() -> Result<Self> {

        let netif_stack = Arc::new(EspNetifStack::new()?);
        let sys_loop_stack = Arc::new(EspSysLoopStack::new()?);
        let default_nvs = Arc::new(EspDefaultNvs::new()?);

        let wifi = Box::new(
            EspWifi::new(netif_stack.clone(), sys_loop_stack.clone(), default_nvs.clone())?
        );

        Ok(Self {
            wifi,
        })
    }

    pub fn connect(&mut self, ssid: &str, pass: &str) -> Result<()> {
        let ap_infos = self.wifi.scan()?;
        let ours = ap_infos.into_iter().find(|ap| ap.ssid == ssid);

        let channel = ours.map(|ours| ours.channel);

        let config = ClientConfiguration {
            ssid: ssid.into(),
            password: pass.into(),
            channel,
            ..Default::default()
        };

        self.wifi.set_configuration(&Configuration::Client(config))?;

        Ok(())

    }
}
```

SSID and pass and current specified as environment variables. Eventually this will be done through a serial console.

## Sockets

Since the firmware environment is like a normal Rust program, regular TCP listeners can be used for communication. I've setup the controller is a TCP server that waits for new connections.

```rust
    // Spawn wireless communication task
    thread::spawn(move || {
        loop {
            if wireless_connected_read2.load(Ordering::Relaxed) {
                let listener = TcpListener::bind("0.0.0.0:5000").unwrap();
                match listener.accept() {
                    Ok((stream, _)) => {
                        // Configure the stream to be non-blocking
                        stream.set_nonblocking(true).ok();
                        stream.set_read_timeout(Some(Duration::from_millis(10))).ok();

                        stream_tx.enqueue(stream).ok();
                    },
                    Err(_) => {},
                }
            }

            thread::sleep(Duration::from_millis(10));
        }
    });
```

The stream is passed to the IDLE task to be used to communicate with the host.

In the IDLE task, get the stream:

```rust
        // Attempt to get the connected stream
        if let Some(s) = stream_rx.dequeue() {
            stream = Some(s)
        }

        ...

        // Write latest sensor state to the host
        if let Some(ref mut stream) = stream {
            while let Some(state) = state_rx.dequeue() {
                if let Ok(used) = icarus_wire::encode(&state, &mut raw_buf) {
                    stream.write_all(used).ok();
                }
            }
        }
```

If there is an active stream is can be used to report sensor data (or other state) to the host.

## Receiving data from the host

I've written a command line tool for interacting with the controller. Since this application is IO bound, I've written it as an `async` program using `tokio` executor.

```rust
async fn recv_task(ip_addr: String, sender: Sender<IcarusState>) -> anyhow::Result<()> {
    let stream = TcpStream::connect(ip_addr).await?;

    let mut raw_buf: [u8; 1024] = [0; 1024];
    let mut cobs_buf: CobsAccumulator<256> = CobsAccumulator::new();

    loop {
        stream.readable().await?;

        match stream.try_read(&mut raw_buf) {
            Ok(0) => break,
            Ok(n) => {
                let mut window = &raw_buf[..n];
                'cobs: while !window.is_empty() {
                    window = match cobs_buf.feed::<IcarusState>(window) {
                        FeedResult::Consumed => break 'cobs,
                        FeedResult::OverFull(new_window) => new_window,
                        FeedResult::DeserError(new_window) => new_window,
                        FeedResult::Success { data, remaining } => {
                            sender.send(data).await?;

                            remaining
                        }
                    }
                }
            },
            Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => continue,
            Err(e) => return Err(e.into()),
        }
    }
    Ok(())
}
```

This is an async task for decoding state messages from the controller. It uses a COBS accumulator from the `postcard` library to decode the data stream. The received states are sent out using the `Sender` end of a channel to the rest of the program.

# What's Next?

Ok so that was a quick and dirty post on where the firmware is at with Icarus.

In summary:

* Tested motor IO
* Tested status LED
* Tested sensor reading
* Basic task setup with queues for message passing
* Wireless communication setup
* Reporting sensor data over wireless comms

At this point I probably need to start designing the frame and building a little enclosure for flight tests.
