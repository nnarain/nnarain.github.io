---
layout: post
title: Starting out with Home Automation!
tag: ['home-automation', 'python', 'raspberry-pi']
repo_url: 
---

Now.. I don't exactly have a home to automate.. I'm working on that.. But there was something I wanted to try out recently. That is an RGB LED backlight for my desk. The LED strip is about a meter long and fits across my desk. It's set to the typical animated rainbow pattern everybody know from the arduino neopixel example.

It's easy enough to get this working on my raspberry pi but I wanted to tie it into home assistant as well.

**Building the backlight service**

The backlight service will expose a simple REST API for controlling the light strip. Sending an HTTP POST request with the parameter `command=on` will turn the light strip on and sending a `command=off` will turn the strip off.

First I needed to get the LED strip driver working. I found a neopixels driver on github and installed it on my raspberry pi. This project uses `scons` for the build

```
sudo apt-get update
sudo apt-get install scons

git clone https://github.com/jgarff/rpi_ws281x
cd rpi_ws281x

scons

cd python
sudo python setup.py install
```

Test it out in the python console

```
python
>>> import neopixel
>>>
```

Create a backlight driver class. It will instaniate the neopixel driver, manage an animation thread and allow controlling of the strip from a command queue.

```python
from neopixel import *
from queue import Queue
from threading import Thread

class BacklightDriver:
    LED_FREQ_HZ    = 800000  # LED signal frequency in hertz (usually 800khz)
    LED_DMA        = 10      # DMA channel to use for generating signal (try 10)
    LED_BRIGHTNESS = 255     # Set to 0 for darkest and 255 for brightest
    LED_INVERT     = False   # True to invert the signal
    LED_CHANNEL    = 0       # set to '1' for GPIOs 13, 19, 41, 45 or 53

    CMD_ON   = 0
    CMD_OFF  = 1
    CMD_EXIT = 2

    def __init__(self, led_count, led_pin):
        self._led_count = led_count
        self._led_pin = led_pin

        # Create NeoPixel object with appropriate configuration.
        self._strip = Adafruit_NeoPixel(self._led_count, self._led_pin, self.LED_FREQ_HZ, 
                                        self.LED_DMA, self.LED_INVERT,
                                        self.LED_BRIGHTNESS, self.LED_CHANNEL)
        # Intialize the library (must be called once before other functions).
        self._strip.begin()

        self._cmd_queue = Queue()

        self._animation_thread = None

    def start(self):
        self._animation_thread = Thread(target=self._animate)
        self._animation_thread.start()

    def stop(self):
        self.post_cmd(self.CMD_OFF)
        self.post_cmd(self.CMD_EXIT)
        if self._animation_thread:
            self._animation_thread.join()

    def post_cmd(self, cmd):
        self._cmd_queue.put(cmd)

    def _animate(self):
        running = True
        while True:
            if not self._cmd_queue.empty():
                cmd = self._cmd_queue.get(timeout=0.5)

                if cmd is not None:
                    if cmd == self.CMD_ON:
                        logging.info('Enabling animation')
                        running = True
                        pass
                    elif cmd == self.CMD_OFF:
                        logging.info('Disabling animation')
                        running = False
                        self.colorWipe(self._strip, Color(0,0,0), 10)
                        pass
                    elif cmd == self.CMD_EXIT:
                        logging.info('Exiting animation')
                        running = False
                        break

            if running:
                self.rainbowCycle(self._strip)

    @staticmethod
    def rainbowCycle(strip, wait_ms=20, iterations=5):
        """Draw rainbow that uniformly distributes itself across all pixels."""
        for j in range(256*iterations):
            for i in range(strip.numPixels()):
                strip.setPixelColor(i, BacklightDriver.wheel((int(i * 256 / strip.numPixels()) + j) & 255))
            strip.show()
            time.sleep(wait_ms/1000.0)

    # Define functions which animate LEDs in various ways.
    @staticmethod
    def colorWipe(strip, color, wait_ms=50):
        """Wipe color across display a pixel at a time."""
        for i in range(strip.numPixels()):
            strip.setPixelColor(i, color)
            strip.show()
            time.sleep(wait_ms/1000.0)

    @staticmethod
    def wheel(pos):
        """Generate rainbow colors across 0-255 positions."""
        if pos < 85:
            return Color(pos * 3, 255 - pos * 3, 0)
        elif pos < 170:
            pos -= 85
            return Color(255 - pos * 3, 0, pos * 3)
        else:
            pos -= 170
            return Color(0, pos * 3, 255 - pos * 3)
```

To manage the REST API I am using `tornado`.

Create a request handler class that dispatches the correct commands to the backlight driver. The request handler has a static reference to the backlight driver. This is because a new request handler in instaniated per request. This also means it needs a separate method to initialize the driver.

```python
from tornado.web import Application, RequestHandler
from tornado.ioloop import IOLoop, PeriodicCallback


class BacklightRequestHandler(RequestHandler):
    backlight = None

    @staticmethod
    def initialize_backlight(led_count, led_pin):
        logging.info('Initializing backlight driver')
        BacklightRequestHandler.backlight = BacklightDriver(led_count, led_pin)
        BacklightRequestHandler.backlight.start()

    @staticmethod
    def cleanup():
        if BacklightRequestHandler.backlight:
            BacklightRequestHandler.backlight.stop()

    def post(self):
        command = self.get_argument('command', None, strip=True)

        if command:
            logging.info('Processing command "{}"'.format(command))

            if command == 'on':
                self._cmd_on()
            elif command == 'off':
                self._cmd_off()
            else:
                logging.error('Invalid command "{}" provided'.format(command))
        else:
            logging.warn('No command provided')

    def _cmd_on(self):
        if self.backlight:
            self.backlight.post_cmd(BacklightDriver.CMD_ON)
        else:
            logging.error('Backlight driver has not been initialized')

    def _cmd_off(self):
        if self.backlight:
            self.backlight.post_cmd(BacklightDriver.CMD_OFF)
        else:
            logging.error('Backlight driver has not been initialized')

```

In order to stop the tornado application it is required to added a signal handler and stop the tornado event loop manually.

```python
is_closing = False

def signal_handler(sig, frame):
    global is_closing
    logging.info('Shutting down REST API...')
    is_closing = True

def try_exit():
    global is_closing
    if is_closing:
        IOLoop.instance().stop()
        logging.info("REST API shutdown")
```

Starting eveything in the main method.

```python
def main(args):
    port = args.port
    led_count = args.led_count
    led_pin = args.led_pin

    # Tell tornado to exit on SIGINT
    signal.signal(signal.SIGINT, signal_handler)

    # Initialize the static backlight driver
    BacklightRequestHandler.initialize_backlight(led_count, led_pin)

    # Create a tornado application
    app = Application([
        (r"/", BacklightRequestHandler)
    ])

    app.listen(port)

    logging.info('Starting backlight service on port {}'.format(port))
    PeriodicCallback(try_exit, 100).start()
    IOLoop.instance().start()

    # clean up the backlight driver
    BacklightRequestHandler.cleanup()

    logging.info('Exited')


if __name__ == '__main__':
    logging.basicConfig(filename='backlight.log', level=logging.DEBUG)

    parser = ArgumentParser()
    parser.add_argument('-c', '--led-count', default=60, help='Number of LEDs on strip')
    parser.add_argument('-g', '--led-pin', default=18, help='LED strip GPIO pin')
    parser.add_argument('-p', '--port', default=6142, help='RPC server port')

    args = parser.parse_args()

    try:
        main(args)
    except Exception as e:
        logging.error('{}'.format(e))
```

**Connecting to Home Assistant**

Home Assistant can make REST calls as a service. So I added an `input_boolean` to toggle the light strip and call a `rest_command` when it changes. I use a template to insert the `input_boolean`'s state directly in the POST.

```yaml
input_boolean:
  backlightctl:
    name: Control desk backlight
    initial: off

rest_command:
  backlightctl:
    method: post
    url: http://localhost:6142?command={\{states.input_boolean.backlightctl.state\}}
```

Ignore the `\` characters by the curly braces in the above snippet, that is to escape those characters in markdown.

I added the `automation` from the GUI. But here is the YAML:

```yaml
- id: '1530491188401'
  alias: backlightctl
  trigger:
  - entity_id: input_boolean.backlightctl
    platform: state
    from: 'on'
    to: 'off'
  - entity_id: input_boolean.backlightctl
    platform: state
    from: 'off'
    to: 'on'
  condition: []
  action:
  - data: {}
    service: rest_command.backlightctl
```

Well that's it! Pretty simple but opens up a lot of possibilities!


