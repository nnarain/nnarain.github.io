
function getGithubActivityFeed(username, callback)
{
    $.get("https://api.github.com/users/" + username + "/events/public", function(data){        
        
        var len = data.length;
        
        var commits = {};
        
        for(var i = 0; i < len; i++)
        {
            var event = data["" + i];
            
            if(event.type == "PushEvent")
            {
                var name = event.repo.name;
                
                if(commits[name] === undefined)
                {
                    commits[name] = {
                        "num": 0,
                        "url": "https://github.com/" + name
                    };
                }
                
                commits[name].num += event.payload.distinct_size;
            }
        }
        
        var activity = {};
        activity["commits"] = commits;
        
        callback(activity);
    });
}

function getGithubAvatar(username, callback)
{
    $.get("https://api.github.com/users/" + username, function(data){
        callback(data.avatar_url);
    });
}
