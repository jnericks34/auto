define(['jquery', 'd3', 'components/ui-component/index', 'helpers/ui'], function ($, d3, UiComponent, ui) {
	'use strict';

	function LineChart() {
		this.templateUrl = 'js/components/line-chart/template.html';
		this.elems = { 'chartEl': '.line-chart-el' };

		this.super.apply(this, arguments);

		this.top = this.cfg.top;
		this.bottom = this.cfg.bottom;
		this.left = this.cfg.left;
		this.right = this.cfg.right;

		// debounce the hide knob method
		this.debounce_hideKnob = $.debounce(this.hideKnob.bind(this), 50);
	}

	LineChart.prototype.render = function renderLineChart() {
		var vm = this,
			// calculate the actual width and height of the chart
			width = this.cfg.width - this.left - this.right,
			height = this.cfg.height - this.top - this.bottom;

		// create and config the svg
		var svg = d3.select(this.chartEl[0])
			.append("svg:svg")
			.attr("width", this.cfg.width)
			.attr("height", this.cfg.height);

		// add the margins
		this.svg = svg.append("g")
			.attr("transform", "translate(" + this.left + "," + this.top + ")");

		// create the chart scales
		this.scale = {
			x: d3.scaleLinear().rangeRound([0, width]),
			y: d3.scaleLinear().rangeRound([height, 0])
		};

		this.addGrids(width, height);

		// add the X and Y axis
		this.scale.xAxis = this.svg.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height + ")");

		this.scale.yAxis = this.svg.append("g")
			.attr("class", "axis axis--y");

		this.updateScaleDomains(width, height);

		// create coordinate functions to use them in the d3 line functions
		var xfn = function (d) { return vm.scale.x(d); },
			yfn = function (model, d) {
				// var holdAndSelected = model.selected && model.holdValue;
				var holdAndSelected = model.holdValue;
				return vm.scale.y(model.costFn(holdAndSelected || model.value, d));
			};

		// create the available path methods to draw on the chart
		this.paths = {
			// draw simple line
			line: function (model) { return d3.line().x(xfn).y(yfn.bind(0, model)) },

			// draw area under line
			area: function (model) {
				return d3.area().x(xfn).y0(vm.scale.y(0)).y1(yfn.bind(0, model));
			},

			// draw a line for the holdValue
			hline: function (model) {
				return d3.line()
					.x(function (d) {
						// add an extra bit of line at the end of the line,
						// so we can attach the knob
						var max = d3.max(vm.scale.x.domain());
						return vm.scale.x(d) + (max === d ? vm.cfg.right : 0);
					})
					.y(function (d) { return vm.scale.y(model.cost(d)) });
			},
		}

		// watch for new lines
		this.model.rx.data.subscribe(this.updateChart.bind(this));

		// attach the knob(drag handler) for the holdValue line
		this.knob = this.svg.append("circle")
			.attr('class', 'hold-knob')
			.attr("r", 6)
			.attr('cx', -width)
			.attr('cy', -height).attr('fill', '#ffd900');

		// check if the line is selected and plot the hold line
		if (this.selectedAndHold()) {
			this.updateHoldHandle(this.selectedAndHold().model);
		}

		this.svg.node();
	}

	/**
	 * selectedAndHold Check if there's a line selected and on hold
	 * @return {line}        The selected line
	 */
	LineChart.prototype.selectedAndHold = function () {
		return this.model.data.filter(function (d) {
			return d.model.holdValue !== undefined && d.model.selected;
		})[0];
	}

	/**
	 * updateChart append the graph viewable data
	 * @param  {any} params The available data
	 */
	LineChart.prototype.updateChart = function (params) {
		this.updateChartLines('area', params);
		this.updateChartLines('line', params);
		this.updateChartLines('hline', params);
		this.svg.selectAll(".domain").style('fill', "none").style('stroke', "rgba(255,255,255,0.5)").style('stroke- width', "1");

	}

	/**
	 * updateChartLines Append the specified type of lines
	 * @param  {string} type   The line type
	 * @param  {any} params The available data
	 */
	LineChart.prototype.updateChartLines = function (type, params) {
		var vm = this;

		var lines = this.svg
			.selectAll('.' + type)
			.data(params);


		if (type == 'area') {
			// add the new lines
			lines.enter()
				.append("path")
				.attr('class', function (d) { return type + ' ' + type + '-' + d.model.uuid })
				.attr("fill", function (d) { return d.color || "steelblue" })
				.attr("stroke", function (d) { return d.color || "steelblue" }).style('opacity', 0.25)

				// update all lines with the provided data
				.merge(lines)
				.each(function (d) {
					// subscribe to line data changes, and 
					// schedule a line re-draw
					d.model.rx.subscribe(vm.updateChartLine.bind(this,
						vm.paths[type],
						vm.cfg.domains.x, vm, params
					));

					// add/move the holdValue knob
					d.model.rx.subscribe(vm.updateHoldHandle.bind(vm));
				});
		} else {
			// add the new lines
			lines.enter()
				.append("path")
				.attr('class', function (d) { return type + ' ' + type + '-' + d.model.uuid })
				.attr("fill", function (d) { return d.color || "steelblue" })
				.attr("stroke", function (d) { return d.color || "steelblue" }).attr('fill', 'none').attr("stroke-width", "2px")

				// update all lines with the provided data
				.merge(lines)
				.each(function (d) {
					// subscribe to line data changes, and 
					// schedule a line re-draw
					d.model.rx.subscribe(vm.updateChartLine.bind(this,
						vm.paths[type],
						vm.cfg.domains.x, vm, params
					));

					// add/move the holdValue knob
					d.model.rx.subscribe(vm.updateHoldHandle.bind(vm));
				});

		}

		// remove old lines
		lines.exit().remove();
	}

	/**
	 * updateChartLine Draw the line with the provided path function
	 * @param  {Function} path  The d3 function to draw line/area
	 * @param  {any} data  Data for the line
	 * @param  {CostModel} model Provided model to calculate the cost value
	 */
	LineChart.prototype.updateChartLine = function (path, data, vm, params, model) {
		vm.updateScales(params)
		d3.select(this)
			.classed('on-hold', model.holdValue !== undefined && model.selected)
			.datum(data).attr("d", path(model));
	}

	/**
	 * hideKnob Check and hide the holdValue know if needed
	 */
	LineChart.prototype.hideKnob = function () {
		if (this.selectedAndHold()) {
			return;
		}

		// move know outside of visible area
		this.knob.attr('cx', -this.cfg.width)
			.attr('cy', -this.cfg.height);
	};

	/**
	 * updateHoldHandle Update knob position and watch for drag actions
	 * @param  {CostModel} model
	 */
	LineChart.prototype.updateHoldHandle = function (model) {
		// if no knob attached, or line isn't selected, do nothing
		if (!this.knob || !(model.holdValue !== undefined && model.selected)) {
			this.debounce_hideKnob();
			return;
		}

		// calculate the x and y for the knob
		var max = d3.max(this.scale.x.domain()),
			x = this.scale.x(max) + this.cfg.right,
			y = this.scale.y(model.cost(max)), dx;

		// update model value when user drags the knob
		var update = function () {
			var coords = d3.mouse(this.svg.node()),
				cost = this.scale.y.invert(coords[1] - 16);

			// check for differences between user's mouse
			// and actual position and adjust if necessary
			if (dx === undefined) {
				dx = model.value - model.demux(cost);
			}

			model.updateCostValue(cost + model.costFn(dx, 1000));
		}.bind(this);

		// on mouse up remove event handlers and trigger an update
		var onmouseUp = function () {
			d3.select(window).on('mousemove', null);
			d3.select(window).on('mouseup', null);

			dx = undefined;
			update();
		}.bind(this);

		// on mousedown start listening to drag
		var onmouseDown = function () {
			if (d3.event) {
				d3.event.preventDefault();
				d3.event.stopPropagation();
			}

			d3.select(window).on('mousemove', update);
			d3.select(window).on('mouseup', onmouseUp);
			update();
		}.bind(this);

		// update knob position and listen for mouse down
		this.knob.attr("cx", x - 6).attr("cy", y);
		// this.knob.on('mousedown', onmouseDown);
	}

	/**
	 * addGrids Draw the chart background grid lines
	 * @param {number} width  Chart's width
	 * @param {number} height Chart's height
	 */
	LineChart.prototype.addGrids = function (width, height) {
		// add the X gridlines
		this.svg.append("g")
			.attr("class", "grids")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(this.scale.x).ticks(10).tickSize(-height).tickFormat(""));

		// add the Y gridlines
		this.svg.append("g")
			.attr("class", "grids")
			.call(d3.axisLeft(this.scale.y).ticks(10).tickSize(-width).tickFormat(""));

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

	/**
	 * updateScaleDomains Update the domains for the x and y scales
	 * @param  {number} width  Chart's width
	 * @param  {number} height Chart's height
	 */
	LineChart.prototype.updateScaleDomains = function (width, height) {
		// set scale domains
		this.scale.x.domain(d3.extent([0, d3.max(this.cfg.domains.x)]));
		this.scale.y.domain([0, this.model.maxCosts * 1.01]);

		// update the axis with domain data
		this.scale.xAxis.attr('transform', 'translate(10, ' + height + ')')
			.call(d3.axisBottom(this.scale.x)
				.tickSizeOuter(0)
				.ticks(5));

		this.scale.yAxis.attr('transform', 'translate(0,-10)')
			.call(d3.axisLeft(this.scale.y)
				.tickSizeOuter(0)
				.ticks(7)
				.tickFormat(d3.format(".2s")));
	}

	/**
	 * updateScales Update chart's scales
	 * @param  {array} data The available graph data
	 */
	LineChart.prototype.updateScales = function (data) {
		var range = d3.range(0, 100, 10);

		// calculate minimum y
		var ymin = (d3.min(this.model.data, function (c) {
			return d3.min(range, c.model.cost.bind(c.model, 0));
		}) || 0) * .99;

		// calculate maximum y
		var ymax = (d3.max(data, function (c) {
			return d3.max(range, c.model.cost.bind(c.model, 1000));
		}) || 0) * 1.01;

		// update scale and the axis
		this.scale.y.domain([ymin, ymax]);

		this.scale.xAxis.call(d3.axisBottom(this.scale.x)
			.tickSizeOuter(0)
			.ticks(5));

		this.scale.yAxis.call(d3.axisLeft(this.scale.y)
			.tickSizeOuter(0)
			.ticks(7)
			.tickFormat(d3.format(".2s")));
	}

	return UiComponent.create(LineChart)
});