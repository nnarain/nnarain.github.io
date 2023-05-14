---
layout: post
title: CANopen Device Simulator
tag: ['can', 'canopen', 'lua']
repo: nnarain/canopen-device-simulator
---

As a follow up to a [previous post]({% post_url 2022-11-30-Industrial Device Simulators for Local Testing %}) I've spent some time recently working on my CANopen simulator tools.

**Why does it exist**

I need to setup a lot driver's for a lot of CANopen devices at work. The idea of this tool is to mock out a CANopen device so I can do development locally.

**Usage**

The idea is the simulator is initialized with the CANopen EDS file and a script is also loaded to provide the devices behavior.

```
co-sim -i vcan0 -n 5 -m device.eds -s device.lua
```

The above command would that start a CANopen device stack on the `vcan0` interface, with node-id 5 using the `device.eds`.

The `device.lua` would be the scripted behavior of the device. Scripts operation on the object's directly not just the CANopen object ID, which makes for a cleaner interface.

For example:

```lua
-- Register a convenient name for the object to reference
Register('foo', 0x4000, 0x00, ObjectType.UINT32)
Register('bar', 0x4001, 0x00, ObjectType.UINT32)
Register('baz', 0x4002, 0x00, ObjectType.UINT32)

-- Function called then the slave device is initialized
function OnInit()
    -- Configured the periodic timer
    ConfigureTimer(1000)

    -- Sets up a callback for the object 4000.00h
    ObjectCallback(0x4000, 0x00, FooUpdated)

    -- Prints the values of these objects
    print('Foo: ' .. string.format('0x%4X', objects.foo))
    print('Bar: ' .. string.format('0x%4X', objects.bar))
    print('Baz: ' .. string.format('0x%4X', objects.baz))
end

-- Periodic callback to drive logic over time
function OnTick()
    objects.bar = objects.bar + 1
    print('bar: ' .. objects.bar .. ', foo: ' .. objects.foo)
end

-- Callback for when `foo` is updated
function FooUpdated()
    print('Foo was updated')
end
```

**Future**

The main issue I have is that the simulator is primarily configured using EDS files (which I don't have a good editor for that runs on Linux). Ideally everything could be configured/updated from the script.
