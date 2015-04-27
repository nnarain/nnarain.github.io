---
layout: post
title: Platform Protocol
description: The protocol used to communicate with the Platform Controller
tag: HCS12 embedded-systems java
thumbnail: assets/2015/04/27/thumb.png
---

Protocol
--------

The Platform controller uses an ASCII protocol for communication with the host. Using this form of protocol allows better cross communication with varying host platforms.

The protocol consists of sending text packets in the form:


<div class="well well-sm">
	<b>&lt;CMD ARG1 ARG2 ARG3 ... ARGx&gt;</b>
</div>

* Packet enclosed with '<' and '>'
* The instruction to the platform is issued with CMD (must be first)
* Any number of arguments delimited by a space character

For example the ping instruction looks like:

<div class="well well-sm">
	<b>&lt;P&gt;</b>
</div>

* 'P' command
* No arguments

Creating the Packets
--------------------

Creating these packets is pretty trival in a high level language like Java or C++.

In my implementations I used a Builder design pattern to hide the underlying protocol details and also prevent arbitrary data from being sent to the platform.

Below is the packet building code I used in the [Platform Controller App](https://github.com/nnarain/ESEPlatformSupervisor-App):


First I created the Packet class:

{% highlight JAVA %}

/**
	Packet Data Wrapper
*/
public class Packet
{
	private String contents = "";

	/**
		Note the private constructor
	*/
	private Packet(String contents)
	{
		this.contents = contents;
	}

	/**
		Accessor for the packet data
	*/
	public String getContents()
	{
		return this.contents;
	}
}

{% endhighlight %}

Pretty simple. The actual data is stored in a string and is accessed with a getter.

So why the private constructor? This is used so that the packet cannot be directly instantiated preventing random data from being used in the packet.

So how is the packet created? I used a Packet Builder class, which is a nested class in the packet (therefore has access to its private constructor) to build the packets.


{% highlight JAVA %}

public class Packet
{
	...

	/**
		Constructs Packets
	*/
	public static class Builder
	{
		// the command of the packet
		private String command;
		// a list of packet arguments
		private ArrayList<String> arguments;

		public Builder()
		{
			this.arguments = new ArrayList<String>();
		}

		/**
			Set the packet command

			return this builder for chaining
		*/
		public Builder setCommand(String cmd)
		{
			this.command = cmd;
			return this;
		}

		/**
			Add a integer argument

			return this builder for chaining
		*/
		public Builder addArgument(int arg)
		{
			this.argument.add(String.valueOf(arg));
			return this;
		}
	}
}

{% endhighlight %}

Ok, so now we have a builder class. Notice that setCommand() and addArgument() return a reference to this object for chaining. This is just for convience.

For example:

{% highlight JAVA %}

Packet.Builder builder = new Packet.Builder();

builder.setCommand("S").addArgument(90);

{% endhighlight %}

But we have a problem. The point of the builder is to prevent random data from being added to the packet. The String argument to setCommand() can be anything so it's not safe!

What to do? I used an enum to solve this problem.

{% highlight JAVA %}

public class Packet
{
	...

	public enum Command
	{
		PING("P"),
		ECHO("E"),
		SERVO("S"),
		STEPPER("ST"),
		MTR_SPEED("MS"),
		MTR_DIR("MD"),
		SYNC("Z");

		private String value;

		Command(String v)
		{
		    value = v;
		}

		public String getValue() {
		    return value;
		}
	}

	public static class Builder
	{
		// the command of the packet
		private String command;
		// a list of packet arguments
		private ArrayList<String> arguments;

		public Builder()
		{
			this.arguments = new ArrayList<String>();
		}

		/**
			Set the packet command

			return this builder for chaining
		*/
		public Builder setCommand(Command cmd)
		{
			this.command = cmd.getValue();
			return this;
		}

		/**
			Add a integer argument

			return this builder for chaining
		*/
		public Builder addArgument(int arg)
		{
			this.argument.add(String.valueOf(arg));
			return this;
		}
	}
}

{% endhighlight %}

This way only the valid commands can be used!

{% highlight JAVA %}

Packet.Builder builder = new Packet.Builder();

builder.setCommand(Packet.Command.SERVO).addArgument(90);

{% endhighlight %}

Finally the method for building the packets:

{% highlight JAVA %}

public class Packet
{
	...

	public static class Builder
	{
		...

		public Packet build()
		{
			StringBuilder builder = new StringBuilder();

			builder
				.append("<")
				.append(this.command);

			for(final String s : this.arguments)
			{
				builder
					.append(" ")
					.append(s);
			}

			builder.append(">");

			return new Packet(builder.toString());
		}
	}
}

{% endhighlight %}

And to use it:

{% highlight JAVA %}

Packet.Builder builder = new Packet.Builder();

builder.setCommand(Packet.Command.SERVO).addArgument(90);

Packet packet = builder.build();

{% endhighlight %}