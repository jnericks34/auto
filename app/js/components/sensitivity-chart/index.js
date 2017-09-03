define(['jquery', 'd3', 'components/ui-component/index', 'models/sensitivity'], function ($, d3, UiComponent, SensitivityParam) {
	'use strict';
	d3.selection.prototype.moveToFront = function () {
		return this.each(function () {
			this.parentNode.appendChild(this);
		});
	};
	function SensitivityChart(model, $el) {
		this.templateUrl = 'js/components/sensitivity-chart/template.html';
		this.elems = { 'chartEl': '.sensitivity-chart-el' };

		this.super.apply(this, arguments);
	}

	SensitivityChart.prototype.render = function renderSensitivityChart() {
		// create main svg element
		var svg = d3.select(this.chartEl[0])
			.append("svg:svg")
			.attr("width", this.cfg.width)
			.attr("height", this.cfg.height);

		// translate it with provided margins
		this.svg = svg.append("g")
			.attr("transform", "translate(" + this.cfg.left + "," + this.cfg.top + ")");;

		// draw the axis scales
		this.drawScales();

		// subscribe for updates on model
		this.model.rx.data.subscribe(this.updateChart.bind(this));
		var vm = this;
		this.model.rx.changedCount.subscribe(function (v) {
			if (v > 0) {
				vm.updateChart.call(vm, vm.model.data);
			}
		});
	}

	SensitivityChart.prototype.updateChart = function (params) {
		// update the graph scales
		this.updateScales(params);
		var curves = this.svg
			.selectAll('.curve')
			.data(params);

		// append and update the curve lines
		curves.enter()
			.append('path')
			.attr('class', 'curve')
			.attr('stroke-width', 2)
			.attr('stroke', function (d) { return d.color || 'steelblue' })
			.attr('id', function (d) { return d.model.uuid })
			.merge(curves)
			// use a pre-defined range when drawing the lines
			.attr('d', this.line.bind(this, d3.range(0, 110, 10), false));
		// remove old lines
		curves.exit().remove();

		var areas = this.svg
			.selectAll('.area')
			.data(params);

		// append and update the area under the curve lines
		areas.enter()
			.append('path')
			.attr('class', 'area')
			.attr('stroke', 'none')
			.attr('opacity', 0.2)
			.attr('fill', function (d) { return d.color || 'steelblue' })
			.attr('id', function (d) { return d.model.uuid })
			.merge(areas)
			// use a pre-defined range when drawing the lines
			.attr('d', this.line.bind(this, d3.range(0, 110, 10), true));

		// remove old linse
		areas.exit().remove();

		// draw the drag handlers that allow the user
		// to update the values from the chart
		var handlers = this.svg
			.selectAll('rect')
			.data(params);

		// remove old handlers
		handlers.exit().remove();

		var vm = this;
		// wrap function and keep both current scope and the d3's one
		var wrap = function (fn) {
			return function (d) { vm[fn].bind(vm, d3.select(this)).apply(vm, arguments) };
		};

		handlers.moveToFront();

		handlers.enter()
			.append('rect')
			.attr("rx", 5)
			.attr("ry", 5)
			.attr('width', 15)
			.attr('height', 15)
			.attr('stroke', 'white')
			.attr('stroke-width', 2)
			.attr('fill', function (d) { return d.color })
			.attr('transform', 'translate(-7.5,-7.5)')
			.style('cursor', 'pointer')
			.merge(handlers)
			.on('touchstart', wrap('onMousedown'))
			.on('mousedown', wrap('onMousedown'))
			.each(function (d) {
				d.model.rx.value.subscribe(
					vm.updateHandlerPosition.bind(vm, d3.select(this), d.model)
				);
			});
	}

	/**
	 * onMousedown Watch user's mouse movements and update model value
	 * @param  {d3Selection} handler
	 * @param  {any} d       Data for current line/handler, contains data model
	 */
	SensitivityChart.prototype.onMousedown = function (handler, d) {
		window.isMouseDown = true;
		var update = function () {
			var coords = d3.mouse(this.svg.node()),
				val = this.scale.x.invert(coords[0]);

			d.model.setValue(val);
		}.bind(this);

		var onmouseUp = function () {
			d3.select(window).on('mousemove touchmove', null);
			d3.select(window).on('mouseup touchend', null);
			window.isMouseDown = false;
			update();
		}.bind(this);

		if (d3.event) {
			d3.event.preventDefault();
			d3.event.stopPropagation();
		}

		d3.select(window).on('mousemove touchmove', update);
		d3.select(window).on('mouseup touchend', onmouseUp);
		update();

	}

	/**
	 * updateHandlerPosition Move the handler position when user changes
	 * 	model value via other ways (not dragging from chart)
	 * @param  {d3Selection} handler Handler to update
	 * @param  {any} model   Data model
	 * @param  {number|string} v       Current value
	 */
	SensitivityChart.prototype.updateHandlerPosition = function (handler, model, v) {
		var x = (v - model.min) / (model.max - model.min);

		// if value is 'yes', move handler to max,
		// otherwise move it to min
		if (isNaN(v)) {
			(v || '').toLowerCase() === 'yes' ? x = 1 : x = 0;
		}

		// calc where the handler should stay
		var path = d3.select('path#' + model.uuid).node();
		if (path) {
			var len = path.getTotalLength(),
				point = path.getPointAtLength(x * len);

			// update handler position
			handler
				.attr('y', point.y).attr('x', point.x);
		}
	}

	/**
	 * line Create a d3 line curve function 
	 * 	And creates the d path
	 * @param  {array<number>} range Data for the line
	 * @param  {any} data  	Object containing data model
	 * @return {string} 	The path
	 */
	SensitivityChart.prototype.line = function (range, isArea, data) {
		var model = data.model, scale = this.scale;
		var drawFunc;
		drawFunc = d3.line()
			.x(function (d) { return scale.x(d / 100); })
			.y(function (d) { return scale.y(model.sensitivity(d)); })
			.curve(d3.curveCatmullRom.alpha(1));

		if (isArea === true) {
			drawFunc = d3.area()
				.x(function (d) { return scale.x(d / 100); })
				.y0(scale.y(d3.min(scale.y.domain())))
				.y1(function (d) { return scale.y(model.sensitivity(d)); })
				.curve(d3.curveCatmullRom.alpha(1));
		}

		return drawFunc(range);
	}

	/**
	 * drawScales Draw the chart's scales
	 */
	SensitivityChart.prototype.drawScales = function () {
		// calculate the actual width and height of the chart
		var width = this.cfg.width - this.cfg.left - this.cfg.right,
			height = this.cfg.height - this.cfg.top - this.cfg.bottom;

		// draw X and Y scales
		this.scale = {
			x: d3.scaleLinear().domain([0, 1]).rangeRound([0, width]),
			y: d3.scaleLinear().rangeRound([height, 0])
		};

		// attach the axis
		this.scale.xAxis = this.svg.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(this.scale.x));

		this.scale.yAxis = this.svg.append("g")
			.attr("class", "axis axis--y")
			.call(d3.axisLeft(this.scale.y));

		this.drawGridLines(width, height);
	}

	/**
	 * updateScales Update chart's scales
	 * @param  {array} data The available graph data
	 */
	SensitivityChart.prototype.updateScales = function (data) {
		var range = d3.range(0, 100, 10);

		// calculate minimum y
		var ymin = (d3.min(this.model.data, function (c) {
			return d3.min(c.model.sensitivityArray);
		}) || 0) * 0.99;

		// calculate maximum y
		var ymax = (d3.max(data, function (c) {
			return d3.max(c.model.sensitivityArray);
		}) || 0) * 1.01;

		// update scale and the axis
		this.scale.y.domain([ymin, ymax]);

		this.scale.xAxis.call(d3.axisBottom(this.scale.x)
			.tickSizeOuter(0)
			.ticks(5)
			.tickFormat(d3.format(".0%")));

		this.scale.yAxis.call(d3.axisLeft(this.scale.y)
			.tickSizeOuter(0)
			.ticks(7)
			.tickFormat(d3.format(".2s")));
	}

	/**
	 * drawGridLines Draw the chart background grid lines
	 * @param {number} width  Chart's width
	 * @param {number} height Chart's height
	 */
	SensitivityChart.prototype.drawGridLines = function (width, height) {
		// add the X gridlines
		this.svg.append("g")
			.attr("class", "grids")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(this.scale.x).ticks(10).tickSize(-height).tickFormat(""));

		// add the Y gridlines
		this.svg.append("g")
			.attr("class", "grids")
			.call(d3.axisLeft(this.scale.y).ticks(10).tickSize(-width).tickFormat(""))

		// add the X gridlines
		this.svg.append("g")
			.attr("class", "grid")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(this.scale.x).ticks(5).tickSize(-height).tickFormat(""));

		// add the Y gridlines
		this.svg.append("g")
			.attr("class", "grid")
			.call(d3.axisLeft(this.scale.y).ticks(5).tickSize(-width).tickFormat(""));
	}

	return UiComponent.create(SensitivityChart)
});