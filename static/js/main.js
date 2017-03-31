(function($){
	$(document).ready(function(){
		// added bootstrap the tables
		$('table').each(function(){
			$(this).addClass('table-background striped bordered black-text');
		});

		$(".sidemenu-trigger").sideNav();
	});
})(jQuery);
