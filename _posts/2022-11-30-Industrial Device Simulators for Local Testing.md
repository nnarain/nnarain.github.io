---
layout: post
title: Industrial Device Simulators for Local Testing
tag: ['modbus', 'canopen', 'c++', 'rust', 'async']
repo: nnarain/canopen-device-simulator
---

Since I write a lot of drivers for work, I often need simulate hardware devices. Usually I'll write a python scripts to send CAN traffic or act as a modbus server.

For CANopen devices I'd send a CAN frame to simulate a devices PDO traffic, but I don't have a good way to simulate SDOs without actually implement the protocol itself.

So I wanted to invest some time into developing tools to simulate CANopen devices and, more recently, modbus devices as well.

**General Concept**

I want to be able to write a script that models the functionality of a device without implementing any of the details (like sending CAN frames).

For CANopen devices, all interactions are through the Object Dictionary. I only need to interact with changes to the dictionary and not the details of decoding the CAN frames.

The simplest example is simulating a motor controller.

For example a script could do the following:

* Receive a command velocity to the Object `4000.00`
* Echo this command to Object `4001.00`

The simulator should handle figuring out PDO mapping from the EDS/DCF files, while the script handles the device logic.

The goal is to get a 80:20 on driver functionality as there's no substitute for testing against real hardware.

**Scripting Language**

Lua is usually the go to embedded scripting language. So I opted for that without much consideration to other options. I do think [mun lang](https://mun-lang.org/) is a cool option for fast iteration.

I'm using sol2 for Lua integration into C++ and mlua for integration into Rust. Both these libraries make it trivial to embedded Lua into their respective languages.

**CANopen Device Simulator**

For a CANopen device the model is its EDS file to define the object dictionary and the script to simulate the device logic.

I learned that ROS industrial was using the open source CANopen stack [Lely](https://opensource.lely.com/canopen/), in their ros2_canopen package. So that started using that for my simulator package.

Lely provides a very clean API to interact with events in the CANopen device.

```c++
    class SimulatedDevice {
        // ...
        SimulatedSlave(io::TimerBase& timer, io::CanChannelBase& chan,
                const std::string& dcf_txt,
                const std::string& dcf_bin, uint8_t id,
                const std::string& script) : canopen::BasicSlave{timer, chan, dcf_txt, dcf_bin, id}
        {
            // Register additional callbacks
            // OnSync()

            // Initialize the Lua scripting environment
            lua.open_libraries(
                sol::lib::base,
                sol::lib::string,
                sol::lib::math,
                sol::lib::os,
                sol::lib::table
            );
            lua.script_file(script);

            // OD Access Functions
            lua.set_function("GetU32", [this](const uint16_t idx, const uint8_t subidx) { return getU32(idx, subidx); });
        }

        virtual void OnInit() {
            lua["OnInit"]();
        }

        void OnSync(uint8_t cnt, const time_point&) noexcept override {
            lua["OnSync"](cnt);
        }

        // This function gets called every time a value is written to the local object
        // dictionary by an SDO or RPDO.
        void OnWrite(uint16_t idx, uint8_t subidx) noexcept override {
            lua["OnWrite"](idx, subidx);
        }
    };
```

```lua
-- device.lua

function OnInit()
    print('OnInit')
end

function OnSync(cnt)
    print('Sync ' .. cnt)
end

function OnWrite(index, subindex)
    print('Object ' .. string.format("%4x", index) .. ":" .. subindex .. " was updated to " .. GetU32(0x4000, 0x00))
end
```

That's actually... it. Lely are sol2 are doing the heavy lifting here. All that's really needed is some helper functions for accessing the object dictionary.

**Modbus Device Simulator**

https://github.com/nnarain/modbus-device-simulator

Similar for Modbus I want a script that models the device. In the case of this simulator I wrote the program using Async Rust and a library called `tokio_modbus`.

There are two main async tasks. The server task that receives modbus request over TCP and the device task that runs the lua script. The server task and device task are connected using channels.

```rust
// server.rs

/// Main Modbus TCP server task
pub async fn run(sock_addr: SocketAddr, device: Device) -> Result<()> {
    // Setup the device task that actual handles the request from modbus clients
    // Requests are sent to the device task for handling
    // Responses are send back from the device task
    let (req_tx, req_rx) = mpsc::channel::<Request>(5);
    let (res_tx, res_rx) = watch::channel::<Response>(Response::Custom(0, vec![]));

    tokio::spawn(device_task(device, req_rx, res_tx));

    let spawner = ServiceSpawner(req_tx, res_rx);

    // Create a modbus tcp server and start with the service spawner
    let modbus_server = server::tcp::Server::new(sock_addr);
    modbus_server.serve(spawner).await?;

    Ok(())
}

/// Device task handles incoming requests from clients
async fn device_task(device: Device, mut rx: mpsc::Receiver<Request>, tx: watch::Sender<Response>) -> Result<()> {
    // Wait for incoming request
    while let Some(req) = rx.recv().await {
        // Use the virtual device to handle requests
        let res = match req {
            Request::ReadInputRegisters(addr, cnt) => {
                let regs = device.read_input_registers(addr, cnt).unwrap_or(vec![]);
                Response::ReadInputRegisters(regs)
            },
            Request::ReadDiscreteInputs(addr, cnt) => {
                let inputs = device.read_discrete_inputs(addr, cnt).unwrap_or(vec![]);
                Response::ReadDiscreteInputs(inputs)
            },
            Request::ReadCoils(addr, cnt) => {
                let coils = device.read_coils(addr, cnt).unwrap_or(vec![]);
                Response::ReadCoils(coils)
            },
            Request::ReadHoldingRegisters(addr, cnt) => {
                let regs = device.read_holding_registers(addr, cnt).unwrap_or(vec![]);
                Response::ReadHoldingRegisters(regs)
            }
            Request::WriteMultipleCoils(addr, coils) => {
                let (address, written) = device.write_coils(addr, coils).unwrap_or((addr, 0));
                Response::WriteMultipleCoils(address, written)
            },
            Request::WriteSingleCoil(address, value) => {
                let (address, _) = device.write_coils(address, vec![value]).unwrap_or((address, 0));
                Response::WriteSingleCoil(address, value)
            },
            Request::WriteMultipleRegisters(addr, values) => {
                let (address, written) = device.write_holding_registers(addr, values).unwrap_or((addr, 0));
                Response::WriteMultipleRegisters(address, written)
            }
            _ => unimplemented!()
        };

        tx.send(res)?;
    }

    Ok(())
}

```

An example of calling functions from the lua script file:

```rust
// device.rs

    struct Device {...};

    impl Device {
        /// Read input registers (read-only integer) from the virtual device
        pub fn read_input_registers(&self, address: u16, count: u16) -> Result<Vec<u16>, DeviceError> {
            let read_input_registers_fn: Function = self.lua.globals().get("ReadInputRegisters")?;
            let regs: Vec<u16> = read_input_registers_fn.call((address, count))?;

            Ok(regs)
        }
    }
```

```lua
-- device.lua
ir_block = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

function ReadInputRegisters(addr, cnt)
    return ir_block
end

-- ...
```

Both of these need to be fleshed out quite a bit but I usual find that investing time in tooling is worth it.
