---
layout: post
title: Icarus Sensors and Visualization
tag: ['flight-controller', 'ble', 'rust', 'embedded', 'esp32-c3', 'esp32', 'bluetooth']
repo: nnarain/icarus-desktop
project_id: icarus-fc
---

This post will cover visualizing sensor data collected over Bluetooth from the controller.

**Graphics Library**

[Bevy](https://bevyengine.org/) seems to be the all around best choice for graphics in Rust these days. Combined with `egui` (an `ImGUI` like immediate mode UI library) it makes for a really easy to set up UI with custom graphics.


**Mixing Synchronous and Asynchronous Rust**

The bluetooth client library I'm using is `async` based and bevy is not so the two need to be linked together in some way.

This can be done with `tokio` and constructing an async runtime on a dedicated thread.

```rust
pub struct IcarusPlugin;

impl Plugin for IcarusPlugin {
    fn build(&self, app: &mut App) {
        // Setup data channels to communicate with the async runtime
        let (attitude_tx, attitude_rx) = mpsc::channel::<Attitude>(50);
        let channels = Channels { attitude: attitude_rx };

        // Spawn the async runtime
        thread::spawn(|| icarus_async_runtime(attitude_tx));

        // ...

        // Add the data channels to bevy's resource manager
        app
        // ...
            .insert_resource(channels)
    }
}

/// Build async runtime to run bluetooth client
fn icarus_async_runtime(tx: Sender<Attitude>) -> anyhow::Result<()> {
    // Spawn an async runtime to collect sensor and state data
    let runtime = Builder::new_current_thread().enable_all().build()?;
    runtime.block_on(collect_icarus_data(tx))?;

    Ok(())
}

async fn collect_icarus_data(tx: Sender<Attitude>) -> anyhow::Result<()> {
    let (mut attitude, _) = icarus_client::initialize().await?.split();

    while let Some(attitude) = attitude.recv().await {
        if let Err(e) = tx.send(attitude).await {
            log::error!("Error sending data: {}", e);
        }
    }

    Ok(())
}
```

Channels are used to pass data from the async runtime. The channels are registered as a global resource within bevy.


```rust
impl Plugin for IcarusPlugin {
    fn build(&self, app: &mut App) {
        // ...

        // Buffers for sensor data
        let attitude_sensor: SensorBuffer<Attitude> = SensorBuffer::new(250);
        let sensors = Sensors {attitude: attitude_sensor};

        // Add the data channels to bevy's resource manager
        app
        // ...
            .insert_resource(channels)
            .insert_resource(sensors)
            .add_system(update_sensors_system)
    }
}

fn update_sensors_system(mut channels: ResMut<Channels>, mut sensors: ResMut<Sensors>) {
    while let Ok(data) = channels.attitude.try_recv() {
        sensors.attitude.push(data);
    }
}

```

A ringbuffer is used to store sensor data (also added as a bevy resource). A system is used to move data from the channels to the ringbuffer.

Now that the data is in the system it can be plotted. `egui`'s plotting library is surprisingly good:

```rust
fn ui_system(mut ctx: ResMut<EguiContext>, sensors: Res<Sensors>) {
    egui::Window::new("Sensors").show(ctx.ctx_mut(), |ui| {
        let (pitch, roll, yaw): (Vec<_>, Vec<_>, Vec<_>) = sensors.attitude
                                                            .iter()
                                                            .map(|a| (a.pitch as f64, a.roll as f64, a.yaw as f64))
                                                            .multiunzip();

        let pitch: PlotPoints = pitch.iter().enumerate().map(|(i, &p)| [i as f64, p]).collect();
        let roll: PlotPoints = roll.iter().enumerate().map(|(i, &r)| [i as f64, r]).collect();
        let yaw: PlotPoints = yaw.iter().enumerate().map(|(i, &y)| [i as f64, y]).collect();

        let pitch = Line::new(pitch).name("Pitch");
        let roll = Line::new(roll).name("Roll");
        let yaw = Line::new(yaw).name("Yaw");

        Plot::new("attitude")
            .view_aspect(2.0)
            .legend(Legend::default())
            .show(ui, |plot_ui| {
                plot_ui.line(pitch);
                plot_ui.line(roll);
                plot_ui.line(yaw);
            });

    });
}
```

![image not found!](/assets/2023/02/22/plots.png)

To visualize the orientation of the I added a cube at set its rotation to the last received pitch, roll, yaw:

```rust
/// Setup 3D shapes for visualization
fn setup_3d_shapes(mut commands: Commands, mut meshes: ResMut<Assets<Mesh>>, mut mats: ResMut<Assets<StandardMaterial>>) {
    let material = mats.add(StandardMaterial {
        base_color: Color::rgb(0.7, 0.0, 0.0),
        ..Default::default()
    });

    let body_mesh = meshes.add(shape::Cube::default().into());

    commands.spawn((
        PbrBundle {
            mesh: body_mesh.clone(),
            material: material,
            transform: Transform::from_xyz(0.0, 0.0, 0.0),
            ..Default::default()
        },
        FrameBody
    ));
}

fn update_frame_orientation(sensors: Res<Sensors>, mut query: Query<&mut Transform, With<FrameBody>>) {
    if let Some(Attitude { pitch, roll, yaw }) = sensors.attitude.iter().last() {
        for mut transform in &mut query {
            // Create a new rotation quat
            // Note: In the 3D environment Y is "Up".
            let mx = Mat4::from_rotation_x(*pitch);
            let my = Mat4::from_rotation_y(*yaw);
            let mz = Mat4::from_rotation_z(*roll);

            let mr = mx * my * mz;
            transform.rotation = Quat::from_mat4(&mr);
        }
    }
}
```

![image not found!](/assets/2023/02/22/orientation.gif)

**Future Work**

* Plot the other sensors
* Render the step file from KiCAD
* Throttle control (via gamepad)
