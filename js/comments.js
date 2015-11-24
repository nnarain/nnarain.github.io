
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
                    comment["body"] = data.body;
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
