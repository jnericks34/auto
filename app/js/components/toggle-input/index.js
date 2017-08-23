define(['jquery', 'components/ui-component/index'], function($, UiComponent) {
	'use strict';

	function ToggleInput() {
		this.templateUrl = 'js/components/toggle-input/template.html';

		this.elems = { 'input': 'input' };

		this.super.apply(this, arguments);
	}

	ToggleInput.prototype.render = function renderToggleInput() {
		// parse the current model's value and return true/false values
		var toVal = function(value) { return (value||'No').toLowerCase() === 'yes'; };

		this.model.rx.value.subscribe(function(value) {
			// correct the non-string values, default to 'No'
			if(typeof value !== 'string') {
				return this.model.value = 'No';
			}
			
			// update checked property
			this.input.prop('checked', toVal(this.model.value));
		}.bind(this));

		this.input.bind('change', function() {
			this.model.value = this.input.is(':checked') ? 'Yes' : 'No';
		}.bind(this));
	}

	return UiComponent.create(ToggleInput)
});