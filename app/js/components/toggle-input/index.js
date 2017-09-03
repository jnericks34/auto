define(['jquery', 'components/ui-component/index'], function ($, UiComponent) {
	'use strict';

	function ToggleInput() {
		this.templateUrl = 'js/components/toggle-input/template.html';

		this.elems = {
			'label': 'label',
			'input': 'input',
			'cursor': '.cursor'
		};

		this.super.apply(this, arguments);
	}

	ToggleInput.prototype.render = function renderToggleInput() {
		// parse the current model's value and return true/false values
		var toVal = function (value) { return (value || 'No').toLowerCase() === 'yes'; };

		this.model.rx.value.subscribe(function (value) {
			// correct the non-string values, default to 'No'
			if (typeof value !== 'string') {
				return this.model.value = 'No';
			}

			// update checked property
			this.input.prop('checked', toVal(this.model.value));
		}.bind(this));

		this.input.bind('change', function () {
			this.model.value = this.input.is(':checked') ? 'Yes' : 'No';
		}.bind(this));

		this.model.rx.holdValue.subscribe(this.updateHoldState.bind(this));
	}

	/**
	 * updateHoldState Attach the tick that indicates the holded state
	 * @param  {string} holdValue Hold value
	 */
	ToggleInput.prototype.updateHoldState = function updateHoldState(holdValue) {
		var value = holdValue == 'Yes' ? this.label.width() : 0;
		var max = this.label.width(),
			min = 0,
			perc = ((value - min) / (max - min) * 100) - 10;
		this.cursor.css({ left: perc + '%' });
	}

	return UiComponent.create(ToggleInput)
});