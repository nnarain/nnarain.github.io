(function($){
	$(document).ready(function(){
		// added bootstrap the tables
		$('table').each(function(){
			$(this).addClass('striped bordered highlight black-text');
		});

		$(".sidemenu-trigger").sideNav();
	});
})(jQuery);
