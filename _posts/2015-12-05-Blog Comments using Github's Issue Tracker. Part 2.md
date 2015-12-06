---
layout: post
title: Blog Comments using Github's Issue Tracker. Part2
description: Adding Javascript to get and post comments to the issue tracker!
tag: html css bootstrap jekyll javascript jquery github-api
thumbnail: /assets/2015/12/05/thumbnail.png
repo_url: http://github.com/nnarain/nnarain.github.io
issue_number: 18
next_post:
prev_post: 2015-12-05-Blog Comments using Github's Issue Tracker
---

In the [first part]({% post_url 2015-12-05-Blog Comments using Github's Issue Tracker %}) of this tutorial we setup the layout for our comment section. In this part we will be adding the functionality to get and post comments.

At the bottom of the _layout/post.html file, I added some code that initializes the page when the document loads, we will be filling in those function in this tutorial.

```javascript
{% raw %}
$(document).ready(function(){
    // get comment data
    getPostComments("{{page.issue_number}}", function(data){
        generateCommentSection(data);
        setupAddComments();
        setupPostComment("{{page.issue_number}}");
    });
});
{% endraw %}
```

First things first though. Remember those two modals we setup in Part 1? We need to add the code to get those open!

```javascript
// comments.js

function setupAddComments()
{
    $("#addCommentForm").submit(function(event){
    
        // disable the default action of the form so we can add our own functionality
        event.preventDefault();
        
        // get the text of the comment
        var commentText = $("#commentTextField").val();
        
        // if there is text
        if(commentText)
        {
            // open the credentials dialog
            $("#credDialog").modal();
        }
        else
        {
            // if not, open the warning
            $("#warningDialog").modal();
        }
    });
}

```

**Getting and displaying comments from the Github issue tracker**

Github has provided developer with an easy to use API for getting information from their site.

To get comments from a particular issue, we can do an HTTP GET request on the following URL.

    https://api.github.com/repos/yourusername/yourblogrepo/issues/:issuenumber
    
After that its just a matter of extracting the information we need.


```javascript
function getPostComments(issueNumber, callback)
{
    // get the issue, specified by number, for the site page
    $.get("https://api.github.com/repos/:user/:repo/issues/" + issueNumber, function(issueData){
        ...
    });
}
```

We start by doing GET request for the issue information.

Now we could be in the situation where there are no comments present in the tracker. We are going to check that this issue has comments first, then do another GET request to get the comments.

```javascript
function getPostComments(issueNumber, callback)
{
    // get the issue, specified by number, for the site page
    $.get("https://api.github.com/repos/nnarain/nnarain.github.io/issues/" + issueNumber, function(issueData){
        
        // get the issue's comments url
        var commentsUrl = issueData.comments_url;
        
        // if the issuse has comments
        if(issueData.comments != 0)
        {
            // get the comments
            $.get(commentsUrl, function(commentsData){
                var ret = {"comments":[]};
                ...
                callback(ret);
            });
        }
        else
        {
            // return an empty array of comments
            callback({"comments":[]});
        }
    });
}
```

Now we can start filtering through the comment data and pick out what we want. This depends on your preference on what you want to display about the comment, for example the user, created date, edit date, etc. For more information refer to the official docs [here](https://developer.github.com/v3/issues/comments/).


```javascript
function getPostComments(issueNumber, callback)
{
    // get the issue, specified by number, for the site page
    $.get("https://api.github.com/repos/nnarain/nnarain.github.io/issues/" + issueNumber, function(issueData){
        
        // get the issue's comments url
        var commentsUrl = issueData.comments_url;
        
        // if the issue has comments
        if(issueData.comments != 0)
        {
            // get the comments
            $.get(commentsUrl, function(commentsData){
                
                var ret = {"comments":[]};
                
                // for every comment object
                var len = commentsData.length;
                for(var i = 0; i < len; ++i)
                {
                    var data = commentsData["" + i];
                    
                    var comment = {};
                    comment["body"] = toMarkdown(data.body);
                    comment["date"] = data.created_at;
                    
                    comment["user"] = {
                        "name"       : data.user.login,
                        "avatar_url" : data.user.avatar_url,
                        "url"        : "https://github.com/" + data.user.login
                    };
                    
                    // add a comment to return
                    ret.comments.push(comment);
                }
                
                callback(ret);
            });
        }
        else
        {
            callback({"comments":[]});
        }
    });
}

var converter = new showdown.Converter();
function toMarkdown(markdownText)
{
    var htmlText = "";
    
    if(markdownText)
    {    
        htmlText = converter.makeHtml(markdownText);
    }
    
    return htmlText;
}
```

Above I extract that comment body, data, user, user avatar and user profile url from the comment body.

Also I added a function to convert the comment body to HTML from its Markdown format. For this I use [Showdown JS](https://github.com/showdownjs/showdown).

That is actually all is takes to pull comments down from the issue tracker!

Next we will need to write the code that will generate the comment list.


```javascript
/**
    Generate the comment section for the comments recieved
*/
function generateCommentSection(data)
{
    var comments = data.comments;
    var len = comments.length;
    var output = '';
    
    for(var i = 0; i < len; ++i)
    {
        var comment = comments[i];
        output += generateCommentListItem(comment);
    }
    
    $("#commentList").html(output);
}
```

*data* is the return value of the previous function. Iterate over every comment recieved and generate a list item using the information provided.

```javascript
function generateCommentListItem(comment)
{
    var output = '';
    
    output += '<li>';
    {
        output += '<div class="comment-avatar">';
        {
            output += '<a href="' + comment.user.url + '">';
            {
                output += '<img src="' + comment.user.avatar_url + '"/>';
            }
            output += '</a>';
        }
        output += '</div>';
        output += '<div class="comment-text">';
        {
            output += comment.body;   
            output += '<span class="date sub-text">' + comment.date.split('T')[0] + '</span>';
        }
        output += '</div>';
    }
    output += '</li>';
    
    return output;
}
```


This function generates the list item for a single comment using the custom CSS we made in Part 1.

Now that we can display comments, we can move on to posting comments!

**Posting comments to the Github issue tracker**

The last step! Post a comment from the blog page. The comment will be submitted through the user credential modal we made in Part 1.

```javascript
...
function setupPostComment(issueNumber)
{
    // focus on the username input field when credential form is displayed
    $("#credDialog").on('shown.bs.modal', function(){
        $("#usernameField").focus();
    });
    
    // override the default form action
    $("#credForm").submit(function(event){
        event.preventDefault();
        
        var username = $("#usernameField").val();
        var password = $("#passwordField").val();
        
        var commentBody = $("#commentTextField").val();
    
        // check that the username, password and comment body are not null
        if(username && password && commentBody)
        {
            ...
        }
    });
}
...
```

To post a comment to the issue tracker we need to do a HTTP POST request to Github's API. Two important things to note. 

1. Our POST request needs to be authorized.
2. We need to set our content and data type to a json string, that's what the Github API expects.


In order to authorize the request we need to send a Authorization header before the post. This will take the form

    Authorization: Basic <hash>

The hash is generated using the user's username and password. Of course we wouldn't want to send user private information as plain text over the internet!

Simply function to generate the hash:

```javascript
...

function makeBasicAuth(username, password)
{
    var token = username + ":" + password;
    var hash = btoa(token);
    
    return "Basic " + hash;
}

...
```

JQuery's ajax function can set all the parameters we need to do the post correctly!

```javascript
...

function setupPostComment(issueNumber)
{
    // focus on the username input field when credential form is displayed
    $("#credDialog").on('shown.bs.modal', function(){
        $("#usernameField").focus();
    });
    
    $("#credForm").submit(function(event){
        event.preventDefault();
        
        var username = $("#usernameField").val();
        var password = $("#passwordField").val();
        
        var commentBody = $("#commentTextField").val();
    
        if(username && password && commentBody)
        {
            $.ajax({
                type:"POST",
                url: "https://api.github.com/repos/yourusername/yourblogrepo/issues/" + issueNumber + "/comments",
                dataType: "json",
                contentType:"application/json",
                data:JSON.stringify({"body":commentBody}),
                beforeSend: function(xhr){
                    xhr.setRequestHeader("Authorization", makeBasicAuth(username, password));
                },
                success:function(data){
                    location.reload();
                },
                error: function(xhr, ajaxOptions, error){
                    console.log(xhr.responseText);
                }
            });
        }
    });
}

...
```

Notice the *beforeSend* function sends the Authorization header and a successful post will reload the page.

That's it! You now have working comment system hosted in the Github issue tracker!



