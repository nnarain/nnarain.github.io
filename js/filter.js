
/**
    Show posts with the specified tags
    
    @param tags
        list of tags, delimited by white space.
*/
function filter(tags)
{

	// example selector
	//$(".panel").filter(":not([data-tags~='HCS12'], [data-tags~='html'])").hide();

	// select panels with the tags

	// create the tag selector string by joining together multiple [data-tags~='tag'] selections
	var panelSelector = "";

	var splitTags = tags.split(' ');
	for(var i = 0; i < splitTags.length; i++)
	{
		panelSelector += "[data-tags~='" + splitTags[i] + "']";

		// if not the last element, add a ',' to separate
		if(i + 1 < splitTags.length)
		{
			panelSelector += ', ';
		}
	}

	// hide elements
	var numPosts = $(".panel").filter(panelSelector).show().length;
	$(".panel").filter(":not(" + panelSelector + ")").hide();
    
    return numPosts;
}

// set the tag elements to be clickable 
$(".tag").click(
	function()
	{
		var tag = $(this).text();
		filter(tag);
	}
);