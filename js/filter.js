

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
	$(".panel").filter(panelSelector).show("slow");
	$(".panel").filter(":not(" + panelSelector + ")").hide("slow");
}

/*
// set the action the the search bar
$("#Search").submit(
	function(event)
	{
		//event.preventDefault();

		var tags = $("#etSearch").val();

		if(tags == "")
		{
			$(".panel").show("slow");
		}
		else
		{
			filter(tags);
		}
	}
);
*/

// set the tag elements to be clickable 
$(".tag").click(
	function()
	{
		var tag = $(this).text();
		filter(tag);
	}
);

// show all posts
$("#Posts").click(
	function()
	{
		$(".panel").show("slow");
	}
);