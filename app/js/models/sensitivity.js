define(['models/model'], function (Model) {
	'use strict';

	var rand = function (max, min) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	/**
	 * fromModel Create a SensitivityParam from provided model
	 * @param  {Model} model
	 * @return {SensitivityParam}
	 */
	SensitivityParam.fromModel = function (model, sensitivityArr) {
		// copy all model's keys
		var sensParam = new SensitivityParam(model.orig);

		// watch all model's keys for changes and update self with the new value
		Object.keys(model.orig).forEach(function (key) {
			model.rx[key].subscribe(sensParam.set.bind(sensParam, key));
		});

		// copy uuid and old model
		sensParam._uuid = model.uuid;
		sensParam.model = model;
		sensParam.sensitivityArray = sensitivityArr;
		return sensParam;
	}

	function SensitivityParam() {
		this.super.apply(this, arguments);
		this.sensitivityArray = [];
	}

	/**
	 * sensitivity Get the sensitivity for the specified x value
	 * @param  {number} x Must be [0, 100]
	 * @return {number}   The resulted sensitivity
	 */
	SensitivityParam.prototype.sensitivity = function (x) {
		return this.sensitivityArray[x / 10];
	}

	/**
	 * setValue Sets value to current model
	 * @param {number} x Sensitivity value
	 */
	SensitivityParam.prototype.setValue = function (x) {
		var value = x * (this.max - this.min) + this.min;
		this.model.value = Math.min(this.max, Math.max(this.min, value));
	}

	return Model.create(SensitivityParam);
});