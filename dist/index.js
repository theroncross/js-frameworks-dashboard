'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var app = document.getElementById('app');
var rootUrl = 'https://api.github.com/';
var NS = 'http://www.w3.org/2000/svg';

var setAttributes = function setAttributes(el, attrs) {
  for (var attr in attrs) {
    el.setAttributeNS(null, attr, attrs[attr]);
  }
};

var SVGElement = function SVGElement(type) {
  var svg = document.createElementNS(NS, type);
  return svg;
};

var newGraph = function newGraph(attrs) {
  var data = attrs.data;
  var id = attrs.id;
  var color = attrs.color;
  var _attrs$width = attrs.width;
  var width = _attrs$width === undefined ? 1030 : _attrs$width;
  var _attrs$height = attrs.height;
  var height = _attrs$height === undefined ? 140 : _attrs$height;

  var barWidth = width / data.all.length;
  var bar = void 0,
      rect = void 0;

  var graph = SVGElement("svg");
  setAttributes(graph, { height: height, width: width, id: id });

  var avg = data.all.reduce(function (w, a) {
    return w + a;
  }) / data.all.length;
  var avgLine = SVGElement("line");
  setAttributes(avgLine, {
    "x1": "0",
    "x2": width,
    "y1": '' + (100 - avg),
    "y2": '' + (100 - avg),
    "stroke-width": "1px",
    "stroke": "orange"
  });

  data.all.forEach(function (week, i) {
    bar = SVGElement("g");
    setAttributes(bar, {
      "transform": 'translate(' + barWidth * i + ', 0)'
    });

    rect = SVGElement("rect");
    setAttributes(rect, {
      "width": '' + (barWidth - 2),
      "height": week,
      "y": '' + (100 - week),
      "fill": color
    });

    bar.appendChild(rect);
    graph.appendChild(bar);
  });

  graph.appendChild(avgLine);
  app.appendChild(graph);
};

var fetchData = function fetchData(_ref) {
  var route = _ref.route;

  var attrs = _objectWithoutProperties(_ref, ['route']);

  fetch('' + rootUrl + route).then(function (response) {
    return response.json();
  }).then(function (data) {
    newGraph(_extends({}, attrs, { data: data }));
  }).catch(function (error) {
    console.log('Error loading data: ' + error.mesage);
  });
};

var frameworks = [{
  org: "facebook",
  repo: "react",
  color: "blue"
}, {
  org: "angular",
  repo: "angular",
  color: "red"
}, {
  org: "emberjs",
  repo: "ember.js",
  color: "green"
}, {
  org: "vuejs",
  repo: "vue",
  color: "purple"
}];

var renderGraphs = function renderGraphs(partialRoute) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = frameworks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var framework = _step.value;
      var org = framework.org;
      var repo = framework.repo;
      var color = framework.color;

      fetchData({
        route: 'repos/' + org + '/' + repo + '/' + partialRoute,
        id: repo,
        color: color
      });
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

window.onload = function () {
  var form = document.getElementById("stat-selector");
  form.onchange = function (event) {
    if (event.target.value === "participation") {
      renderGraphs('stats/participation');
    } else {
      renderGraphs('issues/comments');
    }
  };
};