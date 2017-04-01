(function($){
	$(document).ready(function(){
		// add table formatting
		$('table').each(function(){
			$(this).addClass('table-background striped bordered black-text');
		});

		$(".sidemenu-trigger").sideNav();
        
        initImageList();
	});
    
    function initImageList(){
        $('.image-list').each(function(e){
            var divContent = $(this).text();
            var images = divContent.split(';');

            
            var newHtml = "<div class=\"carousel\">";
            for(var i = 0; i < images.length; ++i){
                newHtml += "<a class=\"carousel-item\">";
                newHtml += "<img src=\"" + images[i] + "\">"
                newHtml += "</a>"
            }
            newHtml += "</div>";
            
            $(this).html(newHtml);
        });
        
        $('.carousel').carousel({
            fullWidth: true
        });
    }
})(jQuery);
