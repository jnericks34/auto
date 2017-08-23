define(['models/model'], function(Model) {
	'use strict';

	function Parameter() {
		this.super.apply(this, arguments);
	}

	/**
	 * setValue Set current value and limit by max and min
	 * @param {number} value The difference resulted by setting the value
	 */
	Parameter.prototype.setValue = function(value) {
	
		this.value = Math.max(this.min, Math.min(this.max, value));
		return value - this.value;
	}

	return Model.create(Parameter);
});