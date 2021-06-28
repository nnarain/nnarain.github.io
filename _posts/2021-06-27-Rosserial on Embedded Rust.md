---
layout: post
title: Rosserial on Embedded Rust
tag: ['rust', 'rosserial', 'ros', 'embedded']
repo_url: https://github.com/nnarain/rosserial-rs
---

A few months back we had a hackday at work, where we got the opportunity to work on something of interest to us.

[Rosserial](https://wiki.ros.org/rosserial) is a protocol used for connecting embedded devices to ROS. We run rosserial on several of the microcontrollers in our robots.

I figured that if we ever did want to run Rust on our boards we'd need rosserial integration. So here is [rosserial-rs](https://github.com/nnarain/rosserial-rs) a very incomplete `no_std` Rust crate for running rosserial on embedded Rust.

At the moment there is no ROS message code generation so the only working message type is `std_msgs/Bool`, for which I manual wrote the serialization and deserialization code.

**Environment Setup**

I'm using the exact same stm32 discovery kit as the [Embedded Rust Book](https://docs.rust-embedded.org/book/) so the project setup is identical.

The `rosserial` crate exists in the same repo as the stm32discovery project I created and is added as a dependency to `Cargo.toml` using the relative path:

```
[dependencies]
rosserial = {path="../rosserial"}
...
```

**Asynchronous Serial**

The idea is to asynchronously receive UART data from the serial port, queue it in a ring buffer, verify and decode that data into a ROS message and then fire a callback to handle it.

To handle the asynchronous data I chose to use the real-time concurrency framework [RTIC](https://rtic.rs/0.5/book/en/).

Serial port setup:

```rust
// Simple ring buffer
pub struct Buffer {
    buffer: [u8; RX_SZ],
    write_idx: usize,
    read_idx: usize,
}

impl Buffer {
    const fn new() -> Buffer {
        Buffer {
            buffer: [0; RX_SZ],
            write_idx: 0,
            read_idx: 0,
        }
    }

    pub fn push(&mut self, data: u8) {
        self.buffer[self.write_idx] = data;
        self.write_idx = (self.write_idx + 1) % RX_SZ;
    }

    pub fn read(&mut self) -> Option<u8> {
        if self.write_idx != self.read_idx {
            let data = self.buffer[self.read_idx];
            self.read_idx = (self.read_idx + 1) % RX_SZ;

            Some(data)
        }
        else {
            None
        }
    }
}

// Handle incoming serial data
pub struct SerialRx {
    rx: Rx<stm32f3xx_hal::pac::USART1>,
    buf: Buffer,
}

impl SerialRx {
    pub fn new(rx: Rx<stm32f3xx_hal::pac::USART1>) -> Self {
        SerialRx {
            rx,
            buf: Buffer::new(),
        }
    }

    pub fn update(&mut self) {
        // Read the serial data from the RX object and place into the buffer
        if let Ok(data) = self.rx.read() {
            self.buf.push(data);
        }
    }

    // Read the serial data from the buffer.
    pub fn read(&mut self) -> Option<u8> {
        self.buf.read()
    }
}

// Handle synchronously writing data back to the host machine
pub struct SerialTx {
    tx: Tx<stm32f3xx_hal::pac::USART1>,
}

impl SerialTx {
    pub fn new(tx: Tx<stm32f3xx_hal::pac::USART1>) -> Self {
        SerialTx {
            tx,
        }
    }

    pub fn write(&mut self, data: u8) {
        block!(self.tx.write(data)).ok();
    }
}

pub struct Hardware {
    rx: SerialRx,
    tx: SerialTx,
    led1: Led,      // Debug LED 1
}

impl Hardware {
    pub fn initialize(device: Peripherals) -> Self {
        let mut flash = device.FLASH.constrain();
        let mut rcc = device.RCC.constrain();

        let clocks = rcc.cfgr.freeze(&mut flash.acr);

        // Setup USART1
        let mut gpioc = device.GPIOC.split(&mut rcc.ahb);

        let tx = gpioc.pc4.into_af7(&mut gpioc.moder, &mut gpioc.afrl);
        let rx = gpioc.pc5.into_af7(&mut gpioc.moder, &mut gpioc.afrl);

        let mut serial = Serial::usart1(device.USART1, (tx, rx), 115_200.bps(), clocks, &mut rcc.apb2);

        // Enable RX interrupt
        serial.listen(stm32f3xx_hal::serial::Event::Rxne);

        let (tx, rx) = serial.split();

        // debug led
        let mut gpioe = device.GPIOE.split(&mut rcc.ahb);
        let mut led1 = gpioe.pe9
            .into_push_pull_output(&mut gpioe.moder, &mut gpioe.otyper)
            .downgrade()
            .into_active_high_switch();


        led1.off().ok();

        Hardware {
            rx: SerialRx::new(rx),
            tx: SerialTx::new(tx),
            led1,
        }
    }

    pub fn split(self) -> (SerialRx, SerialTx, Led) {
        (self.rx, self.tx, self.led1)
    }
}

```

The `SerialRX`, `SerialTx` and `Led` components are used as shared resources in the RTIC framework.

```rust
#[app(device = stm32f3xx_hal::pac, peripherals = true, monotonic = rtic::cyccnt::CYCCNT)]
const APP: () = {
    struct Resources {
        rx: SerialRx,
        tx: SerialTx,
        led: Led,
    }

// ...
};
```

When the `USART1` interrupt fires the serial rx object is updated.

```rust
    // Interrupt handler for serial receive, needs to be high priority or the receive buffer overruns
    #[task(binds=USART1_EXTI25, priority = 2, resources=[rx])]
    fn USART1(cx: USART1::Context) {
        cx.resources.rx.update();
    }
```

**Implementing Rosserial**

I more or less ported the original rosserial C++ code to Rust. Use a state machine to process each byte and decode the ROS message.

```rust
enum State {
    Sync,
    ProtocolVersion,
    SizeLsb,
    SizeMsb,
    SizeChecksum,
    TopicIdLsb,
    TopicIdMsb,
    Message,
    MessageChecksum
}

// const PROTOCOL_VER1: u8 = 0xFF;
const PROTOCOL_VER2: u8 = 0xFE;

const MESSAGE_BUFFER_SIZE: usize = 1024;
const MAX_PUB_SUBS: usize = 256;


pub struct NodeHandle<'a> {
    state: State,
    message_in: [u8; MESSAGE_BUFFER_SIZE],
    index: usize,
    bytes: u16,
    topic: u16,
    checksum: u16,
    configured: bool,

    publishers: [Option<Publisher>; MAX_PUB_SUBS],
    subscribers: [Option<&'a mut dyn MessageHandler>; MAX_PUB_SUBS],
    subscriber_info: [Option<rosserial_msgs::TopicInfo>; MAX_PUB_SUBS],
}


    pub fn spin_once(&mut self, hardware: &mut dyn HardwareInterface) {
        let data = hardware.read();

        if let Some(data) = data {
            match self.state {
                State::Sync => {
                    if data == 0xFF {
                        self.state = State::ProtocolVersion;
                    }
                },
                State::ProtocolVersion => {
                    self.state = if data == PROTOCOL_VER2 {
                        State::SizeLsb
                    }
                    else {
                        State::Sync
                    };
                },
                State::SizeLsb => {
                    self.bytes = data as u16;
                    self.index = 0;
                    self.checksum = data as u16; // first byte to calculate checksum
                    self.state = State::SizeMsb;
                },
                State::SizeMsb => {
                    self.bytes |= (data as u16) << 8;
                    self.state = State::SizeChecksum;
                },
                State::SizeChecksum => {
                    // Message Length Checksum = 255 - ((Message Length High Byte + Message Length Low Byte) % 256 )
                    state = if checksum % 256 == 255 {
                        State::TopicIdLsb
                    }
                    else {
                        State::Sync
                    };
                    self.state = State::TopicIdLsb;
                },
                State::TopicIdLsb => {
                    self.topic = data as u16;
                    self.checksum = data as u16;
                    self.state = State::TopicIdMsb;
                },
                State::TopicIdMsb => {
                    self.topic |= (data as u16) << 8;
                    self.state = if self.bytes == 0 { State::MessageChecksum } else { State::Message };
                },
                State::Message => {
                    self.message_in[self.index] = data;
                    self.index += 1;
                    self.bytes -= 1;

                    if self.bytes == 0 {
                        self.state = State::MessageChecksum;
                    }
                },
                State::MessageChecksum => {
                    // TODO: checksum

                    if self.topic == rosserial_msgs::TOPICINFO_ID_PUBLISHER {
                        self.request_sync_time(hardware);
                        self.negotiate_topics(hardware);

                        self.configured = true;
                    }
                    else if self.topic == rosserial_msgs::TOPICINFO_ID_TIME {
                        // TODO: sync time
                    }
                    else if self.topic == rosserial_msgs::TOPICINFO_ID_TX_STOP {
                        self.configured = false;
                    }
                    else {
                        let idx = self.topic - 100;
                        if (idx as usize) < self.subscribers.len() {
                            if let Some(ref mut sub) = self.subscribers[idx as usize] {
                                sub.handle_message(&self.message_in[..]);
                            }
                        }
                    }

                    self.state = State::Sync;
                },
            }
        }
    }
```

Publishers and Subscriber and handled by filling the next available slot. Subscribers are stored as `MessageHandler` trait objects so any callback can be used.

```rust
pub trait MessageHandler {
    fn handle_message(&mut self, data: &[u8]);
}
```

```rust
impl<'a> NodeHandle<'a> {
    pub fn advertise<Msg: Message>(&mut self, topic: &'static str) -> Result<PublisherHandle, NodeHandleError> {
        // Find the next available slot
        let slot = self.publishers.iter_mut().filter(|item| item.is_none()).enumerate().next();

        if let Some((i, slot)) = slot {
            let handle = i;
            *slot = Some(Publisher::new(topic, (i + 100) as u16, Msg::name(), Msg::md5()));
            Ok(handle)
        }
        else {
            Err(NodeHandleError::MaxPublishersReached)
        }
    }

    pub fn register_subscriber<Sub: MessageHandler + TopicBase, Msg: Message>(&mut self, sub: &'a mut Sub) {
        let slot = self.subscribers.iter_mut().filter(|item| item.is_none()).enumerate().next();
        if let Some((i, slot)) = slot {
            // Info for this topic
            let mut ti = rosserial_msgs::TopicInfo::default();
            ti.id = (i as u16) + 100;
            ti.name = sub.topic();
            ti.message_type = sub.message_type();
            ti.md5 = sub.md5sum();
            ti.buffer_size = 256;

            self.subscriber_info[i] = Some(ti);

            *slot = Some(sub);

        }
    }

```

Sending data to the host system is done by filling a serial buffer and doing a synchronous write

```rust
    fn send_message(&self, topic_id: u16, msg: &dyn Message, hardware: &mut dyn HardwareInterface) {
        let mut message_out: [u8; 256] = [0; 256];

        let len = msg.serialize(&mut message_out[7..]);

        // Populate serial data for the rosserial protocol
        message_out[0] = 0xFF;
        message_out[1] = PROTOCOL_VER2;
        message_out[2] = (len & 0xFF) as u8;
        message_out[3] = ((len >> 8) & 0xFF) as u8;
        message_out[4] = 255 - ((message_out[2] as u16 + message_out[3] as u16) % 256) as u8;
        message_out[5] = (topic_id & 0xFF) as u8;
        message_out[6] = ((topic_id >> 8) & 0xFF) as u8;

        let last = 7 + len as usize;
        let mut checksum: u32 = 0;
        for b in &message_out[5..last] {
            checksum += *b as u32;
        }
        message_out[last] = (255 - (checksum as u16 % 256)) as u8;

        for data in &message_out[..last+1] {
            hardware.write(*data);
        }
    }
```

At the top level, I used a `spin` task to call `spin_once` on the NodeHandle and setup publishers and subscribers.

```rust
    #[task(resources = [rx, tx, led])]
    fn spin(mut cx: spin::Context) {
        let mut last_sync = Instant::now();
        let mut last_pub = Instant::now();

        let mut nodehandle = NodeHandle::default();

        // A command queue for controlling the LED
        let mut led_cmd_queue: Queue<bool, U235, _> = Queue::u8();
        let (mut cmd_in, mut cmd_out) = led_cmd_queue.split();

        // Create a subscriber to "/led_cmd" topic.
        let mut bool_sub = Subscriber::new("led_cmd", move |msg: std_msgs::Bool| {
            // Queue the command
            cmd_in.enqueue(msg.data).unwrap();
        });

        // Advertise a std_msgs/Bool message on "/test"
        let test_pub = nodehandle.advertise::<std_msgs::Bool>("test").unwrap();
        // Register the subscriber with the node handle
        nodehandle.register_subscriber::<_, std_msgs::Bool>(&mut bool_sub);

        loop {
            let current_time = Instant::now();

            let rx_data = cx.resources.rx.lock(|rx| {
                rx.read()
            });

            // This is used to pass the hardware interface to the node handle
            let mut spin_data = SpinInstance::new(&mut cx.resources.tx, rx_data);
            nodehandle.spin_once(&mut spin_data);

            // Send sync time requests to the host
            if current_time > last_sync + 5_000_000.cycles() {
                nodehandle.request_sync_time(&mut spin_data);
                last_sync = current_time;
            }

            // Periodically publish the test message
            if current_time > last_pub + 5_000_000.cycles() {
                let mut msg = std_msgs::Bool::default();
                msg.data = true;

                nodehandle.publish(test_pub, &msg, &mut spin_data);
                last_pub = current_time;
            }

            // Process the LED commands
            if let Some(cmd) = cmd_out.dequeue() {
                if cmd {
                    cx.resources.led.on().ok();
                }
                else {
                    cx.resources.led.off().ok();
                }
            }
        }
    }
```

Once the `rosserial_server` is running the ROS topics can be interacted with over the command line.


**Future Work**

I was planning on completing this but it seems like [microROS](https://micro.ros.org/) is the future, so I'll be focusing my attention there. That said, if `rosserial-rs` might be reasonable way to use rosserial on embedded Rust for a ROS 1 host.
