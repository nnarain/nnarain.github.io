---
layout: post
title: Chip8 Assembler - Lexer
description: 
tag: ['chip8', 'assembler']
thumbnail: /assets/2017/10/16/
repo_url: https://github.com/nnarain/silcia
---


As mentioned before the lexer transforms the input data into a series of Tokens. So what is a token? A token is the meaningful components of the assemble file. So before we can write a lexer we have to know what we are trying to process!

```asm
            org $200

start
            LD I, #num1      ; Point I to the `1` sprite
            LD V0, 16        ; Load the x value of the sprite 
            LD V1, 16        ; Load the y value of the sprite
            
            DRW V0, V1, 5    ; Draw the sprite

end         JP #end          ; loop forever

; Sprites
num1
            db $20 $60 $20 $20 $70
```

Alright so what are we looking at?

Assembly languages are typically broken into 3 columns. The first column is for labels, these are identifiers for memory locations, The second column contains the instructions and their operands. Instructions are the human readable represention of the target's opcodes. The second column also contains directives, these are instructions to the assembler itself. The third columns is for comments.

Ok so how does this relate to tokens? We need to identify what individual bits of information in the file needs to be extracted for later use by program.

Well in this assembly file we need to ignore the whitespace and the comments and extract Directives, Labels and Instructions. Instructions have operands that come in a few forms. Operands could be a register (V0..VF, I, etc), numerical literals and also labels. Some instructions can have a memory address as an operand, obivously we wanted to be able to use labels for these arguments. In the above example I prefix the label operands with a '#' so they are easily identifiable. 

So the remaining tokens we need to parse are Registers, Numeric literals (decimal and hex) and Label operands.

In `lexer.rs` I define an enum for the Token.

```rust
/// Possible tokens that can exist in the Chip8 assembly file
#[derive(Debug, PartialEq, Clone)]
pub enum Token {
    Directive(String),
    Label(String),
    Instruction(String),
    Register(String),
    NumericLiteral(u32),
    LabelOperand(String)
}
```

Alright! So now we have a Token data type. How to we go about the actually lexing process?

We will be using Rust and `nom`. `nom` is a parser combinator library. What it lets you do is write a bunch of small simple parsers and combine them to make more complicated ones.

So we want to look at the smallest components of our file and write parsers for them. We can start by writing parsers for the Tokens we have defined above.

Now I don't want to get too side tracked with how `nom` works so here's a link to the [documentation](http://rust.unhandledexpression.com/nom/).

**Lex a Directive**

We start by using the `named!` macro and specify the parser name and input/output datatypes.

```rust

named!(lex_directive<&[u8], Token>(
    // ...
))

```

The input is a slice of type `u8` and the output is a single Token.

Next we use the `do_parse!` marco to chain a few built in `nom` macros to parse our directive.

```rust

named!(lex_directive<&[u8], Token>(
    do_parse!(
        directive: map_res!(map_res!(alt!(
            tag!("org") |
            tag!("db")
        ), from_utf8), FromStr::from_str) >>
        Token::Directive(directive)
    )
))

```

Alright so a lot happened there. The `map_res!` marcos are used to convert the parsed byte slice into a `String`. The `tag!` macros are where we are actaully grabbing the valid directive strings.

**Lex Label**

```rust

named!(lex_label<&[u8], Token>,
    do_parse!(
        label: map_res!(map_res!(alphanumeric, from_utf8), FromStr::from_str) >>
        (Token::Label(label))
    )
);

```

Similar as above. Except we use `nom`'s alpahnumeric parser.

**Lex Register**

```rust
/// Parse Registers
named!(lex_registers<&[u8], Token>,
    do_parse!(
        reg: map_res!(map_res!(alt!(
            tag!("V0") |
            tag!("V1") |
            tag!("V2") |
            tag!("V3") |
            tag!("V4") |
            tag!("V5") |
            tag!("V6") |
            tag!("V7") |
            tag!("V8") |
            tag!("V9") |
            tag!("VA") |
            tag!("VB") |
            tag!("VC") |
            tag!("VD") |
            tag!("VE") |
            tag!("VF") |
            tag!("I")  |
            tag!("DT") |
            tag!("ST") |
            tag!("F")  |
            tag!("[I]")
        ), from_utf8), FromStr::from_str) >>
        (Token::Register(reg))
    )
);
```

Same as the directive parser.

**Lex Numeric Literal**

Our numeric literals can take the form of a decimal or hexidecimal number. So we will write one parse to parse a decimal, another to parse a hex number and another to combine the two.

```rust
named!(lex_decimal_literal<&[u8], Token>,
    do_parse!(
        value: map_res!(digit, from_utf8) >>
        (Token::NumericLiteral(value.to_string().parse::<u32>().unwrap()))
    )
);
```

```rust
named!(lex_hex_literal<&[u8], Token>, 
    do_parse!(
        tag!("$") >>
        value: map_res!(hex_digit, from_utf8) >>
        (Token::NumericLiteral(u32::from_str_radix(value, 16).unwrap()))
    )
);
```

```rust
named!(lex_numeric_literal<&[u8], Token>,
    alt!(
        lex_decimal_literal | lex_hex_literal
    )
);
```

**Lex Label Operand**

```rust
named!(lex_label_operand<&[u8], Token>,
    do_parse!(
        tag!("#") >>
        label_operand: map_res!(map_res!(alphanumeric, from_utf8), FromStr::from_str) >>
        (Token::LabelOperand(label_operand))
    )
);
```

**Lex Instructions**

Before writing the instruction parser we need two more macros. A macro to parser spaces/tabs and another to parse the instruction keyword.

```rust
named!(lex_column_sep,
    take_while1_s!(is_space)
);
```

```rust
named!(lex_mnem<&[u8], Token>, 
    do_parse!(
        instr: map_res!(map_res!(alt_complete!(
            tag!("CLS")  |
            tag!("RET")  |
            tag!("SYS")  |
            tag!("JP")   |
            tag!("JR")   |
            tag!("CALL") |
            tag!("SE")   |
            tag!("SNE")  |
            tag!("LD")   |
            tag!("ADD")  |
            tag!("SUBN") |
            tag!("SUB")  |
            tag!("OR")   |
            tag!("AND")  |
            tag!("XOR")  |
            tag!("SHR")  |
            tag!("SHL")  |
            tag!("RND")  |
            tag!("DRW")  |
            tag!("SKP")  |
            tag!("SKNP")
        ), from_utf8), FromStr::from_str) >>
        (Token::Instruction(instr))
    )
);
```

To parse the instruction plus the operands:

```rust
named!(lex_instruction<&[u8], Vec<Token>>,
    do_parse!(
        mnem: lex_mnem >>
        opt!(lex_column_sep) >>
        operand1: opt!(alt_complete!(lex_registers | lex_numeric_literal | lex_label_operand)) >>
        opt!(lex_column_sep) >>
        tag!(",") >>
        opt!(lex_column_sep) >>
        operand2: opt!(alt_complete!(lex_registers | lex_numeric_literal | lex_label_operand)) >>
        opt!(lex_column_sep) >>
        tag!(",") >>
        opt!(lex_column_sep) >>
        operand3: opt!(lex_numeric_literal) >>
        ({
            let mut ret = vec![mnem];
            if let Some(operand1) = operand1 {
                ret.push(operand1);
            }
            if let Some(operand2) = operand2 {
                ret.push(operand2);
            }
            if let Some(operand3) = operand3 {
                ret.push(operand3);
            }

            ret
        })
    )
);
```

Instruction can have zero to 3 operands. So all operand parsers are wrap in the `opt!` macro. Also notice that this parser returns a `Vec<Token>` of Tokens.

**Lex line termination**

We need to lex what a line can possibly end with.

For example:

```asm
label   LD V0, $FF ; this is a comment
```

```rust
/// Consume comments
named!(lex_comments,
    do_parse!(
        tag!(";") >>
        bytes: not_line_ending >> 
        (bytes)
    )
);
```

```rust
/// Parse line ending
named!(lex_line_ending, 
    alt_complete!(
        tag!("\r\n") |
        tag!("\n")
    )
);
```

```rust
/// Parse what single assembly line can end with
named!(lex_line_termination,
    do_parse!(
        opt!(lex_column_sep) >>    // possible white space at end of line
        opt!(lex_comments) >>      // possible comment at end of line
        bytes: lex_line_ending >>  // lex line ending
        (bytes)
    )
);
```

Ok so that is all the individual pieces. Now we have to lex the possible combinations of these components.

**Lexing line combinations**

```rust
/// Parse line combination 1
/// E.g. \r\n
named!(lex_line1<&[u8], Vec<Token>>,
    do_parse!(
        lex_line_ending >>
        (Vec::new())
    )
);

/// Parse line combination 2
/// E.g. ; this is a comment
named!(lex_line2<&[u8], Vec<Token>>,
    do_parse!(
        lex_line_termination >>
        (Vec::new())
    )
);

/// Parse line combination 3
/// E.g. \t\t org $200
named!(lex_line3<&[u8], Vec<Token>>,
    do_parse!(
        lex_column_sep >>
        directive: lex_directives >>
        lex_column_sep >>
        numeric: lex_numeric_literal >>
        lex_line_termination >>
        (vec![directive, numeric])
    )
);

/// Parse line combination 4
/// E.g. label
named!(lex_line4<&[u8], Vec<Token>>, 
    do_parse!(
        label: lex_label >>
        lex_line_termination >>
        (vec![label])
    )
);

/// Parse line combination 5
/// E.g. LD V0, V1
named!(lex_line5<&[u8], Vec<Token>>,
    do_parse!(
        lex_column_sep >>
        instrs: lex_instruction >>
        lex_line_termination >>
        (instrs)
    )
);

/// Parse line combination 6
/// E.g. label LD V0, V1
named!(lex_line6<&[u8], Vec<Token>>,
    do_parse!(
        label: lex_label >>
        lex_column_sep >>
        instrs: lex_instruction >>
        lex_line_termination >>
        ({
            let mut tokens = vec![label];
            
            for i in instrs.iter() {
                tokens.push((*i).clone());
            }

            tokens
        })
    )
);

/// Parse line combination 7
/// E.g. db $0 $1 $2 ...
named!(lex_numeric_list_item<&[u8], Token>,
    do_parse!(
        n: lex_numeric_literal >>
        opt!(lex_column_sep) >>
        (n)
    )
);

named!(lex_line7<&[u8], Vec<Token>>,
    do_parse!(
        lex_column_sep >>
        directive: lex_directives >>
        lex_column_sep >>
        bytes: many1!(lex_numeric_list_item) >>
        lex_line_termination >>
        ({
            let mut tokens = vec![directive];
            
            for i in bytes.iter() {
                tokens.push((*i).clone());
            }

            tokens
        })
    )
);
```

**Lex all lines**

```rust
/// Combined line parser
named!(lex_lines<&[u8], Vec<Token>>,
    do_parse!(
        line_tokens: many0!(
            alt_complete!(
                lex_line1 |
                lex_line2 |
                lex_line3 |
                lex_line4 |
                lex_line5 |
                lex_line6 |
                lex_line7
            )
        ) >>
        ({
            let mut ret = Vec::new();
            for tokens in line_tokens.iter() {
                for token in tokens.iter() {
                    ret.push((*token).clone());
                }
            }

            ret
        })
    )
);
```

Now we write a combinator to lex all the line combinations. And expand the `Vec<Token>`s into a single `Vec<Token>`.

We use the combinator as following:

```rust
/// Convert input bytes into tokens
pub fn tokenize(input: &[u8]) -> Result<Vec<Token>, LexerError> {
    let lexer_result = lex_lines(input);

    match lexer_result {
        IResult::Done(_, tokens) => {
            Ok(tokens)
        },
        IResult::Error(_) => {
            Err(LexerError{message: String::from("Error in lexer")})
        },
        IResult::Incomplete(_) => {
            Err(LexerError{message: String::from("Error in lexer")})
        }
    }
}
```
