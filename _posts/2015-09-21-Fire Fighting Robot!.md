---
layout: post
title: Fire Fighting Robot!
description: A fire fighting robot I built in high school (2012)
tag: electronics
thumbnail: /assets/2015/09/21/thumbnail.jpg
---

Decided I needed to get my fire fighting robot up here!

![Image not found!](/assets/2015/09/21/thumbnail.jpg)

Equiped with two DC motors, servo, infrared range finder and a fan, this robot can navigate a mazed and extinguish a candle!

Video of it in action: 

<div class="embed-responsive embed-responsive-16by9">
	<iframe class="embed-responsive-item" src="https://www.youtube.com/embed/8brg6CSZgG8">
	</iframe>
</div>

<br>
<br>
Also found the MBasic code!

{% highlight basic %}

CPU = 16F876A
MHZ = 20
CONFIG 16242

; Fire Fighter, TEJ4MI 2012 - 2013

; This program will navigate our bot through the maze, search each room
; for the fire, extinguish the fire and return home.

; Author : Natesh Narain, Ibrahim Naamani
; version : 0.8.3
; Date Created : December 20 2012
; Last Modified : January 16 2013

; Analog to Digital setup ---
AN0 con 0
AN1 con 1
CLK con 2

ADSETUP con %10000100

; Analog input ---
wall_in var word              ; Wall sensor input
candle_in var word            ; Candle sensor input

; Servo --- 
position_90 var word          ; Pulse duration to position servo straight forwards
position_0 var word           ; Pulse duration to position servo to left of bot 
position_180 var word         ; Pulse duration to position servo to right of bot
position_current var word     ; Current position of servo used when sweeping
counter var byte              ; Counter used in servo for loops

; Various Constants ---
delay_line_clearence var word ; Delay to clear the line
gap var word                  ; This value is added\subtracted from the wall distance so...
							  ; that the bot has a "gap" where it moves forward
extinguish_range var word	  ; Range bot must be in to extinguish candle
extinguish_value var word

; Measurements ---
wall_distance var word        ; Distance from wall bot starts at
wall_distance_right var word  ; Distance from right of bot
wall_distance_left var word   ; Distance from left of bot
wall_snapshot var word		  ; Distance used to make a 180

room_width_right var word	  ; Distance to end of room to right of bot
room_width_left var word	  ; Distance to end of room to left of bot 
room_width var word			  ; Room_width_right - room_width_left
room_length var word		  ; Approximate distance from end

candle_snapshot var word

candle_distance var word	  ; Distance candle is from bot, when bot first finds candle

; Trackers --- 
in_room var bit               ; Keeps track of whether or not bot is in a room or not

candle_in_room var bit        ; Keeps track of whether candle is in room or not
candle_on_right var bit       ; Keeps track of where candle is 
candle_on_left var bit        ; Keeps track of where candle is
candle_is_out var bit		  ; Used to check if candle is out
candle_zone var bit			  ; Used to check if bot is in white ring around candle
candle_was_in_room var bit 	  ; Used to determine which exit sub-routine to use

extra_sweep var bit			  ; Tells bot to do a more thorough sweep of room --- REMOVE!!!

line_left_tracker var bit     ; Keeps track of if the left of bot goes over line
line_right_tracker var bit    ; Keeps track of if right of bot goes over line

exit_left var bit			  ; Tells bot to turn left after room exit
exit_right var bit			  ; Tells bot to turn right after room exit

room_counter var nib          ; Counts number of rooms entered

sweep_position var byte 	  ; 

mission_complete var bit 	  ; Fire has been extinguished

; Intialize LCD
LCDWRITE B4\B5\B6, portb.nib0, [INITLCD1, INITLCD2, TWOLINE, CLEAR, HOME, SCR]

; Setup before main loop --- 
gosub leds_off
gosub init_vars
gosub record_distance

; Main loop start ----------------------------------------------------->
main

	; Clear LCD
	LCDWRITE B4\B5\B6, portb.nib0, [ CLEAR ]

	; If bot is not in room
	if in_room = 0 then
	
		gosub forwards			 ; Head straight forwards
		gosub hug_wall			 ; Follow along the right wall
		gosub check_for_entrance ; Check for the entrance of room
	
	endif 
	
	; When bot is in a room
	if in_room = 1 then
	
		gosub stop_motors ; Do a full stop
	;	gosub get_room_dimensions
		gosub sweep2	  ; Scan for candle
		
		; Candle is in room
		if candle_in_room  = 1 then
		
			gosub align_with_candle ; Line up with the candle
			gosub approach_candle   ; Move towards candle
			gosub extinguish2		; And blow out the candle
			
			candle_in_room = 0		; Candle is no longer in room
			candle_was_in_room = 1  ; 
			
		endif 
		
		; Candle is not in room
		if candle_in_room = 0 then
		
			; If candle was not in the room, which means bot has not moved
			if candle_was_in_room = 0 then
			
				gosub exit_room_from_entrance ; Exit the room (knowing bot is at entrance)
				
				candle_was_in_room = 0
			
			endif
			
			if candle_was_in_room = 1 then
			
				candle_was_in_room = 0
			
			endif
			
			in_room = 0 ; Bot no longer in room
		
		endif
	
	endif

goto main

; Subroutines --- 

; Sweeps servo from 0 to 180
; sweep
	
	; Sweep servo from 0 to 180
	; for position_current = position_0 to position_180 step 100
	
		; Positions servo at the current position
		; for counter = 0 to 50 step 1
	
			; pulsout a5, position_current
			
		;	pause 20
			
			; Find which side of bot candle is on
			; gosub determine_candle_location
		
		; next
	
	; next

	; After the servo completes sweep, rotate to 90
	; gosub rotate_90

; return

sweep2

	; Rotate to right, starting point of sweep
	gosub rotate_0

	; Rotates to left
	for counter = 0 to 100 step 1
	
		pulsout a5, position_180
		
		gosub update_analog_input
		
		if candle_in <= 50 then
		
			gosub determine_candle_location2
			
			candle_snapshot = candle_in
		
		endif
	
	next
	
	gosub rotate_90

return

; Will determine which side of bot candle is on
; determine_candle_location

	; If candle input is nearly zero. (Not exactly because it might not go to exactly zero)
	; if candle_in < 200 then
	
		; Uses 90 degrees to determine which side of bot candle is on
		; if position_current < position_90 then
		
		;	candle_on_right = 1 ; might have to switch
			; candle_in_room = 1
		
		; endif
		
		; if position_current > position_90 then 
		
		;	candle_on_left = 1 ; might have to switch
		;	candle_in_room = 1
		
		; endif
	
	 ; endif

	; Candle isn't on either side of room
	; if candle_on_right = 0 and candle_on_left = 0 then
	
		; candle_in_room = 0
	
	; endif
	
; return

; uses for loop counter variable to determine candle location
determine_candle_location2

	sweep_position = counter

	if counter < 50 then 
	
		candle_on_right = 1
	
	elseif counter > 50
	
		candle_on_left = 1
	
	endif

	if candle_in < 50 then 
	
		candle_in_room = 1	
	
	endif
	
	if candle_in > 900 then
	
		candle_in_room = 0
	
	endif

return

; Lines bot up with candle
align_with_candle

	if sweep_position >= 80 then 
	
		gosub forwards
		
		pause 500
	
	elseif sweep_position <= 20
	
		gosub forwards
		
		pause 500
	
	endif

	gosub stop_motors
	
	if candle_on_left = 1 then
	
		; Rotate left until candle sensor sees candle
		repeat
		
			gosub turn_left
			gosub update_analog_input

		until candle_in <= 50 ; candle_snapshot
		
		gosub stop_motors
	
	endif 
	
	if candle_on_right = 1 then
	
		; Rotate right until candle sensor sees candle
		repeat
		
			gosub turn_right
			gosub update_analog_input
		
		until candle_in <= 50 ; candle_snapshot
		
		gosub stop_motors
	
	endif

return

approach_candle

	repeat 
	
		gosub forwards
		gosub check_for_entrance ; rename this sub-routine
		
	until candle_zone = 1 
	
	gosub stop_motors
	
return

; Bot will find its way out of room
exit_room 

	

return

; This subroutine is called when bot has determined that there is no candle in the room
exit_room_from_entrance

	; Face left wall and get distance from bot
	gosub rotate_180
	gosub update_analog_input
	
	wall_snapshot = wall_in
	
	; Face right, this is so bot can wall hug after the 180
	gosub rotate_0
	
	; Turn left until wall sensor is same distance from wall as before
	repeat
	
		gosub turn_left
		gosub update_analog_input
	
	until wall_in >= wall_snapshot
	
	wall_snapshot = 0
	
	gosub forwards
	
	pause 1000 ; Clear the line
	
	gosub stop_motors	
	
;	gosub turn_left
	
;	pause 600

	gosub determine_exit_direction

return

back_track

	repeat
	
		gosub backwards
		gosub update_analog_input
	
	until wall_in <= candle_distance

return

; Determines which direction bot should turn after exit
determine_exit_direction

	; Determine distance from bots right
	gosub rotate_0
	gosub update_analog_input
	
	wall_distance_right = wall_in
	
	; Determine distance from bots left
	gosub rotate_180
	gosub update_analog_input
	
	wall_distance_left = wall_in
	
	gosub rotate_90
	
	; Sets the corresponding tracker to which ever distance is greater,
	; the reason for this is based off the layout of the maze
	if wall_distance_left > wall_distance_right then
	
	;	exit_left = 1
	
		repeat 
		
			gosub turn_right
			gosub update_analog_input
		
		until wall_in <= wall_distance_right
	
	elseif wall_distance_left < wall_distance_right
	
		;exit_right = 1
		
		repeat 
		
			gosub turn_left
			gosub update_analog_input
		
		until wall_in <= wall_distance_left
	
	endif

	pause 100

	gosub stop_motors

	; Finishing by pointing servo right
	gosub rotate_0
	
return

; Gets length and width of room
get_room_dimensions

	; Distance from bot's right
	gosub rotate_0
	gosub update_analog_input
	
	room_width_right = wall_in
	
	; Distance straight ahead of bot
	gosub rotate_90
	gosub update_analog_input
	
	room_length = wall_in
	
	; Distance to bot's left
	gosub rotate_180
	gosub update_analog_input
	
	room_width_left = wall_in
	
	; Actual distance of room
	room_width = room_width_right - room_width_left

return

; Runs the fan until the candle is out
extinguish

	repeat
	
		high b7
		
		gosub update_analog_input
	
	until candle_in > 950

	low b7
	
return

extinguish2

	candle_is_out = 0

	repeat

		repeat
	
			high b7
			
			gosub update_analog_input
	
		until candle_in > extinguish_value
		
		low b7
		
		pause 400 ; This will allow enough real world time to pass to see if the
				  ; candle will continue to burn	
		
		gosub update_analog_input
		
		if candle_in < 800 then
		
			candle_is_out = 0
		
		endif
		
		if candle_in > extinguish_value then
		
			candle_is_out = 1
		
		endif

	until candle_is_out = 1
		
return

; Checks for line to entrance, and will set corresponding tracker to save the bot's state
; (In room or not in room)
check_for_entrance

	gosub check_line_left
	gosub check_line_right
	
	; Checks if bot has crossed line
	if line_left_tracker = 1 and line_right_tracker = 1 then
	
		; Checks if bot is not in room
		if in_room = 0 then
		
			in_room = 1
			room_counter = room_counter + 1
		
		; Checks if bot is in room
		elseif in_room = 1
		
		;	in_room = 0
			candle_zone = 1
		
		endif
	
		line_left_tracker = 0
		line_right_tracker = 0
	
	endif

return

; Checks Left side of bot for line
check_line_left

	; Check left side
	if portc.bit0 = 1 then
	
		line_left_tracker = 1
	
		; Checks right side
		if portc.bit1 = 0 then
		
			; Lets right side catch up
			repeat
			
				gosub stall_left
			
			until portc.bit1 = 1
		
			line_right_tracker = 1
		
			; Resumes left motor
		;	gosub motor_left_forwards
		gosub forwards
			
			; Clears the line
			pause delay_line_clearence
		
		endif
	
	endif

return

; Checks right side of bot for line
check_line_right

	; Checks right
	if portc.bit1 = 1 then
	
		line_right_tracker = 1
	
		; Checks left
		if portc.bit0 = 0 then
		
			; Lets left side catch up
			repeat
			
				gosub stall_right
			
			until portc.bit0 = 1
		
			line_left_tracker = 1
		
		endif
	
		; Resumes right motor    
		;gosub motor_right_forwards
		gosub forwards
			
		; Clears the line			
		pause delay_line_clearence
	
	
	endif
	
return

; Adjusts bots path, to follow along side a wall
hug_wall

	gosub update_analog_input
	
	; Checks if bot is too close to wall
	if wall_in > wall_distance then
		
		; Move away from wall
		repeat
		
			gosub stall_left
			gosub update_analog_input
		
		until wall_in <= wall_distance + gap
	
	endif
	
	; Checks if bot is to close to wall
	if wall_in < wall_distance then
		
		; Move towards wall
		repeat
		
			gosub stall_right
			gosub update_analog_input
		
		until wall_in >= wall_distance - gap
	
	endif

return

; Updates analog values
update_analog_input

	ADIN AN1,CLK,ADSETUP,wall_in   ; Update wall sensor
	ADIN AN0,CLK,ADSETUP,candle_in ; Update candle sensor
	
	gosub display_readings		   ; Print info to LCD

return

; Writes to LCD. Short forms are used so that all reading can be displayed at once
display_readings

;	LCDWRITE B4\B5\B6, portb.nib0, [scrram+$0, "W- "]   ; "W" short for wall
;	LCDWRITE B4\B5\B6, portb.nib0, [dec wall_in]	    ; Wall sensor input
;	LCDWRITE B4\B5\B6, portb.nib0, [scrram+$40," WS- "] ; "WD" short for wall distance
;	LCDWRITE B4\B5\B6, portb.nib0, [dec wall_snapshot]  ; Initial distance measurement
	LCDWRITE B4\B5\B6, portb.nib0, [scrram+$0, "C- "]   ; "C" short for candle
	LCDWRITE B4\B5\B6, portb.nib0, [dec candle_in]      ; Candle sensor input
;	LCDWRITE B4\B5\B6, portb.nib0, [scrra+$0, "> "]
;	LCDWRITE B4\B5\B6, portb.nib0, [dec candle_in_room]
;	LCDWRITE B4\B5\B6, portb.nib0, [scrram+$40, "CO- "]
;	LCDWRITE B4\B5\B6, portb.nib0, [dec candle_is_out]
;	LCDWRITE B4\B5\B6, portb.nib0, [scrram+$0, "CoL - "]
;	LCDWRITE B4\B5\B6, portb.nib0, [dec candle_on_left]
;	LCDWRITE B4\B5\B6, portb.nib0, [scrram+$40, "CoR - "]
;	LCDWRITE B4\B5\B6, portb.nib0, [dec candle_on_right]
	LCDWRITE B4\B5\B6, portb.nib0, [scrram+$40, "CS- "]
	LCDWRITE B4\B5\B6, portb.nib0, [dec candle_snapshot]


return

; Gets an initial distance from wall and uses that to guide itself
record_distance

	ADIN AN1,CLK,ADSETUP,wall_in

	gosub rotate_0

	pause 100 ; Reconsider a pause in this subroutine -------------------------------------------------------------

	wall_distance = wall_in
	
return

; Faces servo straight ahead
rotate_90

	for counter = 0 to 50 step 1
	
		pulsout a5, position_90
		
		pause 20
	
	next

return

; Faces servo to left of bot
rotate_180

	for counter = 0 to 50 step 1
	
		pulsout a5, position_180
		
		pause 20
	
	next

return

; Faces servo to right of bot
rotate_0

	for counter = 0 to 50 step 1
	
		pulsout a5, position_0
		
		pause 20
	
	next

return

forwards

	gosub motor_left_forwards
	gosub motor_right_forwards

return

motor_left_forwards

	low c2
	high c3

return

motor_right_forwards

	high c4
	low c5

return

backwards

	gosub motor_right_backwards
	gosub motor_left_backwards

return

motor_right_backwards

	low c4
	high c5

return

motor_left_backwards

	high c2
	low c3

return

turn_right

	gosub motor_left_forwards
	gosub motor_right_backwards

return

turn_left

	gosub motor_right_forwards
	gosub motor_left_backwards

return

stop_motors

	gosub stall_left
	gosub stall_right

return

stall_left

	low c2
	low c3

return

stall_right
	
	low c4
	low c5	

return

; Initialize all variables
init_vars

	position_90 = 1760
	position_180 = 2500
	position_0 = 900
	position_current = 0
	
	candle_in_room = 0
	candle_on_left = 0
	candle_on_right = 0
	candle_zone = 0
	candle_was_in_room = 0
	
	candle_snapshot = 0
	
	delay_line_clearence = 200
	gap = 100
	extinguish_range = 100
	extinguish_value = 930
	
	wall_distance_right = 0
	wall_distance_left = 0
	wall_snapshot = 0
	
	in_room = 0
	line_left_tracker = 0
	line_right_tracker = 0
	
	room_counter = 0
	
	sweep_position = 0
	
	mission_complete = 0

return

; When the motherboard first starts up all the LEDs are on
leds_off

	low a5
	
	low b7
	
	low c2
	low c3
	low c4
	low c5

return


{% endhighlight %}