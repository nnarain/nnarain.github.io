---
layout: post
title: FTL - Platform Independent Drivers
tag: ['firmware', 'c++']
repo_url: https://github.com/nnarain/ftl
---

When it comes to writing drivers I find that I often see code on the internet isn't all that modular or portable. It may be written for a specific micro-controller with no real way to unit test or reuse in another project. The exception here would be platforms supported by Arduino, but what if you don't want to build you project in a sketch?

I've found that whipping out an Arduino board for prototyping is great, but what happens when you want to move to another platform for the final product. Write the driver again?

This is why I've started structuring drivers I write into the library FTL (Firmware Template Library).

This is an attempt to write the drivers in terms of a generic interface, and as long as a platform supports that interface, the driver should "just work".

This is at a relatively basic stage and currently I'm only working with AVR processors but I think it is a fairly solid approach.

FTL
---

Here's a quick example for using the PCA9685 (A 16-channel PWM controller or I2C).

```c++
#include <ftl/logging/logger.hpp>
#include <ftl/comms/uart.hpp>
#include <ftl/comms/i2c/i2c_device.hpp>

#include <ftl/drivers/pwm/pca9685.hpp>

// Auto detects platforms (and provides the `ftl::platform::Hardware` class)
#include <ftl/platform/platform.hpp>

using namespace ftl::drivers;
using namespace ftl::logging;
using namespace ftl::platform;

int main()
{
    // Setup serial logger
    Logger<Hardware::UART0> logger{ftl::comms::uart::BaudRate::Rate_9600};
    SystemLogger::instance().setLogger(&logger);

    // Initialized I2C
    Hardware::I2C0::initialize(ftl::comms::i2c::ClockMode::Fast);

    // Initialize the PWM controller on address 0x70
    Pca9685<Hardware::I2C0> pwm{0x70};

    if (pwm.initialize())
    {
        LOG_INFO("PWM controller initialized");
    }
    else
    {
        LOG_ERROR("PWM controller failed to initialize");
    }

    // Set to 50Hz
    LOG_INFO("Setting freq to 50Hz");
    pwm.setFrequency(50.0f);

    pwm.enable(true);

    for(;;)
    {
        // Sweep
        for (auto i = 0; i < 11; ++i)
        {
            float duty = (float)i * 0.1f;
            pwm.setDutyCycle(0, duty);
            Hardware::Timer::delayMs(100);
        }
    }

    return 0;
}
```

On the surface there is no platform specific code. All platform specific interfaces are encapsulated by the class `ftl::platform::Hardware`.

The logger is instantiated with a hardware UART interface, `Hardware::UART0`, and the PCA9685 is instantiated with the a hardware I2C interface,  `Hardware::I2C0`.

In the case of the logger, as long as the supplied type has a member function with the signature: `write(const char*)`, it can be used as a logger (simply writing each character of a string to the serial port).

The same applies to the I2C interface but there are more functions:

```c++
    class HardwareI2C
    {
    public:
        /**
         * Initialize the I2C interface
        */
        static void initialize(comms::i2c::ClockMode clock = comms::i2c::ClockMode::Normal);
        /**
         * Begin the I2C transaction
        */
        void begin(uint8_t address, comms::i2c::SlaMode mode);
        /**
        * End the transaction
        */
        void end();
        /**
         * Send I2C START condition
        */
        void start();
        /**
         * Send I2C STOP condition
        */
        void stop();
        /**
         * Send a byte on the I2C bus
        */
        void write(uint8_t data);
        /**
         * Read a byte from the I2C bus
        */
        uint8_t read(bool ack);
        /**
         * Get I2C bus status
        */
        comms::i2c::State status() const;
    };
```

I talked about this in a [previous post]({% post_url 2020-12-01-SSD1306 OLED Display Driver using I2C %}).

**Why templates?**

The main idea was to model the application hardware in the type system (i.e. At compile time I know the PCA9685 is connected to I2C0 and the logger is connected to UART0).

The other method using interface classes would incur runtime overhead due to vtable dispatch.

Though the thing I do not like about template based interfaces is the lack of explicitness. In the embedded world I think we are still limited to C++11 or maybe C++14. But this sort of library could really use C++20's `concepts`.

**Layering Interfaces**

This is one the cooler parts of this approach.

Adafruit's Motor Shield V2 can driver up to four motors over I2C. They do this by using a feature on the PCA9685 that lets you set the channels to either always ON or always OFF (effectively giving you a 16 channel GPIO expander over I2C). The PCA9685 is wired up to two H-bridge ICs (TB6612FNG) to control the DC motors.

The TB6612FNG can be described as:

```c++
/**
 * Driver IC for Dual DC Motors
 * 
 * \tparam GpioGroup A GPIO group interface
 * \tparam PWMGroup A PWM group interface
 * \tparam PinPackage The pin corresponding to the driver IC
 */
template<typename GpioGroup, typename PWMGroup, typename PinPackage>
class Tb6612fng { ... };
```

And the motor shield:

```c++
/**
 * Adafruit Motor Shield Driver
 */
template<typename I2C>
class MotorShield
{
    // The PCA9685 can act as a GPIO group and a PWM group
    using PinDriver = Pca9685<I2C>;
    using MotorDriver1 = Tb6612fng<PinDriver, PinDriver, MotorShieldDriver1PinPackage>;
    using MotorDriver2 = Tb6612fng<PinDriver, PinDriver, MotorShieldDriver2PinPackage>;
public:
    MotorShield(uint8_t address) : driver_{address}, motor1_{driver_, driver_}, motor2_{driver_, driver_}
    {
    }
    ...
private:
    PinDriver driver_;
    MotorDriver1 motor1_;
    MotorDriver2 motor2_;
}
```

The PCA8695 is used for both PWM and GPIO interfaces.

Usage:

```c++
int main()
{
    Logger<Hardware::UART0> logger{ftl::comms::uart::BaudRate::Rate_9600};
    SystemLogger::instance().setLogger(&logger);

    Hardware::I2C0::initialize(ftl::comms::i2c::ClockMode::Fast);

    // Simply provide an I2C interface
    MotorShield<Hardware::I2C0> motors{0x70};

    if (!motors.initialize(1000))
    {
        LOG_ERROR("failed to init");
    }

    LOG_INFO("Starting motor example");

    for(;;)
    {
        motors.forward(0);
        Hardware::Timer::delayMs(2500);
        motors.backward(0);
        Hardware::Timer::delayMs(2500);
    }

    return 0;
}
```

**Future**

Personally I'm debating on whether I move to Rust for embedded development (lulz). The Rust community already has [embedded-hal](https://github.com/rust-embedded/embedded-hal), which is basically what I'm attempting to do here. Also Rust has `traits` which similar to C++ `concepts`.

That said this is how I'd approached the problem using C++.
