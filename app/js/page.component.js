define(['jquery', 'general-ui'], function($) {
	// load page scripts from meta attributes
	// this allows as to desync the load events, giving the user a better experience
	var page = $('meta[name=page]').attr('content');
	if(!page) {
		// ('No js loaded for this page,')
		// ('Please add \'<meta name="page" content="the-page-name">\' meta for this page!')
		return;
	}

	// finally load the page scripts
	requirejs(['pages/'+page]);
});