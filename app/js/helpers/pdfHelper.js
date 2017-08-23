define(['exports', 'pdfmake', 'd3', 'jquery', 'saveSvgAsPng', 'canvg', 'moment'], function (exports, pdfMake, d3, $, saveSvgAsPng, canvg, moment) {
  'use strict';
  var formatSuffixDecimal2 = d3.format(".2s");
  // polyfill for IE
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
      position = position || 0;
      return this.indexOf(searchString, position) === position;
    };
  }
  var _parameterValueTable = function (params) {
    var rows = _.map(params, function (item) {
      return [item.title, item.value];
    });
    var tableDefinition = {
      style: 'normalTable',
      table: {
        headerRows: 1,
        widths: ['*', 150],
        body: [
          [{ text: 'Parameter', style: 'tableHeader' }, { text: 'Value', style: 'tableHeader' }],
        ]
      },
      layout: {
        fillColor: function (i, node) { return i === 0 ? '#2a798f' : (i % 2 === 0) ? '#95bcc7' : null; }
      }
    };
    tableDefinition.table.body = tableDefinition.table.body.concat(rows);
    return tableDefinition;
  };
  var _resultTable = function (costs) {

    var rows = _.map(costs, function (item) {
      return [item.title, formatSuffixDecimal2(item.cost(365)), formatSuffixDecimal2(item.cost(1000))];
    });
    var tableDefinition = {
      style: 'normalTable',
      table: {
        headerRows: 1,
        widths: ['*', 125, 125],
        body: [
          [{ text: 'Parameter', style: 'tableHeader' }, { text: '365D', style: 'tableHeader' }, { text: '1000D', style: 'tableHeader' }],
        ]
      },
      layout: {
        fillColor: function (i, node) { return i === 0 ? '#2a798f' : (i % 2 === 0) ? '#95bcc7' : null; }
      }
    };
    tableDefinition.table.body = tableDefinition.table.body.concat(rows);
    return tableDefinition;
  };
  function _prepareChartLegend(costs) {
    var rows = _.chain(costs).filter(function (f) { return !_.isNil(f.color) }).map(function (item) {
      return [{
        marginLeft: 5,
        marginTop: 2,
        canvas:
        [
          {
            type: 'line',
            x1: 0, y1: 5,
            x2: 10, y2: 5,
            lineWidth: 3,
            lineColor: item.color

          }
        ]
      }, { text: item.title, marginRight: 5 }];
    }).value();
    var legend = {
      table: {
        body: []
      },
      fillColor: '#328ca5',
      color: 'white',
      layout: 'noBorders'
    }
    legend.table.body = legend.table.body.concat(rows);
    return legend;
  };

  function _getLineChart($cEL, callback) {
    var svgNode = $(".line-chart-el svg", $($cEL))[0];
    saveSvgAsPng.svgAsPngUri(svgNode, { backgroundColor: '#328ca5', scale: 2, canvg: window.canvg }, function (uri) {
      callback(uri)
    });
  };
  function _getGaugeCharts(elementContainer) {
    var deferred = new $.Deferred();
    var svgNode = $(elementContainer).find('svg')[0];
    var title = $(elementContainer).find(".ring-chart-title").text();
    saveSvgAsPng.svgAsPngUri(svgNode, { backgroundColor: '#328ca5', canvg: window.canvg }, function (uri) {
      deferred.resolve({ uri: uri, title: title });
    });
    return deferred.promise();
  };

  function createPdf(paramsList, costModel, $cEL, fileName) {
    var docDefinition = {
      content: [],
      styles: {
        subHeader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        normalTable: {
          margin: [0, 5, 0, 15]
        },
        tableHeader: {
          bold: true,
          fontSize: 13,
          color: 'black'
        },
        chartFooter: {
          marginTop: 5,
          marginBottom: 15
        }
      },
      defaultStyle: {
        columnGap: 20,
      }
    };

    var content = [];

    content.push({ text: 'Operational Parameters', style: 'subHeader' });
    var rates = paramsList.rates.orig;
    var costs = paramsList.costs.orig;
    var opParameters = _.chain(costs).filter(function (f, k) { return k != 'params' }).concat(_.chain(rates).filter(function (f, k) { return k != 'params' }).value()).value()

    content.push(_parameterValueTable(opParameters));
    content.push({ text: 'Tactical Parameters', style: 'subHeader' });
    content.push(_parameterValueTable(_.chain(paramsList.tactical.orig).filter(function (f, k) { return k != 'params' }).value()));
    content.push({ text: 'Strategic Parameters', style: 'subHeader' });
    content.push(_parameterValueTable(_.chain(paramsList.strategic.orig).filter(function (f, k) { return k != 'params' }).value()));

    content.push({ text: 'Net Costs', style: 'subHeader' });
    // render the result table
    content.push(_resultTable(costModel));

    var chartLegend = _prepareChartLegend(costModel);
    var deferred = new $.Deferred();
    // render result chart
    _getLineChart($cEL, function (uri) {
      content.push({
        text: 'Charts', style: 'subHeader'
      });
      var chart = {
        columns: [
          {
            image: uri,
            width: 350,
            height: 250,
            alignment: 'center'
          },
          chartLegend
        ]
      };
      content.push(chart);

      // add legends for chart

      var promises = [];
      $(".ring-chart", $cEL).map(function () {
        promises.push(_getGaugeCharts($(this)));
      });

      $.when.apply($, promises)
        .done(function success(result1, result2, result3, result4) {
          var gauges = [{
            alignment: 'center',
            columns: [
              [
                { image: result1.uri },
                { text: result1.title, style: 'chartFooter' }
              ],
              [
                { image: result2.uri },
                { text: result2.title, style: 'chartFooter' }
              ]
            ]
          },
          {
            alignment: 'center',
            columns: [
              [
                { image: result3.uri },
                { text: result3.title, style: 'chartFooter' }
              ],
              [
                { image: result4.uri },
                { text: result4.title, style: 'chartFooter' }
              ]
            ]
          }];

          content = content.concat(gauges);
          // update the content
          docDefinition.content = content;
          var pdfDoc = pdfMake.createPdf(docDefinition);
          deferred.resolve({document:pdfDoc,fileName})
        });
    });
    return deferred.promise();
  }

  exports.downloadPDF = function (paramsList, costModel, $cEL, fileName) {
    createPdf(paramsList, costModel, $cEL, fileName).done(function(data){
      data.document.download(data.fileName);
    });
  }

  exports.getPDF = function (paramsList, costModel, $cEL, fileName, email) {
    return createPdf(paramsList, costModel, $cEL, fileName);
  }

  exports.getPdfName = function (graphName, costModel) {
    return moment().format('DD.MM.YYYY_hh.mm_') + graphName + '_Total_Cost_' + formatSuffixDecimal2(costModel.totalCosts.cost(365))
      + '_and_' + formatSuffixDecimal2(costModel.totalCosts.cost(1000)) + '.pdf';
  }
});