---
layout: post
title: Experimenting with OpenCyphal
tag: ['cyphal', 'arduino', 'embedded']
repo: nnarain/cyphal_serial_tests
---

Recently I've been looking into using [OpenCyphal](https://opencyphal.org/) in my embedded projects.

From the website:

```
Cyphal is an open technology for real-time intravehicular distributed computing and communication based on modern networking standards (Ethernet, CAN FD, etc.). It was created to address the challenge of on-board deterministic computing and data distribution in next-generation intelligent vehicles: manned and unmanned aircraft, spacecraft, robots, and cars. 
```

Sounds fancy but why do I want to use it in my hobby projects?

Well over the years I've worked on a handful of embedded projects and I always find myself in the same place.

* I want to receive values from my micro-controller and log/plot them
* I want to send simple commands to my micro-controller for testing purposes
* Decent logging capabilities (on top of sending values to plot)

Examples of this would be doing: [drone PID tuning]({% post_url 2023-09-03-Icarus PID Tuning %}) or [sensor visualization]({% post_url 2023-02-22-Icarus Sensors and Visualization %}).

Of course to do this you need to use/make a packet protocol that works over serial, get the values then log and plot them. It's all doable but a bit tedious.

Next obvious thing to do it either reuse a protocol I've written or use an off-the-shelf solution. So here we are.

Cyphal has the following that I like:

* Pub/Sub data
* RPC/Service like inference
* "Registers" (like ROS parameter), for configuration
* Support for CAN/Serial/UDP
* Support for plotting (integration with PlotJuggler)
* Relatively simple integration

It's very ROS like, without requiring the entire ROS ecosystem to use.

# Support

As mentioned, Cyphal supports CAN, Serial and UDP. That said, it was historically a CAN based protocol so support is more easily available over CAN.

I'm actually planning to move I projects to CAN but at the moment I'm interested in the serial support.

# Integration

Test repo is [here](https://github.com/nnarain/cyphal_serial_tests)

The serial support library is located here: [serard](https://github.com/coderkalyan/libserard)

It is also recommended to use for constant time allocation: [o1heap](https://github.com/pavel-kirienko/o1heap)

Both of these are intended to be drop in support.

I'm using PlatformIO (because Arduino hates using more then one file) and placed the libraries in the `lib/` directory.


**Code Generation**

Cyphal uses `.dsdl` files to define message types. A tool called [nunavut](https://github.com/OpenCyphal/nunavut) is used to generate code for supported languages.


```bash
nnvg --target-language c --enable-serialization-asserts public_regulated_data_types/reg --lookup-dir public_regulated_data_types/uavcan
```

Note: Arduino will not like the `<>` brackets used in the include directives and those need to be modified. This is another reason I'm using PlatformIO.

The headers are places in the `include/` directory.

**Build Setup**

The libraries and headers are in place but I found, even though I was using C code gen, the compiler needed to be set to C++14.

In PlatformIO you can do this using the following in `platformio.ini`

```ini
build_unflags = -std=gnu++11
build_flags = -std=gnu++14
```

**Allocator Setup**

```c++
#include <o1heap.h>

template<size_t SIZE>
class alignas(O1HEAP_ALIGNMENT) Heap final : public std::array<uint8_t, SIZE> {};
static constexpr size_t HEAP_SIZE = 16384UL;

static Heap<HEAP_SIZE> ARENA;

static O1HeapInstance* heap{nullptr};

static void* serardAlloc(void*, size_t size)
{
  return o1heapAllocate(heap, size);
}

static void serardFree(void*, size_t, void* ptr)
{
  o1heapFree(heap, ptr);
}

static const SerardMemoryResource allocator = {
  .user_reference = nullptr,
  .deallocate = &serardFree,
  .allocate = &serardAlloc,
};

// ...

void setup() {
  // heap_base = new uint8_t[HEAP_SIZE];
  // Allocator setup for serard
  heap = o1heapInit(ARENA.data(), HEAP_SIZE);

}
```

* Setup the heap space for the `o1heap` library.
* Setup allocator function and allocator object

**Serard Setup**


```c++
#include <serard.h>

// ...

static Serard serard;

// ...

void setup() {
  // Initialize serard
  serard = serardInit(allocator, allocator);
}
```

* Initial the main Serard class

**Serial TX**

```c++
#include <uavcan/node/Heartbeat_1_0.h>

// ...
static const SerardNodeID NODE_ID = 5;
static uint32_t last_heartbeat = 0;
// ...

static bool serialEmitter(void* const, uint8_t size, const uint8_t* data)
{
  Serial.write(reinterpret_cast<const char*>(data), size);
  return true;
}

void loop() {
  const auto now = millis();
  if (now - last_heartbeat > HEARTBEAT_PERIOD)
  {
    const uavcan_node_Health_1_0 health = {
        .value = uavcan_node_Health_1_0_NOMINAL,
    };
    const uavcan_node_Mode_1_0 mode = {
        .value = uavcan_node_Mode_1_0_OPERATIONAL,
    };
    const uavcan_node_Heartbeat_1_0 heartbeat = {
        .uptime = now,
        .health = health,
        .mode = mode,
        .vendor_specific_status_code = 0,
    };

    uint8_t buf[uavcan_node_Heartbeat_1_0_SERIALIZATION_BUFFER_SIZE_BYTES_];
    size_t buf_size = uavcan_node_Heartbeat_1_0_SERIALIZATION_BUFFER_SIZE_BYTES_;

    uavcan_node_Heartbeat_1_0_serialize_(&heartbeat, buf, &buf_size);
    const SerardTransferMetadata metadata = {
      .priority = SerardPriorityNominal,
      .transfer_kind = SerardTransferKindMessage,
      .port_id = uavcan_node_Heartbeat_1_0_FIXED_PORT_ID_,
      .remote_node_id = NODE_ID,
    };
    serardTxPush(&serard, &metadata, buf_size, buf, nullptr, &serialEmitter);
  }
}

```

Cyphal requires that each node publish a heartbeat. 

* Defined the health, mode and operational state.
* Serialize the message into a buffer
* Queue the payload, serard will pass the encoded buffer to the `serialEmitter` function

**Serial Receiving**

```c++
#include <uavcan/primitive/scalar/Bit_1_0.h>

// ...
static SerardReassembler reassembler;
// ...

static void onReceive(const SerardRxTransfer* const transfer)
{
  const SerardTransferMetadata* const metadata = &transfer->metadata;

  uavcan_primitive_scalar_Bit_1_0 bit;
  size_t size = transfer->payload_size;
  uavcan_primitive_scalar_Bit_1_0_deserialize_(&bit, reinterpret_cast<const uint8_t*>(transfer->payload), &size);
  serardFree(nullptr, transfer->payload_extent, transfer->payload);

  cmdCallback(bit);
}

static void cmdCallback(const uavcan_primitive_scalar_Bit_1_0& msg)
{
  if (msg.value)
  {
    digitalWrite(LED_BUILTIN, HIGH);
  }
  else
  {
    digitalWrite(LED_BUILTIN, LOW);
  }
}

void loop() {
  // ...
  // Handle incoming data
  uint8_t buf[256];
  SerardRxTransfer transfer;
  SerardRxSubscription* sub{nullptr};

  size_t payload_size = Serial.readBytes(reinterpret_cast<char*>(buf), 256);


  if (serardRxAccept(&serard, &reassembler, micros(), &payload_size, buf, &transfer, &sub)) {
    onReceive(&transfer);
  }
}
```

The reassembler is needed to hold the state of the deserialization since serial packets are arbitrary size.

The above sets up a node with heartbeat that can receive a command bit to turn on the LED

# Command line tools

Monitor the node:

```bash
yakut --transport "Serial('COM7',None,baudrate=115200)" monitor
```

Send a command:

```bash
yakut --transport "Serial('COM7',None,baudrate=115200)" pub 1620:uavcan.primitive.scalar.Bit 'true' -N 2
```
