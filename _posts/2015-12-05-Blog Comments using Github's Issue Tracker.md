---
layout: post
title: Blog Comments using Github's Issue Tracker
description: How to add a comment section to your blog site using Github's Issue Tracker
tag: html css bootstrap jekyll github-api
thumbnail: /assets/2015/12/05/thumbnail.png
repo_url: http://github.com/nnarain/nnarain.github.io
issue_number: 17
---

If you, like me, are using Github Pages to host you blog site you know that there is no serve side scripting avaiable (no Ruby, no Python, no Java, no SQL!).

If you want to have comments enabled on your blog site, you'll need some third party tool. There are options available on the net but the Github Issue Tracker has all the functionality you need!

In this post I'll be covering the HTML and CSS portion of the comment section, we'll be making one that looking exactly like the one at the bottom of the page.

Quick note: I'm using Jekyll blogging tool and a lot of Bootstrap!

**Creating the comment section in HTML**

First off, each post is created with its unique issue ID. I do this using a Python script that creates the Github issue and then generate the post markdown file. In the Yaml front matter of the post I define the variable *issue_number* which can be used when creating the HTML for the comment section.

```html

{% raw %}
{% if page.issue_number %}
{% endraw %}
    <!-- Comment section goes here -->
{% raw %}
{% endif %}
{% endraw %}


```

Next is setting up the Bootstrap grid. This isn't really to important, it can be spaced out however you like. I space mine out with 3 column padding on either side with 6 columns for the actual content.

```html
...

<div class="row">
    <div class="col-md-3"></div>
    <div class="col-md-6">
        <!-- Comment section goes here -->
    </div>
    <div class="col-md-3"></div>
</div>

...
```

The actual comment section is separated into 3 parts

1. The header
2. List where the comments are lists
3. A form for submitting comments


The header is easy.

```html
...

<div id="commentSection" class="comment-section">
    <h3>Comments</h3>
    {% raw %}
    <h4>Click <a href="https://github.com/yourusername/yourblogrepo/issues/{{page.issue_number}}">here</a> to view the issue tracker</h4>
    {% endraw %}
</div>

...
```

Notice that I use *page.issue_number* to reference the specific issue thread for the post in question.


The HTML for the comment list is also simple.

```html
...

<div id="commentSection" class="comment-section">
    <h3>Comments</h3>
    {% raw %}
    <h4>Click <a href="https://github.com/yourusername/yourblogrepo/issues/{{page.issue_number}}">here</a> to view the issue tracker</h4>
    {% endraw %}
    
    <ul id="commentList" class="comment-list">
        <!-- Loaded comments go here -->
    </ul>
</div>

...
```

Lastly on the HTML side is the "Add Comment" form. A simple form consisting of a textarea and a button!


```html
...

<div id="commentSection" class="comment-section">
    <h3>Comments</h3>
    {% raw %}
    <h4>Click <a href="https://github.com/yourusername/yourblogrepo/issues/{{page.issue_number}}">here</a> to view the issue tracker</h4>
    {% endraw %}
    
    <ul id="commentList" class="comment-list">
        <!-- Loaded comments go here -->
    </ul>
</div>

<!-- Form for submitting comments -->
<form id="addCommentForm" class="form-inline">
    <div class="form-group">
        <textarea id="commentTextField" class="form-control" rows="3" cols="50"></textarea>
    </div>
    <button id="addCommentButton" type="submit" class="btn btn-success">Add</button>
</form>
...
```

And that's it for the HTML! You should have something that looks like this

![Image not found!](/assets/2015/12/05/thumbnail.png)

**Comment Section Styling**

```css

/* section wrapper styling */
.comment-section
{
    padding: 10px;
    margin-top: 10px;
    
    border-top: 1px solid #DADADA;
}

/* Style for list of comments */
.comment-list
{
    list-style:none;
    
    max-height: 500px;
    overflow-y: auto;
}

.comment-list li 
{
    margin-top:10px;
}

.comment-list li > div 
{
    display:table-cell;
}

/* Style for user avatar img */
.comment-avatar
{
    width: 32px;
    height: 100%;
    float: left;
}

.comment-avatar a > img
{
    width: 100%;
    border-radius: 50%;
}

/* Style for text in comment */
.comment-text p 
{
    margin:0;
    padding-left: 10px;
}

.comment-text h1 
{
    margin:0;
    padding-left: 10px;
}

/* Style used for text that appear under comment */
.sub-text 
{
    color:#aaa;
    font-family:verdana;
    font-size:11px;
    padding-left: 10px;
}

```

Most of this styling will become relevant in the next part of the tutorial when we generate the comment list!



