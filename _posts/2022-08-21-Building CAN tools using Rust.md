---
layout: post
title: Building CAN tools using Rust
tag: ['rust', 'can', 'canopen', 'cli', 'embedded-hal']
repo: nnarain/can-rs
---

I use CAN and CANopen quite a bit at work and I find myself wanting some functionality I can't quite get out of `rs-canopen-*` or `cansniffer` / `candump`.

For example:

* cansniffer doesn't work with extended IDs
* If I want to know the value of a CANopen object I have to keep track of PDOs and SDO transfers (hard / impossible to do with cansniffer)
* I'd also have to remember the PDO mapping for a device
* CANopen uses EDS files as opposed to DBC files so it can't use any of the existing DBC tooling

So basically I want a tool that can take an EDS file + Node ID and decode PDOs and SDO transfers, displaying in the terminal in a table format (that among other things).

Rust has some pretty nice tui libraries, so I decided to build my own CAN utilities.

**Rust and CAN**

First it is necessary to get CAN data using Rust. There is a `socketcan` crate, though it is a little out of date. I've forked this repo for now to apply some updates.

Since I'll be writing code to handle CANopen data, I wanted to build the interface against the `embedded-hal` CAN traits. This would allow and device that can receive CAN data to handle CANopen.

Porting the `socketcan` crate to use `embedded-hal` was pretty simple, it's just a matter of implementing the `Frame` trait and using some different data types.

I have a pull request for this here:

https://github.com/socketcan-rs/socketcan-rs/pull/24

Hoping to get this merged are some point. For now I'm using my own crate `socketcan-hal`.

**tokio-socketcan**

Given that this application will be primarily IO bound (waiting on CAN frames), I've decided to make it an `async` application. For this I'm using the `tokio-socketcan` library, specifically a fork that uses `socketcan-hal`.

No pull request for this yet, but I'd like to get that up soon.

Branch: https://github.com/nnarain/tokio-socketcan/tree/socketcan-embedded-hal

A simple example for read CAN frames:

```rust
use futures_util::StreamExt;
use tokio;
use tokio_socketcan::CANSocket;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let mut socket_rx = CANSocket::open("vcan0").unwrap();

    println!("Reading on vcan0");

    while let Some(next) = socket_rx.next().await {
        println!("{:#?}", next);
    }

    Ok(())
}
```

**Reading CANopen data**

CANopen is a suite of protocols for communicating data over CAN. The CANopen standard partitions the CAN ID for each of the different protocols. Each device on the bus has a node id use to identify that devices specific frames.

For example a PDO is data that streams to or from a CANopen device. `TPDO1` is a frame that stream from the device and has a CAN ID of `180 + NODE-ID`.

I've represented CANopen data on the bus using the following struct:

```rust
/// Parsed CANopen data
#[derive(Debug, Clone, Copy)]
pub enum CanOpenFrame {
    Sync,
    Heartbeat(NmtState),
    Pdo(Pdo, FrameData),
    Sdo(Sdo, FrameData),
}
```

A simple function to parse frame into CANopen frame + NODE ID:

```rust
pub fn parse<F: Frame>(frame: F) -> Result<(Option<NodeId>, CanOpenFrame), Error> {
    let id = utils::id_to_raw(&frame.id());

    let channel = id & !(0x7F);
    let node_id = NodeId((id & 0x7F) as u8);

    match channel {
        0x080 => Ok((None, CanOpenFrame::Sync)),
        0x700 => Ok((Some(node_id), CanOpenFrame::Heartbeat(NmtState::try_from(frame.data()[0])?))),
        0x180 => Ok((Some(node_id), CanOpenFrame::Pdo(Pdo::Tx1, FrameData::new(frame.data(), frame.dlc())))),
        0x200 => Ok((Some(node_id), CanOpenFrame::Pdo(Pdo::Rx1, FrameData::new(frame.data(), frame.dlc())))),
        0x280 => Ok((Some(node_id), CanOpenFrame::Pdo(Pdo::Tx2, FrameData::new(frame.data(), frame.dlc())))),
        0x300 => Ok((Some(node_id), CanOpenFrame::Pdo(Pdo::Rx2, FrameData::new(frame.data(), frame.dlc())))),
        0x380 => Ok((Some(node_id), CanOpenFrame::Pdo(Pdo::Tx3, FrameData::new(frame.data(), frame.dlc())))),
        0x400 => Ok((Some(node_id), CanOpenFrame::Pdo(Pdo::Rx3, FrameData::new(frame.data(), frame.dlc())))),
        0x480 => Ok((Some(node_id), CanOpenFrame::Pdo(Pdo::Tx4, FrameData::new(frame.data(), frame.dlc())))),
        0x500 => Ok((Some(node_id), CanOpenFrame::Pdo(Pdo::Rx4, FrameData::new(frame.data(), frame.dlc())))),
        0x580 => Ok((Some(node_id), CanOpenFrame::Sdo(Sdo::Tx, FrameData::new(frame.data(), frame.dlc())))),
        0x600 => Ok((Some(node_id), CanOpenFrame::Sdo(Sdo::Rx, FrameData::new(frame.data(), frame.dlc())))),
        _ => Err(Error::InvalidChannel(channel)),
    }
}
```

This function identifies the CANopen protocol and copies the data into a new frame.

**EDS file parsing**

I created a separate package for parsing CANopen EDS files. This file is just an INI file that describes the CANopen object dictionary.

Not going to go into detail on the parsing, but I think overall I've learned a bit about Rust error handling and how to structure Error types. I found using the `thiserror` particularly useful (if not necessary) for building clean error interfaces.

CANopen is a flat data model. All data is simply a object in the dictionary that is referenced using a index and a subindex (its `COB-ID`). The EDS parser reads each variable in the dictionary and stores it in a `HashMap` keyed by the `COB-ID`

```rust
/// EDS file representation
pub struct Eds {
    /// Objects in the dictionary
    objects: HashMap<CobId, Object>,
    /// Metadata objects such as Arrays and Records.
    metadata: HashMap<CobId, Object>,
}
```

After the dictionary is loaded, specific CANopen objects can be read to determine PDO mapping (among other things).

**PDO Mapping**

CANopen uses standard data type such as `uint8`, `int8`, `uint16`, etc. The smallest datatype being 8 bits in length. This means a PDO can at most have 8 mapped objects.

Mapped PDO in the EDS might look like:

```ini
[1A00sub1]
ParameterName=PDO 1 Mapping for a process data variable 1
ObjectType=0x7
DataType=0x0007
AccessType=rw
DefaultValue=0x60010120
PDOMapping=0
```

The value `0x60010120` breaks down to:

* index = 6001h
* subindex = 01h
* Bit length = 32

I used the following to represent mapped PDO data:

```rust
/// A mapped PDO item, with its data length
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MappedPdo(CobId, u8);

/// PDO Mapping
#[derive(Debug)]
pub struct PdoMapping {
    /// A maximum of 8 objects can be mapped into a single PDO
    pub slots: [Option<MappedPdo>; 8],
}
```

Getting the PDO mapping involves reading a number of variables from either an EDS Array or Record and then interpreting the Mapped PDO value.

```rust
fn get_pdo_mapping(&self, cobid: CobId) -> Option<PdoMapping> {
    // Get TPDO mapping as array
    self.get_array(&cobid)
        // Get each mapped PDO item variable
        .map(|tpdos| tpdos.items )
        .or_else(|| self.get_record(&cobid).map(|r| r.items.values().cloned().collect()))
        // Get the value of each variable
        // In the form:
        //   IIII SSLL
        // where:
        //   I - Index
        //   S - subindex
        //   L - data length
        .map(|vars| vars.iter().filter_map(|var| var.default_value.to_unsigned_int())
        // Collect as vector of integers
        .collect::<Vec<usize>>())
        // Map the integers into MappedPdo structs
        .map(|values| {
            values.iter()
                    .map(|value| {
                        let index = ((value & 0xFFFF_0000) >> 16) as u16;
                        let subindex = ((value & 0x0000_FF00) >> 8) as u8;
                        let bit_len = (value & 0x0000_00FF) as u8;

                        // println!("{:04X}.{:02X} ({})", index, subindex, data_len);

                        MappedPdo(CobId(index, subindex), bit_len / 8)
                    })
                    .collect::<Vec<MappedPdo>>()
        })
        .map(PdoMapping::from)
}
```

Getting the mapping for each PDO:

```rust
pub fn get_tpdo1_mapping(&self) -> Option<PdoMapping> {
    self.get_pdo_mapping(CobId(0x1A00, 0x00))
}

pub fn get_tpdo2_mapping(&self) -> Option<PdoMapping> {
    self.get_pdo_mapping(CobId(0x1A01, 0x00))
}

pub fn get_tpdo3_mapping(&self) -> Option<PdoMapping> {
    self.get_pdo_mapping(CobId(0x1A02, 0x00))
}

pub fn get_tpdo4_mapping(&self) -> Option<PdoMapping> {
    self.get_pdo_mapping(CobId(0x1A03, 0x00))
}
```

**PDO Decoder**

Using the PDO mapping a PDO decoder can be created to interpret bytes in the CAN frame.

The `PdoDecoder` will decode up to 8 objects from the PDO.

```rust
/// PDO Decoder
pub struct PdoDecoder {
    pub mapping: [Option<(MappedPdo, DataType)>; 8],
}

impl PdoDecoder {
    pub fn decode(&self, data: &[u8]) -> [Option<(CobId, ValueType)>; 8] {
        let mut values: [Option<(CobId, ValueType)>; 8] = Default::default();

        let mut offset: usize = 0;

        for (item, pdo) in values.iter_mut().zip(self.mapping.iter().filter(|item| item.is_some())) {
            if let Some((pdo, data_type)) = pdo {
                let start = offset;
                let end = start + pdo.1 as usize;

                offset = end;

                if let Some(value_type) = value_type_from_bytes(&data[start..end], data_type.clone()) {
                    *item = Some((pdo.0, value_type));
                }
            }
        }

        values
    }
}

fn value_type_from_bytes(src: &[u8], data_type: DataType) -> Option<ValueType> {
    match (data_type, src.len()) {
        (DataType::Bool, 1) => Some(ValueType::Bool(src[0] != 0)),
        (DataType::U8, 1) => Some(ValueType::U8(src[0])),
        (DataType::U16, 2) => Some(ValueType::U16(u16::from_le_bytes(src.try_into().unwrap()))),
        (DataType::U32, 4) => Some(ValueType::U32(u32::from_le_bytes(src.try_into().unwrap()))),
        (DataType::I8, 1) => Some(ValueType::I8(src[0] as i8)),
        (DataType::I16, 2) => Some(ValueType::I16(i16::from_le_bytes(src.try_into().unwrap()))),
        (DataType::I32, 4) => Some(ValueType::I32(i32::from_le_bytes(src.try_into().unwrap()))),
        _ => None,
    }
}
```

**TUI**

I'm using the crate `tui` for the terminal interface. This is to create a simple layout to display the CANopen data in a table.

The `ui` function renders a table with the object COB-ID, parameter name, value and data type.

```rust
fn ui<B: Backend>(f: &mut UiFrame<B>, app: &App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints(
            [
                Constraint::Percentage(100),
            ]
            .as_ref(),
        )
        .split(f.size());

    // let format_mode = app.format_mode;

    let headers_cells = ["COB-ID", "Parameter Name", "Value", "Data Type"]
        .iter().map(|h| Cell::from(*h).style(Style::default().fg(Color::Green)));
    let header = Row::new(headers_cells);

    let rows = app.objects.iter().map(|(cobid, value)| {
        // let (index, subindex) = cobid.clone().into_parts();

        let parameter_name = app.name_lookup.get(cobid).map(|s| s.clone()).unwrap_or(String::from("unknown"));

        let type_str = match value {
            ValueType::Bool(_) => "bool",
            ValueType::U8(_) => "uint8",
            ValueType::I8(_) => "int8",
            ValueType::U16(_) => "uint16",
            ValueType::I16(_) => "int16",
            ValueType::U32(_) => "uint32",
            ValueType::I32(_) => "int32",
            ValueType::F32(_) => "float32",
            ValueType::OString(_) => "Octet String",
            ValueType::VString(_) => "V String",
        };

        let cell0 = Cell::from(format!("{}", cobid));
        let cell1 = Cell::from(parameter_name);
        let cell2 = Cell::from(format!("{}", value));
        let cell3 = Cell::from(type_str);

        Row::new([cell0, cell1, cell2, cell3])
    });

    let title = format!("{:?} on {}", app.node_id, app.device_name);

    let t = Table::new(rows)
        .header(header)
        .block(Block::default().borders(Borders::ALL).title(title))
        .widths(&[
            Constraint::Percentage(25),
            Constraint::Percentage(25),
            Constraint::Percentage(25),
            Constraint::Percentage(25)
        ]);

    f.render_widget(t, chunks[0]);

}
```

**Output**

This is the output from the default EDS file I have for a motor controller:

![image not found!](/assets/2022/08/21/output.png)

