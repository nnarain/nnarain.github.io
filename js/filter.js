

function filter(tags)
{

	// example selector
	//$(".panel").filter(":not([data-tags~='HCS12'], [data-tags~='html'])").hide();

	// select all panels that do not contain the tags

	// create the tag selector string by joining together multiple [data-tags~='tag'] selections
	var filter_selector = ":not(";

	var splitTags = tags.split(' ');
	for(var i = 0; i < splitTags.length; i++)
	{
		filter_selector += "[data-tags~='" + splitTags[i] + "']";

		// if not the last element, add a ',' to separate
		if(i + 1 < splitTags.length)
		{
			filter_selector += ', ';
		}
	}

	// close the selector
	filter_selector += ')';

	// hide elements
	$(".panel").filter(filter_selector).hide();
}

$("#bnSearch").click(
	function()
	{
		var tags = $("#etSearch").val();

		if(tags == "")
		{
			$(".panel").show();
		}
		else
		{
			filter(tags);
		}
	}
)

$("#Search").submit(
	function(event)
	{
		event.preventDefault();

		var tags = $("#etSearch").val();

		if(tags == "")
		{
			$(".panel").show();
		}
		else
		{
			filter(tags);
		}
	}
)