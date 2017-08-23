define(['jquery', 'models/model', 'lodash'], function ($, Model, _) {
	function Costs(opts) {
		// set initial value to 0
		var options = $.extend({ value: 0, countTrigger: 0 }, opts);
		this.super.call(this, options);

		// watch changes on the provided values and trigger an update
		// on current mode's cost
		// or update the hold value
		this.values.forEach(function (model, index) {
			model.rx.value.subscribe(this.updateBaseValue.bind(this, index));
			model.rx.holdValue.subscribe(function (holdValue) {
				this.holdValue = holdValue;
			}.bind(this));
		}.bind(this));
		this.holdValues = _.map(this.values, 'orig');


		// create cost function with the baseValue as basic multiplier
		this.cost = function (multiplier) {
			return this.costFn.call(this, this.value, multiplier);
		}.bind(this);
	}

	/**
	 * costFn Simple cost function that returns a new value based
	 * 	on the number of items (x) provided
	 */
	Costs.prototype.costFn = function (baseValue, x) {
		return _.chain(this.values).find({ time: x }).get('value').value() || 0;
	}

	/**
 * costFn Simple cost function that returns a new value based
 * 	on the number of items (x) provided
 */
	Costs.prototype.costFnValues = function (values, x) {
		return _.chain(this.holdValues).find({ time: x }).get('value').value() || 0;
	}


	/**
	 * mux Create a multiplier based on provided x value
	 */
	Costs.prototype.mux = function (x) {
		var dx = Math.min(405, x), mult = 7500;
		if (x < 405) {
			mult *= x / 500;
		}

		return dx * mult;
	}

	/**
	 * demux De-multiply a provided value, return original baseValue
	 */
	Costs.prototype.demux = function (x) {
		return x / 7500 / 405;
	}

	/**
	 * updateBaseValue Update base value with the values from 
	 * 	current model options
	 */
	Costs.prototype.updateBaseValue = function (index) {
		return this.value;
	}

	/**
	 * maxValue Get max possible cost value
	 * @return {number}      Max base cost
	 */
	Costs.prototype.maxValue = function () {
		return parseFloat(this.values.reduce(function (sum, m) {
			return sum + (parseFloat(m.max, 10) || 0);
		}, 0), 10);
	}

	/**
	 * maxCosts Calculate the maximum cost for a given multiplier
	 * @param  {number} mult
	 * @return {number}
	 */
	Costs.prototype.maxCosts = function (time) {
		return this.costFn(this.values, time);
	}

	/**
	 * get Override the getter for holdValue
	 */
	Costs.prototype.get = function modelGetter(propName) {
		return propName === 'holdValue' ? this.getHoldValue() : this.__data[propName];
	}

	/**
	 * getHoldValue Return undefined if values aren't held
	 * 	otherwise get the hold value for model's values
	 */
	Costs.prototype.getHoldValue = function () {
		if (!this.values[0] || this.values[0].holdValue === undefined) {
			return undefined;
		}

		var hold = parseFloat(this.values.reduce(function (sum, m) {
			return sum + (parseFloat(m.holdValue, 10) || 0);
		}, 0), 10);

		return hold;
	}

	/**
	 * updateCostValue By providing a cost, updates the current model's values 
	 * @param  {number} value Cost
	 */
	Costs.prototype.updateCostValue = function (value) {
		var newval = Math.min(Math.max(0, this.demux(value)), this.maxValue()),
			diff = newval - this.value,
			len = this.values.length;

		// update each value by an equal amount
		this.values.forEach(function (m) {
			var valDiff = m.setValue(+m.value + diff / len);

			if (valDiff) {
				diff += valDiff;
				len--;
			}
		});
	}

	return Model.create(Costs);
});