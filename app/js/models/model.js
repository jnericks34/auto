define(['jquery'], function ($) {
	'use strict';

	/**
	 * subscribe Subscribe method to specified property changes
	 * @param {string?} propName [optional]The property name to subscribe to
	 * @param {function} callback The callback function
	 */
	function subscribe() {
		var args = [].slice.call(arguments),
			fn = args.length > 1 ? args[1] : args[0],
			propName = args.length > 1 ? args[0] : null;

		if (!typeof fn === 'function') {
			throw new Error('callback must be a function!');
		}

		var vm = this, _fn = fn || function () { }, cb = function () {
			// call the callback function with the updated value
			_fn(propName ? vm[propName] : vm);
		};

		// subscribe to emitter
		vm.em.on(propName ? propName + ':change' : 'change', cb);

		// call the callback on init
		cb();
	}

	/**
	 * fetch Fetch a json and maps data to model
	 * @param  {string} url
	 * @return {jqueryDeferred} Resolves to Array<Model>
	 */
	Model.fetch = function modelFetch(data) {
		var model = this, def = new $.Deferred;

		def.resolve(new model(data));

		return def.promise();
	}

	/**
	 * create Functionality for extending the base model
	 * @param  {Function} construct  Named function/constructor
	 * @return {Model}  The new model
	 */
	Model.create = function (construct) {
		var model = construct;

		// extend the prototype
		model.prototype = Object.create($.extend({},
			Model.prototype, model.prototype
		));

		// copy the constructor
		model.prototype.constructor = construct;
		// add the super method to call the main constructor
		model.prototype.super = Model.prototype.constructor;

		// copy static methods
		Object.keys(Model).forEach(function (key) {
			model[key] = Model[key];
		});

		return model;
	}

	/**
	 * Model Base model constructor
	 */
	function Model(opts) {
		// store the original data values - util for restore functionality
		this.orig = $.extend({}, opts);
		// store current state of the model
		this.__data = $.extend({}, opts);
		// event/changes emitter
		this.em = $(this);
		// object to allow for model/property changes
		this.rx = { subscribe: subscribe.bind(this) };

		// create an unique id for current model
		this.uuid = 'm-' + (Math.random() + '').slice(2, 10);

		// define setters and getters for each property
		this.defineProps(this.__data);
		this.defineProp('holdValue');
		this.defineProp('holdValues');
	}

	/**
	 * defineProps Define setters and getters for every property
	 * Allow access to both snake_case and camelCase properties
	 */
	Model.prototype.defineProps = function defineProps(instance, obj) {
		Object.keys(this.__data).forEach(this.defineProp.bind(this));
	}

	/**
	 * defineProp Define setter/getter for provided property
	 * @param {string} propName The publicly available prop name
	 * @param {string} key      The name of the actual property
	 */
	Model.prototype.defineProp = function defineProp(propName) {
		Object.defineProperty(this, propName, {
			get: this.get.bind(this, propName),
			set: this.set.bind(this, propName),
		});

		var vm = this;
		// define the rx.subscribe method for current property
		this.rx[propName] = { subscribe: subscribe.bind(this, propName) };
	}

	Model.prototype.get = function modelGetter(propName) {
		return this.__data[propName];
	}

	Model.prototype.set = function modelSetter(propName, value) {
		this.__data[propName] = value;
		// trigger change for current property and for the entire model
		this.em.trigger(propName + ':change').trigger('change');
	}

	/**
	 * hold Hold current value
	 */
	Model.prototype.hold = function modelSetter() {
		this.holdValue = this.value;
	}

	Model.prototype.holdHoldValues = function modelSetter() {
		this.holdValue = this.value;
		this.holdValues = this.values;
	}

	/**
	 * clearHold Clear the held value
	 */
	Model.prototype.clearHold = function modelSetter() {
		this.holdValue = undefined;
		this.holdValues = undefined;
	}

	return Model;
});
