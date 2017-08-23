requirejs.config({
	baseUrl: 'js',
	// urlArgs: "bust=" + (new Date()).getTime(),
	waitSeconds: 200,
	paths: {
		jquery: '../node_modules/jquery/dist/jquery',
		d3: '../node_modules/d3/build/d3',
		d3Format: '../node_modules/d3-format/build/d3-format',
		moment: '../node_modules/moment/min/moment.min',
		lodash: '../node_modules/lodash/lodash.min',
		pdfMakeLib: '../node_modules/pdfmake/build/pdfmake.min',
		pdfmake: '../node_modules/pdfmake/build/vfs_fonts',
		saveSvgAsPng: '../node_modules/save-svg-as-png/saveSvgAsPng',
		canvg: './lib/canvg/canvg.min',
		rgbcolor: './lib/canvg/rgbcolor',
		stackBlur: './lib/canvg/StackBlur',
	},
	shim: {
		pdfMakeLib:
		{
			exports: 'pdfMake'
		},
		pdfmake:
		{
			deps: ['pdfMakeLib'],
			exports: 'pdfMake'
		},
		canvg: {
			deps: ['rgbcolor', 'stackBlur']
		}
	},
	map: {
		'*': { 'jquery': 'jquery-private' },
		'jquery-private': { 'jquery': 'jquery' }
	}
});

// load the page scripts, always load jquery
requirejs(['page.component']);