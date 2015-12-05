
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

                var len = commentsData.length;
                
                var ret = {"comments":[]};
                
                // for every comment object
                for(var i = 0; i < len; ++i)
                {
                    var data = commentsData["" + i];
                    
                    var comment = {};
                    comment["body"] = getMarkdownPreview(data.body);
                    comment["date"] = data.created_at;
                    
                    comment["user"] = {
                        "name"       : data.user.login,
                        "avatar_url" : data.user.avatar_url,
                        "url"        : "https://github.com/" + data.user.login
                    };
                    
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

function makeBasicAuth(username, password)
{
    var token = username + ":" + password;
    var hash = btoa(token);
    
    return "Basic " + hash;
}

function generateCommentPanel(comment)
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
        //    output += '<p>';
            {
                output += comment.body;
            }
        //    output += '</p>';
            output += '<span class="date sub-text">' + comment.date.split('T')[0] + '</span>';
        }
        output += '</div>';
    }
    output += '</li>';
    
    return output;
}

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
        var comment = comments["" + i];
        output += generateCommentPanel(comment);
    }
    
    $("#commentList").html(output);
}

function setupAddComments()
{
    // disable the default action of the add comment form
    $("#addCommentForm").submit(function(event){
        event.preventDefault();
        
        var commentText = $("#commentTextField").val();
        
        if(commentText)
        {
            $("#credDialog").modal();
        }
        else
        {
            $("#warningDialog").modal();
        }
    });
}

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
                url: "https://api.github.com/repos/nnarain/nnarain.github.io/issues/" + issueNumber + "/comments",
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

function setupPreview()
{
    $("#previewLink").click(function(){
        // get the markdown formatted text in the comment section and convert to html
        var markdownContent = $("#commentTextField").val();
        var htmlText = getMarkdownPreview(markdownContent);
        $("#markdownPreview").html(htmlText);
    });
}