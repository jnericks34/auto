define(['jquery'], function ($) {
  'use strict';
  var api = {
    baseUrl: null,
    errorAlertTimeout: false,
    makeAjaxRequest: function (options) {
      var deferred = $.Deferred();

      if (api.baseUrl==null){
        var urlRequest = $.get('apiUrl',function(data){
          if (!data.apiUrl){
            api.baseUrl = $(location).attr('protocol')+"//"+$(location).attr('hostname')+":"+data.apiPort+'/v1';
          }else{
            api.baseUrl = $(location).attr('protocol')+"//"+data.apiUrl+":"+data.apiPort+'/v1';  
          }          
          api.doMakeAjaxRequest(options,deferred);
        });
      } else {
        api.doMakeAjaxRequest(options,deferred);
      }
      return deferred.promise();

    },
    doMakeAjaxRequest: function(options,deferred){

      if (options.url.indexOf("http") !== 0) {
        options.url = api.baseUrl + options.url;
      }
      options.cache = false;

      var request = $.ajax(options);

      request.done(function (data, textStatus, jqXHR) {
        deferred.resolve(data, textStatus, jqXHR);
      });

      request.fail(function (data, textStatus, jqXHR) {
        if (!api.errorAlertTimeout && data.readyState < 4) {
          setTimeout(function () {
            api.errorAlertTimeout = false;
          }, 500);
          api.errorAlertTimeout = true;
          alert("An error occurred while processing your requests.");
        }
        deferred.reject(data, textStatus, jqXHR);
      });
    },
    get: function (url, data) {
      return api.makeAjaxRequest({ url: url, method: 'GET', data: data, dataType: 'json' });
    },
    post: function (url, data) {
      data = JSON.stringify(data);
      return api.makeAjaxRequest({ url: url, method: 'POST', data: data, dataType: 'json', contentType: 'application/json' });
    },
    put: function (url, data) {
      return api.makeAjaxRequest({ url: url, method: 'PUT', data: data, dataType: 'json' });
    },
    del: function (url, data) {
      return api.makeAjaxRequest({ url: url, method: 'DELETE', data: data });
    },

    getAllScenarios: function () {
      return api.get('/scenarios');
    },
    createScenario: function (data) {
      return api.post('/scenarios', data);
    },
    updateScenario: function (id, data) {
      return api.put('/scenarios/' + id, data);
    },
    getScenarioDetail: function (id) {
      return api.get('/scenarios/' + id);
    },
    deleteScenario: function (id) {
      return api.del('/scenarios/' + id);
    },
    getCostData: function (isAutomate, data) {
      return api.post('/calculate/?isAutomate=' + isAutomate, data);
    },
    getSensitivity: function (isAutomate, otherParameters, parameterIndex) {
      return api.post('/sensitivity/' + parameterIndex + '?isAutomate=' + isAutomate, otherParameters)
    },
    shareScenario: function (data) {
      return api.post('/scenarios/share', data);
    },
  };
  return api;
});
