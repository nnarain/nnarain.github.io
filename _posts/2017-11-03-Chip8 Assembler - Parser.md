---
layout: post
title: Chip8 Assembler - Parser
description: 
tag: ['chip8', 'assembler']
thumbnail: /assets/2017/11/03/
repo_url: http://github.com/nnarain/silica
---

The parser will turn the generated tokens into Expressions. Expressions are meaningful groupings of Tokens.

For example:

```rust
// Example: LD V0, $FF
Instruction Register NumericLiteral
```

The above expression would represent an assembly instruction that has two operands, a register and a numeric literal.

The parser will also use `nom`, the input type will simply be Tokens instead of a byte slice and the output type will be `Vector<Token>`.

Helper Macros
-------------

First lets create some helper macros to aid in parsing the token stream.

The `tag_token!` macro is used in the same way the `tag!` macro is used. I'm pretty new to Rust macros but this is the way I decided to do it. We want to return a `nom::IResult<I, O, E>` type with the `&[Token]` input type and `Token` output type.

```rust
macro_rules! tag_token {
    ($i: expr, $tag: pat) => (
        {
            let ret: IResult<&[Token], Token, u32> = 
            // check if there is enough data
            if $i.len() > 0 {
                // match against first element in the slice
                match $i[0] {
                    // matches specified token
                    $tag => {
                        // return Done with the new slice and a copy of the Token
                        IResult::Done(&$i[1..], $i[0].clone())
                    },
                    // not the specified Token, return an error
                    _ => {
                        IResult::Error(error_position!(ErrorKind::Tag, $i))
                    }
                }
            }
            else {
                // not enough data, return incomplete
                IResult::Incomplete(Needed::Size(1))
            };

            ret
        }
    )
}
```

The next macro was created because I wanted a similar behavior to `alt_complete!` but returns a `Option<...>`.

```rust
macro_rules! opt_complete(
    ($i:expr, $submac:ident!( $($args:tt)* )) => (
    {
        let i_ = $i.clone();
        match $submac!(i_, $($args)*) {
            IResult::Done(i,o)     => IResult::Done(i, ::std::option::Option::Some(o)),
            _                      => {
                let res: IResult<_,_> = IResult::Done($i, ::std::option::Option::None);
                res
            },
        }
    }
    );
    ($i:expr, $f:expr) => (
        opt_complete!($i, call!($f));
    );
);
```

The usage for both macros will be seen in the following snippets.

Alright so now we have to parse the possible combinations of expressions, similar to what was done in the lexer.

Parsing Labels
--------------

First is the easiest. Parsing labels. Labels are processed independently of the rest of the Tokens so they make up their own expressions.

```rust
/// parse labels from tokens
named!(parse_label<&[Token], Expression>,
    do_parse!(
        label: tag_token!(Token::Label(_)) >>
        (vec![label])
    )    
);
```

Parsing directives
------------------

```rust
/// parse directive
named!(parse_directive<&[Token], Expression>,
    do_parse!(
        directive: tag_token!(Token::Directive(_)) >>
        nums: many1!(tag_token!(Token::NumericLiteral(_))) >>
        ({
            let mut ret = vec![directive];
            for n in nums.iter() {
                ret.push((*n).clone());
            }

            ret
        })
    )
);
```

The specific directives I've implemented,`org` and `db`, follow this pattern. A directive token followed by one or more numeric literal tokens.

Parsing Instructions
--------------------

```rust
/// parse instructions
named!(parse_instructions<&[Token], Expression>,
    do_parse!(
        instr: tag_token!(Token::Instruction(_)) >>
        operand1: opt_complete!(alt_complete!(
            tag_token!(Token::Register(_)) |
            tag_token!(Token::NumericLiteral(_)) |
            tag_token!(Token::LabelOperand(_))
        )) >>
        opt_complete!(tag_token!(Token::Comma)) >>
        operand2: opt_complete!(alt_complete!(
            tag_token!(Token::Register(_)) |
            tag_token!(Token::NumericLiteral(_)) |
            tag_token!(Token::LabelOperand(_))
        )) >>
        opt_complete!(tag_token!(Token::Comma)) >>
        operand3: opt_complete!(tag_token!(Token::NumericLiteral(_))) >>
        ({
            let mut ret = vec![instr];
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

Parsing the instructions is a little more involved but not complicate. First step is to tag an instruction token. Then optionally tag the possible operands. There is the potential that a instruction has thress operands their type can be `Register`, `NumericLiteral` and `LabelOperand`

Parse all Expressions
---------------------

```rust
/// parse expressions from the token stream
named!(parse_expressions<&[Token], Vec<Expression>>,
    do_parse!(
        exprs: many0!(
            alt_complete!(
                parse_directive |
                parse_label |
                parse_instructions
            )
        ) >>
        (exprs)
    )
);
```

Just like in the lexer we create a parser to parse all possible expression combinations.

```rust
/// parse expressions from tokens
pub fn parse(tokens: Vec<Token>) -> Result<Vec<Expression>, ParserError> {
    let result = parse_expressions(&tokens[..]);

    match result {
        IResult::Done(_, exprs) => Ok(exprs),
        _ => Err(ParserError{message: String::from("Error parsing tokens")})
    }
}
```

Create a function that uses the combined parser.