
function getGithubActivityFeed(username, callback)
{
    $.get("https://api.github.com/users/" + username + "/events/public", function(data){        
        
        console.log(data);
        
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
