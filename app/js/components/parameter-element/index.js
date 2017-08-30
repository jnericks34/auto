define(['jquery', 'd3', 'components/ui-component/index', 'components/toggle-input/index', 'components/slider-input/index'], function ($, d3, UiComponent, Toggle, Slider) {
	'use strict';

	/**
	 * ParameterElement Element that allows the ease of rendering a parameter element
	 * within a given container
	 */
	function ParameterElement() {
		this.className = 'parameter-element';
		this.templateUrl = 'js/components/parameter-element/template.html';

		this.bindings = {
			'[data-item-value]:val': 'value'
		};

		this.elems = {
			'$input': '[data-item-value]',
			'label': '[data-item-label]',
			'inputWrap': '[data-input-wrap]',
			'plotBtn': '[data-plot-sensitivity]'
		};

		this.super.apply(this, arguments);
	}

	ParameterElement.prototype.render = function renderParameterElement() {
		// update element's label
		var min = this.model.min,
			max = this.model.max;
		this.label.text(this.model.title);
		if (this.model.name === 'sedan-perc' || this.model.name === 'luxury-sedan-perc' || this.model.name === 'suv-perc' || this.model.name === 'luxury-suv-perc') {
			this.$el.addClass('adjust-percent');
		}


		// render a specific input control for the type of model
		switch (this.model.type) {
			case 'slider':
				this.$input.attr('min', min);
				this.$input.attr('max', max);
				this.$input.attr('step', this.model.step);
				this.$input.attr('type', 'number');
				(new Slider({ model: this.model })).mount(this.inputWrap);

				break;
			case 'toggle':
				(new Toggle({ model: this.model })).mount(this.inputWrap);
				break;
		}

		// watch for model changes and schedule element view updates
		this.model.rx.value.subscribe(this.onValueUpdate.bind(this));
		this.model.rx.holdValue.subscribe(this.updateHoldState.bind(this));
		
		// trigger custom event when clicking the element's graph icon
		this.plotBtn.bind('click', function () {
			this.$el.trigger('plot:sensitivity', this.model);
		}.bind(this));

		// add a targetable attr for the "holdValue" feature in the compare page
		this.$el.attr('data-target', this.model.name);
	}

	/**
	 * onValueUpdate add the holdValue state to current element
	 * 	and the hold-common class to both current element, and "subling" elements
	 * 	Sibling meaning elements with same data-target attributes
	 */
	ParameterElement.prototype.onValueUpdate = function onValueUpdate() {
		if (this.model.holdValue !== undefined && this.model.holdValue !== this.model.value) {
			this.$el.addClass('hold-state');
			$('[data-target="' + this.model.name + '"]').addClass('hold-common');
		}

	}

	/**
	 * updateHoldState Remove the holdValue state when the element state has been released
	 * @param  {any} holdValue Current holdValue
	 */
	ParameterElement.prototype.updateHoldState = function updateHoldState(holdValue) {
		if (holdValue === undefined) {
			// remove the common class
			$('[data-target="' + this.model.name + '"]').removeClass('hold-common');
			return this.$el.removeClass('hold-state');
		}
	}

	return UiComponent.create(ParameterElement)
});
