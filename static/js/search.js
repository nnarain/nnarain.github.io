function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
  
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
  
      if (pair[0] === variable) {
        return decodeURIComponent(pair[1].replace(/\+/g, '%20'));
      }
    }
}

function displaySearchResults(results, store) {
    var searchResults = document.getElementById('search-results');

    if(results.length)
    {
        var str = "";

        for(var i = 0; i < results.length; i++)
        {
            var item = store[results[i].ref];
            console.log(item);

            str += "<a href=\"" + item.url + "\" class=\"catalogue-item\">";
            {
                str += "<div>";
                {
                    str += "<time ";
                    {
                        str += "datetime=\"" + item.date + "\" ";
                        str += "class=\"catalogue-time\"";
                        str += ">" + item.date;
                    }
                    str += "</time>";

                    str += "<h1 class=\"catalogue-title\">";
                    {
                        str += item.title;
                    }
                    str += "</h1>";
                    str += "<div class=\"catalogue-line\"></div>"

                    str += "<p>";
                    {
                        var max_len = Math.min(item.content.length, 80);
                        str += item.content.substring(0, max_len);
                    }
                    str += "</p>"
                }
                str += "</div>";
            }
            str += "</a>"
        }

        searchResults.innerHTML = str;
    }
}

var searchTerm = getQueryVariable('query');

if (searchTerm) {
    document.getElementById('search-box').setAttribute("value", searchTerm);

    var searchIndex = lunr(function(){
        this.field('id');
        this.field('title', {boost: 10});
        this.field('content');
        this.field('tags');

        for (var key in window.store) {
            this.add({
                'id': key,
                'title': window.store[key].title,
                'content': window.store[key].content,
                'tags': window.store[key].tags
            });
        }
    });
    console.log(searchIndex);

    var results = searchIndex.search(searchTerm);
    displaySearchResults(results, window.store);
}