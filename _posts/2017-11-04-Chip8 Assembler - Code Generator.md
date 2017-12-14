---
layout: post
title: Chip8 Assembler - Code Generator
description: 
tag: ['chip8', 'assembler']
thumbnail: /assets/2017/11/17/
repo_url: https://github.com/nnarain/silica
---

In the last post `expressions` were created by grouping tokens together. Now its time to generate Chip8 opcodes from the expressions.

Semantics Checker
-----------------

I'm not going to go into the details of the semantics checker here. It is essentially a series of `match` and `if` statements to verify that the expressions are valid.

For example the following is an invalid expression.

```rust
[Instruction, Label, NumericLiteral]
``` 

It will also check if the operands for a given instruction are valid.

[Here is a link to the file](https://github.com/nnarain/silica/blob/master/src/assembler/semantics.rs)

Code Generator
--------------

Ok so what does the generator need to do? It needs to take an input of expressions, `Vec<Expression>`, and generate chip8 opcodes. 

What information will we need access to?
* The address to store the opcode
* Labels and the addresses they represent

Ok lets start with that.

```rust
/// Contains the logic to transform valid expressions of Tokens into
/// Chip8 opcodes
pub struct CodeGenerator {
    address_counter: u32,
    labels: HashMap<String, u32>,
    opcodes: Vec<u8>
}

impl CodeGenerator {
    pub fn new() -> Self {
        CodeGenerator {
            address_counter: 0,
            labels: HashMap::new(),
            opcodes: vec![0; 4096]
        }
    }

    // ...
```

An `address_counter` to track the current memory location of the opcode and a hash map called `labels` to keep track of labels.

```rust
    /// Consumes the code generator and the expressions and return a vetor containing the generated opecodes
    pub fn generate(mut self, exprs: Vec<Expression>) -> Vec<u8> {
        // iterate over the expressions
        for expr in exprs.iter() {
            self.process_expression(expr);
        }
    }
```

And a function to kink everything off.

We want to be able to process the different types of expressions. They can be `Directives`, `Labels` or `Instructions`.

We also want to ensure the expressions are valid.

```rust
    /// Process a new expression
    fn process_expression(&mut self, expr: &Expression) {
        // check that the expression is valid
        semantics::check(expr).unwrap();
        
        match expr[0] {
            Token::Directive(_) => {
                self.process_directive(expr);
            },
            Token::Label(_) => {
                self.process_label(expr);
            },
            Token::Instruction(_) => {
                self.process_instruction(expr);
            },
            _ => {
                panic!("Invalid token for start of expression");
            }
        }
    }
```

Process Directives
------------------

There are only two directives to process: `org` and `db`.
* `org` sets the `address_counter`
* `db` inserts arbitrary bytes into memory

```rust
    fn process_directive(&mut self, expr: &Expression) {
        if let Token::Directive(ref directive) = expr[0] {
            match directive.as_ref() {
                "org" => {
                    if let Token::NumericLiteral(address) = expr[1] {
                        // set the new address location
                        self.address_counter = address;
                    }
                },
                "db" => {
                    for i in 1..expr.len() {
                        if let Token::NumericLiteral(n) = expr[i] {
                            self.opcodes[self.address_counter as usize] = n as u8;
                            self.increment_address_counter(1);
                        }
                    }
                }
                _ => {}
            }
        }
    }
```

Process Labels
--------------

Processing labels in pretty straight forward. When a new label is encounter, insert the current `address_counter` into the hash map keyed by the label.

```rust
    fn process_label(&mut self, expr: &Expression) {
        if let Token::Label(ref label) = expr[0] {
            if !self.labels.contains_key(label) {
                self.labels.insert((*label).clone(), self.address_counter);
            }
            else {
                panic!("The label: {} has already been used", label);
            }
        }
    }
```

Process Instructions
--------------------

To process the instructions we match the string contained in the `Token::Intstruction` with one of the opcodes and then call a correspond processing function.

```rust
fn process_instruction(&mut self, expr: &Expression) {
    if let Token::Instruction(ref instr) = expr[0] {
        match instr.as_ref() {
            "CLS" => self.append_opcode(0x00, 0xE0),
            "RET" => self.append_opcode(0x00, 0xEE),
            "JP" => self.process_jump_instruction(0x10u8, expr),
            "JR" => self.process_jump_instruction(0xB0u8, expr),
            "CALL" => self.process_jump_instruction(0x20u8, expr),
            "SE" => self.process_se_instruction(0x30u8, 0x50u8, expr),
            "SNE" => self.process_se_instruction(0x40u8, 0x90u8, expr),
            "OR" => self.process_logical_instruction(0x01, expr),
            "AND" => self.process_logical_instruction(0x02, expr),
            "XOR" => self.process_logical_instruction(0x03, expr),
            "ADD" => self.process_add_instruction(expr),
            "SUB" => self.process_sub_instruction(expr, 0x05),
            "SHR" => self.process_sub_instruction(expr, 0x06),
            "SUBN" => self.process_sub_instruction(expr, 0x07),
            "SHL" => self.process_sub_instruction(expr, 0x0E),
            "SKP" => self.process_skip_instruction(expr, 0x9E),
            "SKNP" => self.process_skip_instruction(expr, 0xA1),
            "RND" => self.process_rnd_instruction(expr),
            "DRW" => self.process_draw_instruction(expr),
            "LD" => self.process_load_instruction(expr),
            _ => {} 
        }
    }
}
```

So since there are quite a few of them I'm not going to copy them all here. But I will go over `process_jump_instruction` as an example.

```rust
fn process_jump_instruction(&mut self, first: u8, expr: &Expression) {
    // if the operand is a numeric literal the opcode can be generated now
    if let Token::NumericLiteral(nnn) = expr[1] {
        let msb: u8 = first | (((nnn & 0xF00) >> 8) as u8);
        let lsb: u8 = (nnn & 0x0FF) as u8;
        self.append_opcode(msb, lsb);
    }
    // if the operand is a label operand...
    if let Token::LabelOperand(ref label) = expr[1] {
        // see if the address has been stored
        if self.labels.contains_key(label) {
            let address = self.labels[label];
            let msb: u8 = first | (((address & 0xF00) >> 8) as u8);
            let lsb: u8 = (address & 0xFF) as u8;
            self.append_opcode(msb, lsb); 
        }
        else {
            // if the address has not been encountered, queue as incomplete
            self.queue_incomplete_instruction(expr);
        }
    }
}
```

Ah something new. What happens if the label for an instruction doesn't exist yet? We queue the expression with the current address and come back to it later when all the labels have been added.

**Incomplete instructions**

```rust
/// Incomplete instruction
struct IncompleteInstruction {
    pub address: u32,
    pub expr: Expression
}

impl IncompleteInstruction {
    pub fn new(address: u32, expr: Expression) -> Self {
        IncompleteInstruction {
            address: address,
            expr: expr
        }
    }
}

fn queue_incomplete_instruction(&mut self, expr: &Expression) {
    let incomplete = IncompleteInstruction::new(self.address_counter, expr.clone());
    self.incomplete_queue.push(incomplete);
    self.increment_address_counter(2);
}
```

Back in the `generate` function, iterate over all the incomplete instructions after the initial processing loop.

```rust
    /// Consumes the code generator and the expressions and return a vetor containing the generated opecodes
    pub fn generate(mut self, exprs: Vec<Expression>) -> Vec<u8> {
        // iterate over the expressions
        for expr in exprs.iter() {
            self.process_expression(expr);
        }

        // perform a second pass of the expressions to add the ones that could not be completed
        while !self.incomplete_queue.is_empty() {
            let item = self.incomplete_queue.remove(0);
            self.address_counter = item.address;
            self.process_expression(&item.expr);
        }
    }
```
