---
layout: post
title: Improvements to Desktop Backlight!
tag: ['home-automation', 'python', 'raspberry-pi', 'mqtt']
repo: nnarain/backlight
---

To make better use of Home Assistant's wide variety of components, I removed the REST commands in exchange for `MQTT` compatibility.

I'm using [MQTT JSON Light Component](https://www.home-assistant.io/components/light.mqtt_json/) and the [paho-mqtt](https://pypi.org/project/paho-mqtt/) python module.

The MQTT JSON Lights module supports a number of features like, `rgb color`, `effects` and `transitions`. It sends a JSON string on a user specified topic containing the various attributes.

In my case I wanted to support the basic `ON/OFF` behavior and two effects: `solid` and `rainbow`.

So I can expect `JSON` strings like the following:

```json
{
    "state": "ON"
}

{
    "effect": "solid",
    "color": {"r": 255, "g": 0, "b": 0}
}

{
    "effect": "rainbow"
}
```

Create an MQTT client class that can subscribe to the command topic.

```python
import json
import paho.mqtt.client as mqtt


class BacklightMqttClient(object):
    COMMAND_TOPIC = '/home/backlight/set'
    STATE_TOPIC = '/home/backlight/state'

    def __init__(self, backlight):
        self._backlight = backlight
        # Backlight driver manages its state. Allow it to publish on the state topic
        self._backlight.set_state_callback(self._publish_state)

        # setup MQTT client
        self._client = mqtt.Client()
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message

        self._topic_to_callback = {}

        # register the command topic callback
        self.register(self.COMMAND_TOPIC, self._on_command)

    def _on_command(self, command):
        # ...
        pass

    def _publish_state(self, state):
        # publish the state to home assistant
        self._client.publish(self.STATE_TOPIC, json.dumps(state))

    def _on_connect(self, client, userdata, flags, rc):
        # subscribe to all the topics
        for topic in self._topic_to_callback.keys():
            client.subscibe(topic)

        # publish the initial state of the driver
        self._publish_state(self._backlight.get_state())

    def _on_message(self, client, userdata, msg):
        # get the callback for this topic
        callback = self._topic_to_callback.get(msg.topic, None)

        if callback:
            # decode the payload
            payload = msg.payload.decode('utf-8')
            try:
                # convert to a JSON object
                json_data = json.loads(payload)
                callback(json_data)
            except (ValueError, TypeError) as e:
                pass

    def register(self, topic, callback):
        self._topic_to_callback[topic] = callback

    def connect(self, broker='localhost'):
        self._client.connect(broker)

    def spin(self):
        self._client.loop_forever()

```

Process commands.

```python
    ...

    def _on_command(self, command):
        if 'state' in command:
            state = command['state']
            if state == 'ON':
                self._backlight.turn_on()
            elif state == 'OFF':
                self._backlight.turn_off()
        
        if 'effect' in command:
            effect = command['effect']
            self._backlight.set_effect(effect)

        if 'color' in command:
            color = command['color']
            self._backlight.set_solid_color(color)

    ...
```

Not a big change but a lot more integrated with Home Assistant!

Here is the config for home assistant:

```yaml
light:
  - platform: mqtt_json
    name: Desktop Backlight
    command_topic: "/home/backlight/set"
    state_topic: "/home/backlight/state"
    effect: true
    effect_list:
      - rainbow
      - solid
    rgb: true
    optimistic: false
    qos: 0
```

I've also added the functionality for the backlight to turn on/off depending on whether my PC is on.

```yaml
# configuration.yaml
binary_sensor:
  - platform: ping
    name: workstation
    host: 192.168.0.17
    scan_interval: 5

# automation.yaml
- id: '1530945123989'
  alias: Backlight On
  trigger:
  - entity_id: binary_sensor.workstation
    from: 'off'
    to: 'on'
    platform: state
  condition: []
  action:
  - alias: ''
    data:
      entity_id: light.desktop_backlight
    service: light.turn_on
- id: '1530945171790'
  alias: Backlight Off
  trigger:
  - entity_id: binary_sensor.workstation
    from: 'on'
    to: 'off'
    platform: state
  condition: []
  action:
  - data:
      entity_id: light.desktop_backlight
    service: light.turn_off
```

