
var PLUS_ICON = 'glyphicon-plus';
var MINUS_ICON = 'glyphicon-minus';

function getGithubActivityFeed(username, callback)
{
    $.get("https://api.github.com/users/" + username + "/events/public", function(data){        
        
        //console.log(data);
        
        var len = data.length;
        
        var commits = {};
        
        // loop for each object (objects are named 0, 1, 2, 3, etc...)
        for(var i = 0; i < len; i++)
        {
            // get the event
            var event = data["" + i];
            
            // only consider push events
            if(event.type == "PushEvent")
            {
                // get the repo name
                var name = event.repo.name;
                
                // ... if the repo hasn't been added to the dictionary
                if(commits[name] === undefined)
                {
                    // add repo to dictionary
                    commits[name] = {
                        "num": 0,
                        "url": "https://github.com/" + name,
                        "messages":[]
                    };
                }
                
                var numCommits = event.payload.distinct_size;
                
                // increment commit count
                commits[name].num += numCommits;
                
                if(numCommits > 0)
                {
                    // add commit messages
                    for(var j = 0; j < numCommits; ++j)
                    {
                        var commit = event.payload.commits["" + j];
                        var message = commit.message;

                        commits[name].messages.push(message);
                    }
                }
            }
        }
        
        // create the result object
        var activity = {};
        // add commits
        activity["commits"] = commits;
        
        // send back to caller
        callback(activity);
    });
}

function getGithubAvatar(username, callback)
{
    $.get("https://api.github.com/users/" + username, function(data){
        callback(data.avatar_url);
    });
}

function setupFeed(username)
{
    getGithubAvatar(username, function(avatarURL){
        $("#avatarImg").attr("src", avatarURL);
    });
    
    getGithubActivityFeed(username, function(activity){
        
        var output = "";
        
        var idx = 0;
        
        for(var key in activity.commits)
        {
            var repo = activity.commits[key];
            
            output += "<div class=\"panel panel-default\">";
            {
                output += "<div class=\"panel-heading\">";
                {
                    output += "<h4 class=\"panel-title\">";
                    {
                        output += "<small>"
                        {
                        //    output += "<a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#feedList\" href=\"#collapse" + idx + "\">";
                        //    output += "<span data-toggle='tooltip' data-placement='top' title='View Commits'>pushed</span> to " + key;
                        //    output += "</a>";
                            output += "<a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#feedList\" href=\"#collapse" + idx + "\">";
                            output += "<span data-toggle='tooltip' data-placement='top' title='Show Commits' class='glyphicon green icon-toggle'></span> ";
                            output += "</a>";

                            output += "pushed to <a href='" + repo.url + "'>" + key + "</a>";
                        }
                        output += "</small>"
                    }
                    output += "</h4>";
                }
                output += "</div>";
                
                output += "<div id=\"collapse" + idx + "\" class=\"panel-collapse collapse\">";
                {
                    output += "<div class=\"panel-body\">";
                    {
                        output += "<ul class=\"list-group\">";
                        {
                            var numMessages = repo.messages.length >= 10 ? 10 : repo.messages.length;

                            for(var i = 0; i < numMessages; i++)
                            {
                                output += "<li class=\"list-group-item\">";
                                {
                                    output += repo.messages[i];
                                }
                                output += "</li>";
                            }
                        }
                        output += "</ul>";
                    }
                    output += "</div>";
                }
                output += "</div>";
            }
            output += "</div>";
            
            idx++;
        }
        
        // added the generated feed to the document
        $("#feedList").html(output);
        
        // enable tool tips
        $('[data-toggle="tooltip"]').tooltip();
        
        // add plus icon to toggles
        $(".icon-toggle").addClass(PLUS_ICON);
        // add logic for toggling the accordion collapse\re-track icon
        $(".icon-toggle").click(function(){
            
            // has plus, so set to hide commits
            if($(this).hasClass(PLUS_ICON))
            {
                $(this).removeClass(PLUS_ICON);
                $(this).addClass(MINUS_ICON);
                
                $(this)
                    .attr('title', "Hide Commits")
                    .tooltip('fixTitle')
                    .tooltip('show');
            }
            // has minus so set to add commits
            else if($(this).hasClass(MINUS_ICON))
            {
                $(this).removeClass(MINUS_ICON);      
                $(this).addClass(PLUS_ICON);
                
                $(this)
                    .attr('title', "Show Commits")
                    .tooltip('fixTitle')
                    .tooltip('show');
            }
            else
            {
                // problem
            }
        });
    });
}
