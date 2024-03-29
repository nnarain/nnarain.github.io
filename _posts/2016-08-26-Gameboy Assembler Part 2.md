---
layout: post
title: Gameboy Assembler Part 2
description: Lexical Analyser for Gameboy Assember
tag: ["c++", "flex", "gameboy", "assembly"]
thumbnail: /assets/2016/08/26/assemblerflow.png
repo: nnarain/gameboy-assembler
prev_post: 2016-08-26-Gameboy Assembler Part 1
---

Lexical Analyser
----------------

Will be using the linux program `flex` to build the lexical analyser.

We do this by defining regular expressions to match the tokens we want to pull out of the assembly file.

First lets look at the assembly file break down.

```assembly

        org $100

start:

        ld B, 5 ; This is a comment
        nop
        nop
        ld C, $10

        jp #start

```

An assembly file is broken into 3 columns. First column is used for labels, the second for mnemonics (the instructions we use) and directives (instructions to the assembler) and the third is for comments.

The first and second column are separated by white space (spaces and tab characters). Comments start with the ';' character.

Instructions can't exist on 2 separate lines. They are isolated to a single line (this makes things easier!).

Mnemonics can have zero, one or two operands separated by a comma.

So the tokens we want to extract will be:

* labels
* mnemonics
* operands
* directives

We will need to come up with regular expressions to match these tokens.

**Introducing Flex**

Flex uses a lex file `.l` to define regular expressions and code for the lexical analyser. Flex will produce a `.cpp` file from the input flex file.

There are a few different sections of a flex file. The first section is C++ code that will be copy directly to the output `.cpp` file.

```c++

%{
    #include <iostream>
    #include <sstream>
    #include <string>

    #define YY_DECL int yylex()

    #include "parser.hpp"

    using namespace std;  
%}
```

I include some files ww will need for later. And the rest is from flex tutorials online. Note parse.cpp does not exist yet it will be generated by `bison` later.

Immediately after this section we can add some flex options. I'm enabling the `yylineno` option.

```c++

%{
    #include <iostream>
    #include <sstream>
    #include <string>

    #define YY_DECL int yylex()

    #include "parser.hpp"

    using namespace std;  
%}

%option yylineno

```

Now the main section will be where the regular expressions store defined.

Along with the regular expression flex lets to add a block of code. This code will be executed whenever there is a match for that particular expression.

```c++

...

<regular expression> {
    <block of code>
}

```

Now we need to define regular expressions to define our file. As mentioned above our assembly file is white space senitive and works line by line. So we will need to detect white space and new line characters. Regular expressions for white space and newline below:

```c++

...

[ \t]+ {
    return T_WHITESPACE;
}

\n {
    return T_NEWLINE;
}

```

[Here](https://regex101.com/) is a good site for learning about regex.

We will also want to match comments and commas (between operands).

```c++

...

[ \t]+ {
    return T_WHITESPACE;
}

\n {
    return T_NEWLINE;
}

;.* {
    return T_COMMENT;
}

, {
    return T_COMMA;
}

```

OK. That's the easy stuff.

Flex also lets us store values our tokens into a union called `yylval` and have them available for later use. `yylval` will be defined later.

We will use this for storing values for labels, and operands.

Lets matching decimal and hex numbers and storing their values.


```c++

...

[0-9]+ {
    // match decimal number
    yylval.ival = std::stoi(std::string(yytext), 0, 10);
    return T_INT;
}

\$[a-fA-F0-9]{1,4} {
    // match hex number
    yylval.ival = std::stoi(std::string(yytext+1), 0, 16);
    return T_INT;
}

```
Matching the remaining tokens is just as easy.

```c++

...

org {
    yylval.sval = new string(yytext);
    return T_DIRECTIVE;
}

[a-zA-Z][a-zA-Z0-9_]*: {
    string s(yytext);
    yylval.sval = new string(s.begin(), s.end()-1);
    return T_LABEL;
}

#[a-zA-Z][a-zA-Z0-9_]* {
    string s(yytext);
    yylval.sval = new string(s.begin()+1, s.end());
    return T_USE_LABEL;
}

[a-z]+ {
    yylval.sval = new string(yytext);
    return T_MNEM;
}

[ABCDEFHLSPNZ]{1,2} {
    yylval.sval = new string(yytext);
    return T_REG_SYM;
}

\([ABCDEFHLSPNZ]{1,2}\) {
    yylval.sval = new string(yytext);
    return T_REG_SYM;
}

```

`T_REG_SYM` is used to match built in register symbols like, A, B, C, D, E, G, H, L and AF, BC, DE, HL.


And that's it! Next is the Parser.
