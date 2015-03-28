---
layout: post
title: Video in Markdown Test
description: Getting video embedded in the markdown files
tag: markdown html jekyll
thumbnail: /assets/2015/01/18/video-test-thumbnail.PNG
---

Lets see if we can embed video in these markdown files.

<embed width="420" height="315" src="https://www.youtube.com/embed/id4I8V8uH_M">

Hey! Looking good!

The above used this html right in the markdown file:

{% highlight html %}
<embed width="420" height="315" src="https://www.youtube.com/embed/id4I8V8uH_M">
{% endhighlight %}

Note that /embed/ in the youtube URL, had trouble without it!

Now how about an iframe?

<iframe width="420" height="315" src="https://www.youtube.com/embed/8brg6CSZgG8"></iframe>

{% highlight html %}
<iframe width="420" height="315" src="https://www.youtube.com/embed/8brg6CSZgG8"></iframe>
{% endhighlight %}


Bootstrap Responsive?

<div class="embed-responsive embed-responsive-16by9">
 	<iframe class="embed-responsive-item" src="https://www.youtube.com/embed/8brg6CSZgG8"></iframe>
</div>
<br>

Guess so!

{% highlight html %}
<div class="embed-responsive embed-responsive-16by9">
<iframe class="embed-responsive-item" src="https://www.youtube.com/embed/8brg6CSZgG8">
</iframe>
</div>
{% endhighlight %}

Looks like posting videos won't be a problem!