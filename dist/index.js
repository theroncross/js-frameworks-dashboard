'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var graphs = document.getElementById('graph-list');
var rootUrl = 'https://api.github.com/';
var NS = 'http://www.w3.org/2000/svg';

var setAttributes = function setAttributes(el, attrs) {
  Object.keys(attrs).forEach(function (attr) {
    el.setAttributeNS(null, attr, attrs[attr]);
  });
};

var svg = function svg(tag) {
  var newSvg = document.createElementNS(NS, tag);
  return newSvg;
};

var bar = function bar(attrs) {
  var width = attrs.width;
  var height = attrs.height;
  var fill = attrs.fill;
  var i = attrs.i;


  var newBar = svg('g');
  setAttributes(newBar, {
    transform: 'translate(' + width * i + ', 0)'
  });

  var newRect = svg('rect');
  setAttributes(newRect, {
    width: '' + (width - 2),
    y: '' + (100 - height),
    height: height,
    fill: fill
  });

  newBar.appendChild(newRect);
  return newBar;
};

var avgLine = function avgLine(attrs) {
  var avg = attrs.avg;
  var length = attrs.length;


  var newLine = svg('line');
  setAttributes(newLine, {
    x1: '0',
    x2: length,
    y1: '' + (100 - avg),
    y2: '' + (100 - avg),
    'stroke-width': '1px',
    stroke: 'orange'
  });

  return newLine;
};

var parseComments = function parseComments(comments) {
  var daysAgo = [];
  for (var i = 6; i >= 0; i--) {
    daysAgo.push(i);
  }

  var commentAges = comments.map(function (comment) {
    return Math.round((Date.now() - new Date(comment.created_at)) / (1000 * 60 * 60 * 24));
  });

  return daysAgo.map(function (days) {
    return commentAges.reduce(function (total, commentAge) {
      return days === commentAge ? total + 1 : total;
    }, 0);
  });
};

var graph = function graph(attrs) {
  var route = attrs.route;
  var id = attrs.id;
  var color = attrs.color;
  var _attrs$width = attrs.width;
  var width = _attrs$width === undefined ? 250 : _attrs$width;


  fetch('' + rootUrl + route).then(function (response) {
    return response.json();
  }).then(function (response) {
    var data = void 0;
    if (/participation/.test(route)) {
      data = response.all;
    } else {
      data = parseComments(response);
    }

    var avg = data.reduce(function (sum, d) {
      return sum + d;
    }) / data.length;
    var barWidth = width / data.length;
    var max = Math.max.apply(Math, _toConsumableArray(data));
    var height = max > 140 ? max : 140;

    var newGraph = svg('svg');
    setAttributes(newGraph, { height: height, width: width, id: id });

    data.forEach(function (d, i) {
      newGraph.appendChild(bar({
        width: barWidth,
        height: d,
        fill: color,
        i: i
      }));
    });

    newGraph.appendChild(avgLine({ avg: avg, length: width }));
    graphs.appendChild(newGraph);
  }).catch(function (error) {
    var errorMessage = document.createElement('p');
    errorMessage.innerHTML = 'There was a problem loading the data.';
    graphs.appendChild(errorMessage);
    console.error('Error loading data: ' + error);
  });
};

var frameworks = [{
  org: 'facebook',
  repo: 'react',
  color: 'blue'
}, {
  org: 'angular',
  repo: 'angular',
  color: 'red'
}, {
  org: 'emberjs',
  repo: 'ember.js',
  color: 'green'
}, {
  org: 'vuejs',
  repo: 'vue',
  color: 'purple'
}];

window.onload = function () {
  var form = document.getElementById('stat-selector');
  var routeSuffix = void 0;

  form.onchange = function (event) {
    if (event.target.value === 'participation') {
      routeSuffix = 'stats/participation';
    } else {
      routeSuffix = 'issues/comments?sort=created&direction=desc&per_page=100';
    }

    graphs.innerHTML = '';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = frameworks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var fw = _step.value;
        var org = fw.org;
        var repo = fw.repo;
        var color = fw.color;

        graph({
          route: 'repos/' + org + '/' + repo + '/' + routeSuffix,
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
};