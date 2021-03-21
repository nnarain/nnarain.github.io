---
layout: post
title: Prototype Macro Keypad
tag: ['arduino', 'keyboard', 'keypad']
repo_url: https://github.com/nnarain/keypad-prototype
---

![image not found!](/assets/2021/03/20/board.jpg)

I've been intrigued by DIY keyboards recently so figured I'd put a little prototype together. This is a keypad based on and Arduino Pro Micro.

Design
------

This board supports a 3x3 key matrix and an OLED display.

**Key Matrix**

A key matrix is used to optimized the number of GPIO required to read key presses. In this case 6 GPIO are needed to
read 9 keys.

Column GPIO are outputs and Row GPIO are inputs (with a pull-up resistor).

Columns are pulled LOW to select the column and Rows are read to determine which keys are pressed.

Diodes are placed together with each switch. This is to prevent "ghosting", where a combination of key presses results
in the micro controller reading key presses for switch that are not pressed.

![image not found!](/assets/2021/03/20/keymatrix.png)

**Micro Controller**

The Pro Micro has more then enough GPIO to support a 9 key matrix and it is very popular in the DIY keyboard space.


Firmware
--------

The proof of concept was trivial with Arduino's Keyboard library.

* Iterate over columns, pulling the pin LOW to select
  * Iterate over rows and check the state
  * If the key is pressed, send the keyboard input
* Set the column HIGH to deselect.

```c++
#include <Keyboard.h>

#define COL1 4
#define COL2 5
#define COL3 6
#define NUM_COLS 3

#define ROW1 7
#define ROW2 8
#define ROW3 9
#define NUM_ROWS 3

static const int COL_PINS[NUM_COLS] = {COL1, COL2, COL3};
static const int ROW_PINS[NUM_ROWS] = {ROW1, ROW2, ROW3};

static const char BUTTONS[NUM_COLS][NUM_ROWS] = { {'7', '4', '1'}, {'8', '5', '2'}, {'9', '6', '3'} };

void setup() {
  for (int i = 0; i < NUM_COLS; ++i)
  {
    pinMode(COL_PINS[i], OUTPUT);
  }

  for (int i = 0; i < NUM_COLS; ++i)
  {
    pinMode(ROW_PINS[i], INPUT);
  }

  Serial.begin(115200);
  Keyboard.begin();
}

void loop() {
  for (int col = 0; col < NUM_COLS; ++col)
  {
    // Select the column by pulling it LOW
    digitalWrite(COL_PINS[col], LOW);

    for (int row = 0; row < NUM_ROWS; ++row)
    {
      // Button pressed are a LOW signal
      if (digitalRead(ROW_PINS[row]) == LOW)
      {
        Keyboard.press(BUTTONS[col][row]);
      }
      else
      {
        Keyboard.release(BUTTONS[col][row]);
      }
    }

    //De-select column
    digitalWrite(COL_PINS[col], HIGH);
  }
}
```

Future Projects
---------------

* QMK Firmware

I'd like to try making a full sized keyboard, though I won't be able to use the Pro Micro since it doesn't has enough GPIO. Regardless of the MCU choice, the key matrix circuit is extendable.
