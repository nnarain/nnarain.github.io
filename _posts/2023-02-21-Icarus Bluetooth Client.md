---
layout: post
title: Icarus Bluetooth Client
tag: ['flight-controller', 'ble', 'arduino', 'rust', 'embedded', 'esp32-c3', 'esp32', 'bluetooth']
repo: nnarain/icarus-firmware
---

The [Rev C]({% post_url 2022-07-16-Icarus Rev C %}) design of Icarus uses an ESP32-C3 MCU which supports Bluetooth. I chose Bluetooth as I thought it would make a decent option for a primarily indoor drone application. It also helps with sending sensor and log data back wirelessly for debugging.

In this post I'll be covering setting up the BLE server on the micro controller and sending sensor data over Bluetooth.

**Changes to Firmware**

While the basic support for Rust on the ESP32-C3 is available, I could not find a well supported Bluetooth LE stack for `no_std` embedded Rust or a Bluetooth library binding for the `esp-idf-hal` flavour of embedded Rust.

There are some in-progress libraries, attempts and unmaintained projects but nothing concrete. I'd very much like to contribute to some of these projects in the future but for the sake of getting things rolling, I've decided to just rewrite the firmware in C++ using PlatformIO.

Unfortunate but I can always go back and re-write it.

**General Firmware Setup**

Each module is a separate PlatformIO library. There is also a common include for the board pinout.

```c++
#pragma once

#include <Arduino.h>

// Generic IO Pins
#define ICARUS_IO1 GPIO_NUM_3
#define ICARUS_IO2 GPIO_NUM_10
#define ICARUS_IO3 GPIO_NUM_4
#define ICARUS_IO4 GPIO_NUM_5
#define ICARUS_IO5 GPIO_NUM_6
#define ICARUS_IO6 GPIO_NUM_7

// STAT LED
#define ICARUS_STAT_LED GPIO_NUM_0

// Button
#define ICARUS_USER_BUTTON GPIO_NUM_9

// I2C
#define ICARUS_I2C_SDA GPIO_NUM_1
#define ICARUS_I2C_SCL GPIO_NUM_2
```

The IO Mux feature of the ESP32-C3 is quite nice as pretty much any pin can be attached to any peripheral.

**Collecting Sensor Data**

First, lets get some meaningful data to send over bluetooth by collecting the attitude data from the IMU.

The `Sensors` class will be responsible for collecting sensor data and doing sensor fusion.

The IMU on this board is an MPU6050.

```c++
class Sensors
{
public:
    Sensors() = default;
    ~Sensors() = default;

    bool begin(uint8_t scl, uint8_t sda);
    void update();

    attitude_t getAttitude();
private:
    MPU6050 mpu;
};
```

When the sensor module is initialized, it must set the TwoWire interface pins, initialize the IMU driver and calibrate the IMU.

```c++
// IMU Address
#define MPU_ADDRESS 0x68

bool Sensors::begin(uint8_t scl, uint8_t sda)
{
    const auto wire_ok = Wire.setPins(sda, scl) && Wire.begin();

    if (!wire_ok)
    {
        Serial.println("Failed to initialize Wire protocol");
    }

    mpu.setDeviceAddress(MPU_ADDRESS);

    const auto mpu_ok = mpu.begin();

    if (!mpu_ok)
    {
        Serial.println("Failed to initialize MPU");
    }
    else
    {
        mpu.calibrate();
    }

    return wire_ok && mpu_ok;
}

void Sensors::update()
{
    mpu.update();
}

attitude_t Sensors::getAttitude()
{
    return mpu.getAttitude();
}
```

The MPU6050 library actually provides a function that returns the orientation estimation. This is really convenient and a good option for now. However Icarus Rev D actually includes a magnetometer so at some point in the future I'd like to add that to the fusion algorithm.

```c++
#include <Arduino.h>
#include <pins.hpp>
#include <Sensors.hpp>

Sensors sensors;

void setup() {
  Serial.begin(115200);

  if (!sensors.begin(ICARUS_I2C_SCL, ICARUS_I2C_SDA))
  {
    Serial.println("Failed to initialize sensors!");
    while(1){}
  }
  else
  {
    Serial.println("Sensor setup complete!");
  }

  server.begin();
  Serial.println("Server setup complete");
}

void loop() {
  sensors.update();

  const auto attitude = sensors.getAttitude();
  Serial.printf("(%0.2f, %0.2f, %0.2f)\n", attitude.pitch, attitude.roll, attitude.yaw);

  delay(100);
}
```

Start the sensor module and collect the estimated orientation from the IMU.

**Bluetooth Server Setup**

Bluetooth LE devices expose `Services` and each service has a number of `Characteristics`. Each service and characteristic is specified with a unique ID.

Characteristics are the data that a client application will receive.

In the firmware I'm creating a "sensors" service with a characteristic for each sensor value.

```c++
#include <NimBLEDevice.h>

struct AttitudeServiceData
{
    AttitudeServiceData() : pitch{0}, roll{0}, yaw{0} {}

    float pitch;
    float roll;
    float yaw;
};

/**
 * @brief Icarus BLE Server
 *
 */
class IcarusServer
{
public:
    IcarusServer();
    ~IcarusServer();

    void begin();

    void updateAttitude(float pitch, float roll, float yaw);

private:
    void serializeAttitude();

    NimBLEServer* server_{nullptr};

    // Sensor Service
    NimBLEService* sensor_service_{nullptr};
    NimBLECharacteristic* attitude_characteristic_{nullptr};
    AttitudeServiceData attitude_data_;
    uint8_t attitude_service_buffer_[sizeof(AttitudeServiceData)];
};
```

The sensor data is stored in a byte buffer.

```c++
void IcarusServer::begin()
{
    // Set the device name
    NimBLEDevice::init("icarus");

    // Setup the server
    server_ = NimBLEDevice::createServer();

    // Setup services
    sensor_service_ = server_->createService(ICARUS_SENSOR_SERVICE_UUID);
    attitude_characteristic_ = sensor_service_->createCharacteristic(
                                            ICARUS_SENSOR_SERVICE_CHARACTERISTIC_ATTITUDE_UUID,
                                            NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
                                        );

    updateAttitude(0, 0, 0);

    // Starting Services
    sensor_service_->start();

    // Start BLE Advertising
    auto advertising = NimBLEDevice::getAdvertising();

    advertising->addServiceUUID(sensor_service_->getUUID());

    advertising->setScanResponse(true);
    advertising->start();
}
```

Setting the `NOTIFY` flag will notify clients of new data.

It's important that byte order is consistent for client applications to receive the data. So `updateAttitude` serializes the data in network byte order.

```c++
void IcarusServer::updateAttitude(float pitch, float roll, float yaw)
{
    attitude_data_.pitch = pitch;
    attitude_data_.roll = roll;
    attitude_data_.yaw = yaw;

    serializeAttitude();
}

void IcarusServer::serializeAttitude()
{
    uint8_t* buf = attitude_service_buffer_;

    buf += serde::serialize(buf, attitude_data_.pitch);
    buf += serde::serialize(buf, attitude_data_.roll);
    buf += serde::serialize(buf, attitude_data_.yaw);

    attitude_characteristic_->setValue(attitude_service_buffer_, sizeof(attitude_service_buffer_));
    attitude_characteristic_->notify();
}
```

The serialization is pretty straight forward:

```c++
namespace serde
{
    union FloatToInt
    {
        float f;
        uint32_t i;
    };
    

    uint32_t serialize(uint8_t* buf, uint8_t value)
    {
        buf[0] = value;
        return 1;
    }

    uint32_t serialize(uint8_t* buf, uint16_t value)
    {
        buf[0] = value >> 8;
        buf[1] = value & 0x00FF;
        return 2;
    }

    uint32_t serialize(uint8_t* buf, uint32_t value)
    {
        buf[0] = value >> 24;
        buf[1] = value >> 16;
        buf[2] = value >> 8;
        buf[3] = value & 0x000000FF;
        return 4;
    }


    uint32_t serialize(uint8_t* buf, float value)
    {
        FloatToInt f2i;
        f2i.f = value;

        return serialize(buf, f2i.i);
    }

} // namespace serde
```

Updating the sensor values from the IMU

```c++
void loop() {
  sensors.update();

  const auto attitude = sensors.getAttitude();
  Serial.printf("(%0.2f, %0.2f, %0.2f)\n", attitude.pitch, attitude.roll, attitude.yaw);

  server.updateAttitude(attitude.pitch, attitude.roll, attitude.yaw);

  delay(100);
}
```

**Bluetooth Client on the PC**

And this time in Rust...

It is pretty straight forward to get the data over bluetooth. I'm using a library call.. er.. `btleplug`.

This is an async bluetooth client.

```rust
pub async fn initialize() -> anyhow::Result<Client> {
    let manager = Manager::new().await?;
    let adaptor_list = manager.adapters().await?;

    for adaptor in adaptor_list.iter() {
        log::debug!("Starting scan of {}...", adaptor.adapter_info().await?);

        adaptor
            .start_scan(ScanFilter::default())
            .await
            .expect("Can't scan BLE adaptor for connected devices");

        time::sleep(Duration::from_secs(10)).await;

        let peripherals = adaptor.peripherals().await?;

        // Find the icarus device
        for peripheral in peripherals.iter() {
            let properties = peripheral.properties().await?;
            let is_connected = peripheral.is_connected().await?;
            let local_name = properties
                                .map(|p| p.local_name)
                                .flatten()
                                .unwrap_or(String::from("unknown"));

            if local_name == String::from("icarus") {
                if !is_connected {
                    if let Err(e) = peripheral.connect().await {
                        log::error!("Failed to connect: {}", e);
                        continue;
                    }
                }

                peripheral.discover_services().await?;

                // Setup client streams
                let (attitude_tx, attitude_rx) = mpsc::channel::<Attitude>(10);

                let attitude_char = peripheral
                                        .characteristics()
                                        .iter()
                                        .filter(|c| c.uuid == ATTITUDE_CHARACTERISTIC)
                                        .next()
                                        .map(|c| c.clone())
                                        .ok_or(Error::CharacteristicNotFound)?;

                tokio::spawn(attitude_recv_task(peripheral.clone(), attitude_char, attitude_tx));


                let client = Client { attitude_recv: attitude_rx };
                return Ok(client)
            }
        }
    }

    Err(Error::DeviceNotFound)?
}
```

* Iterate over all bluetooth adaptors on the PC
* Iterate over all detected peripherals
* Looks for the icarus controller by name
* Is found, find services and spawn a separate task to handle notifications from the device

```rust
async fn attitude_recv_task<P: Peripheral>(p: P, c: Characteristic, tx: Sender<Attitude>) -> anyhow::Result<()> {
    p.subscribe(&c).await?;

    let mut stream = p.notifications().await?;

    while !tx.is_closed() {
        while let Some(data) = stream.next().await {
            let mut cursor = Cursor::new(&data.value[..]);

            let pitch = cursor.read_f32::<NetworkEndian>()?;
            let roll = cursor.read_f32::<NetworkEndian>()?;
            let yaw = cursor.read_f32::<NetworkEndian>()?;

            log::debug!("({}, {}, {})", pitch, roll, yaw);

            let attitude = Attitude {pitch, roll, yaw};

            if let Err(e) = tx.send(attitude).await {
                log::error!("Failed to send attitude data: {}", e);
            }
        }
        time::sleep(Duration::from_millis(10)).await;
    }

    Ok(())
}
```

When receiving data, deserialize using Network byte order.

```bash
❯ RUST_LOG=info cargo run -p icarus-cli
   Compiling icarus-cli v0.1.0 (D:\Users\nnarain\Code\workspace\Projects\icarus-desktop\icarus-cli)
    Finished dev [unoptimized + debuginfo] target(s) in 10.49s
     Running `target\debug\icarus-cli.exe`
 INFO  icarus_cli > Initializing icarus client
 INFO  icarus_cli > Pitch: 0.00818, Roll: -0.03394, Yaw: -2.15001
 INFO  icarus_cli > Pitch: 0.00803, Roll: -0.03389, Yaw: -2.14994
 INFO  icarus_cli > Pitch: 0.00803, Roll: -0.03410, Yaw: -2.14994
 INFO  icarus_cli > Pitch: 0.00828, Roll: -0.03406, Yaw: -2.14992
 INFO  icarus_cli > Pitch: 0.00818, Roll: -0.03401, Yaw: -2.14944
 INFO  icarus_cli > Pitch: 0.00845, Roll: -0.03399, Yaw: -2.14931
 INFO  icarus_cli > Pitch: 0.00834, Roll: -0.03386, Yaw: -2.14877
```

Next up, plotting sensor data.
