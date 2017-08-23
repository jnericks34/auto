define(['jquery'], function($) {
	'use strict';

	/**
	 * Fetch a template by the given path
	 * Resolves with the requested template as a string
	 * Caches the template for improving http requests count
	 * @return {jqueryDeferred}
	 */
	var templates = (function() {
		let templates = {};
		return {
			get: function(template) {
				var promise = templates[template] || (templates[template] = 
					$.get(template).then(function(data) {
						return templates[template] = data;
					}));

				return $.when(promise);
			}
		};
	})();

	/**
	 * create Functionality for extending the base component
	 * @param  {Function} construct   Named function/constructor
	 * @return {UiComponent}          The new component 
	 */
	UiComponent.create = function(construct) {
		var component = construct;

		// extend the prototype
		component.prototype = Object.create($.extend({},
			UiComponent.prototype, component.prototype
		));

		// copy the constructor
		component.prototype.constructor = construct;
		// add the super method to call the main constructor
		component.prototype.super = UiComponent.prototype.constructor;

		// copy static methods
		Object.keys(UiComponent).forEach(function(key) {
			component[key] = UiComponent[key];
		});

		// IE11 fix: function.name isn't supported by ie11, so, mockit if it doesn't exists;
		if(!component.name) {
			var name = (component.toString().match(/function (.+?)\(/)||[,''])[1];
			Object.defineProperty(component, 'name', {get: function() {return name;}});
		}

		return component;
	}

	/**
	 * UiComponent Base ui component
	 * 	allows basic render method, auto-fetch of templates and more
	 * @param {any} options Config data
	 */
	function UiComponent(options) {
		var config = options || {};
		// create an unique id for current component
		this.uuid = 'ui-'+(Math.random()+'').slice(2, 10);

		// create or use the provided element
		this.$el = config.$el || $('<div>');
		// save provided model
		this.model = config.model;
		// save provided optional configuration
		this.cfg = config.options || {};

		if(config.templateUrl) {
			this.templateUrl = config.templateUrl;
		}

		// mock the default bindings and elements objects
		// used to create auto-bindings and auto-fetch elements
		// from template
		this.bindings = this.bindings || {};
		this.elems = this.elems || {};

		// if className is set, add it to current element
		this.className && this.$el.addClass(this.className);
	}

	/**
	 * defineProp Define setter/getter for provided property
	 * @param {string} propName The publicly available prop name
	 * @param {Function} getter Pass a custom getter
	 * @param {Function} setter Pass a custom setter
	 */
	UiComponent.prototype.defineProp = function defineProp(propName, getter, setter) {
		Object.defineProperty(this, propName, { get: getter, set: setter});
	}

	/**
	 * __render Private method, called only by  the basic ui component
	 * 	attaches the element id, fetches template elements and binds events
	 * @param  {string} template The component's template
	 */
	UiComponent.prototype.__render = function renderUiComponent(template) {
		this.$el.attr('data-'+this.uuid, '');
		this.refreshElems();
		(this.render || function(){}).call(this);

		this.bindToElements();
		this.refreshElems();
	}

	/**
	 * mount Mount component to provided container
	 * @param  {jqueryElement} $container
	 */
	UiComponent.prototype.mount = function mount($container) {
		var vm = this, render = this.__render.bind(this);
		// append element to container
		$($container).append(this.$el);

		// fetch template and append it to current element
		return templates.get(this.templateUrl).then(function(template) {
			render($(vm.template = template).appendTo(vm.$el));	
		});
	}

	/**
	 * bindToElements Watch provided list of events
	 * 	and update the model, and watch model changes
	 * 	and update the specified element
	 */
	UiComponent.prototype.bindToElements = function() {
		var vm = this;

		Object.keys(this.bindings).forEach(function(selector) {
			// the pair should look like:
			// 'selector:getterAndSetterMethod': 'modelProperty'
			// selector is used to get the element from dom
			// getterAndSetterMethod should be available on the element
			// 	  and is used to get and set the value to input	
			// modelProperty is a property available on this.model
			var property = vm.bindings[selector],
				part = selector.split(':'),
				el = vm.$el.find(part[0]),
				method = part[1] || 'text';

			vm.model.rx[property].subscribe(el[method].bind(el));

			var modelSetter = function(val) { vm.model[property] = el[method]() };
			el.bind('input change', modelSetter);
		});
	}

	/**
	 * refreshElems Fetch elements from component's element
	 */
	UiComponent.prototype.refreshElems = function() {
		var vm = this;

		// the target pair should be:
		// 'propertyThatWillBeAvailableOnThis': 'jquerySelector'
		Object.keys(this.elems).forEach(function(property) {
			vm[property] = vm.$el.find(vm.elems[property]);
		});
	}

	return UiComponent;
});
