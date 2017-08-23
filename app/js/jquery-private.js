define(['jquery'], function (jq) {

	// helper function for debouncing events
	jq.debounce = function debounce(func, wait) {
		var timeout;

		return function() {
			var vm = this, args = [].slice.call(arguments);
			clearTimeout(timeout);
			timeout = setTimeout(function(){func.apply(vm, args)}, wait);
		};
	};

    return jq.noConflict( true );
});