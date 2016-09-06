'use strict';

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

var newGraph = function newGraph(params) {
  var route = params.route;
  var id = params.id;
  var color = params.color;
  var _params$width = params.width;
  var width = _params$width === undefined ? 1030 : _params$width;
  var _params$height = params.height;
  var height = _params$height === undefined ? 140 : _params$height;

  fetch('' + rootUrl + route).then(function (response) {
    return response.json();
  }).then(function (data) {
    var bar = void 0,
        rect = void 0;
    var barWidth = width / data.all.length;
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

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  for (var _iterator = frameworks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    var framework = _step.value;

    newGraph({
      route: 'repos/' + framework.org + '/' + framework.repo + '/stats/participation',
      id: framework.repo,
      color: framework.color
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