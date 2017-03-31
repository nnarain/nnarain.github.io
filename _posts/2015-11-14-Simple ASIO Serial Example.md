---
layout: post
title: Simple ASIO Serial Example
description: Simple example of using ASIO for serial port communication using Visual Studio 2015
tag: ["asio", "c++", "serial-port", "visualstudio"]
thumbnail:
repo_url:
---

Recently I started using ASIO for local network communication, so I figured I'd get going with the serial port functions as well.

It's very straight forward, so I figured I'd write up a simple example.

For setting up ASIO with Visual Studio check my recent post [here]({% post_url 2015-11-3-Building ASIO Standalone with Visual Studio 2015 %}).


```c++
        #include <iostream>
        #include <string>

        #include <asio.hpp>

        #define MAXLEN 512 // maximum buffer size

        int main()
        {
            //
            asio::io_service io;

            try
            {
                // create a serial port object
                asio::serial_port serial(io);

                // open the platform specific device name
                // windows will be COM ports, linux will use /dev/ttyS* or /dev/ttyUSB*, etc
                serial.open("COM6");

                for (;;)
                {
                    // get a string from the user, sentiel is exit
                    std::string input;
                    std::cout << "Enter Message: ";
                    std::cin >> input;

                    if (input == "exit") break;

                    // write to the port
                    // asio::write guarantees that the entire buffer is written to the serial port
                    asio::write(serial, asio::buffer(input));

                    char data[MAXLEN];

                    // read bytes from the serial port
                    // asio::read will read bytes until the buffer is filled
                    size_t nread = asio::read(
                        serial, asio::buffer(data, input.length())
                    );

                    std::string message(data, nread);

                    std::cout << "Recieved: ";
                    std::cout << message << std::endl;
                }

                serial.close();
            }
            catch (asio::system_error& e)
            {
                std::cerr << e.what() << std::endl;
            }

            return 0;
        }
```
