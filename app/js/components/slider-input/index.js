define(['jquery', 'd3', 'components/ui-component/index'], function ($, d3, UiComponent) {
	'use strict';
	function SliderInput() {
		this.templateUrl = 'js/components/slider-input/template.html';

		this.bindings = {
			'[data-item-slider]:val': 'value'
		};

		this.elems = {
			'sliderWrap': '.slider-wrap',
			'slider': '[data-item-slider]',
			'cursor': '.cursor'
		};

		this.super.apply(this, arguments);
		this.$styles = $('<style>').appendTo('head');
	}

	SliderInput.prototype.render = function renderSliderInput() {
		// format the min and max labels
		var min = this.model.min,
			max = this.model.max,
			minLabel = min > 1000 ? d3.format('.1s')(min) : min,
			maxLabel = max > 1000 ? d3.format('.1s')(max) : max;

		// atach the labels
		this.sliderWrap.attr('data-min', minLabel);
		this.sliderWrap.attr('data-max', maxLabel);

		// config the slider input
		this.slider.attr('min', min);
		this.slider.attr('max', max);
		this.slider.attr('step', this.model.step);
		this.slider.attr('value', this.model.value);

		// watch for model updates
		this.model.rx.value.subscribe(this.updateSliderStyles.bind(this));
		this.model.rx.holdValue.subscribe(this.updateHoldState.bind(this));
	}

	/**
	 * updateSliderStyles Update the slider's style 
	 * 	customize the left and right colors of the slider
	 * @param  {number} value Current slider value
	 */
	SliderInput.prototype.updateSliderStyles = function updateSliderStyles(value) {
		var max = this.model.max,
			min = this.model.min,
			perc = (value - min) / (max - min) * 100,
			css = '';

		css += '[data-' + this.uuid + '] [data-item-slider]::-webkit-slider-runnable-track {background-size:' + perc + '% 100%, 100% 50%}';
		css += '[data-' + this.uuid + '] [data-item-slider]::-moz-range-track {background-size:' + perc + '% 100%, 100% 50%}';
		this.$styles.text(css);
	}

	/**
	 * updateHoldState Attach the tick that indicates the holded state
	 * @param  {number} holdValue Hold value
	 */
	SliderInput.prototype.updateHoldState = function updateHoldState(holdValue) {
		var max = this.model.max,
			min = this.model.min,
			perc = (holdValue - min) / (max - min) * 100;

		this.cursor.css({ left: perc + '%' });
	}

	return UiComponent.create(SliderInput)
});