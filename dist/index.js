'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var graphs = document.getElementById('graph-list');
var rootUrl = 'https://api.github.com';
var NS = 'http://www.w3.org/2000/svg';
var frameworks = [{ org: 'facebook', repo: 'react', color: 'blue' }, { org: 'angular', repo: 'angular', color: 'red' }, { org: 'emberjs', repo: 'ember.js', color: 'green' }, { org: 'vuejs', repo: 'vue', color: 'purple' }];

// Utility Functions

var setAttributes = function setAttributes(el, attrs) {
  Object.keys(attrs).forEach(function (attr) {
    el.setAttributeNS(null, attr, attrs[attr]);
  });
};

var svg = function svg(tag) {
  var newSvg = document.createElementNS(NS, tag);
  return newSvg;
};

// 'Components'

var bar = function bar(attrs) {
  var value = attrs.value;
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
    y: '' + (height - value),
    height: value,
    fill: fill
  });

  newBar.appendChild(newRect);
  return newBar;
};

var axis = function axis(attrs) {
  var value = attrs.value;
  var width = attrs.width;
  var height = attrs.height;
  var _attrs$stroke = attrs.stroke;
  var stroke = _attrs$stroke === undefined ? 'silver' : _attrs$stroke;
  var _attrs$labels = attrs.labels;
  var labels = _attrs$labels === undefined ? [Math.round(value)] : _attrs$labels;

  var newAxis = svg('g');
  setAttributes(newAxis, {
    transform: 'translate(0, ' + (height - value) + ')'
  });

  var line = svg('line');
  setAttributes(line, {
    x2: width,
    y2: '0',
    stroke: stroke,
    'stroke-width': '1px'
  });

  if (labels) {
    labels.forEach(function (label, i) {
      var newLabel = svg('text');
      setAttributes(newLabel, {
        x: width * i / labels.length,
        y: '15',
        stroke: stroke
      });
      newLabel.innerHTML = label;
      newAxis.appendChild(newLabel);
    });
  }
  newAxis.appendChild(line);
  return newAxis;
};

var graph = function graph(attrs) {
  var data = attrs.data;
  var id = attrs.id;
  var color = attrs.color;

  var avg = data.reduce(function (sum, d) {
    return sum + d;
  }) / data.length;
  var max = Math.max.apply(Math, _toConsumableArray(data));
  var height = max > 100 ? max : 100;
  var width = 0.6 * window.innerWidth;
  var barWidth = width / data.length;

  var newGraph = svg('svg');
  setAttributes(newGraph, {
    class: 'graph',
    id: id,
    height: height,
    width: width,
    transform: 'translate(20, 20)'
  });

  data.forEach(function (d, i) {
    newGraph.appendChild(bar({
      value: d,
      fill: color,
      width: barWidth,
      height: height,
      i: i
    }));
  });

  newGraph.appendChild(axis({ value: 0, width: width, height: height }));
  newGraph.appendChild(axis({ value: height / 2, width: width, height: height }));
  newGraph.appendChild(axis({ value: height, width: width, height: height }));
  newGraph.appendChild(axis({ value: avg, width: width, height: height, stroke: 'orange', labels: ['', Math.round(avg), 'average'] }));
  return newGraph;
};

// data fetching and parsing

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

var fetchData = function fetchData(routes) {
  var fetches = routes.map(function (route) {
    return fetch(route).then(function (response) {
      return response.json();
    });
  });
  return Promise.all(fetches);
};

var routes = function routes(measurement) {
  var routeSuffixes = {
    participation: 'stats/participation',
    comments: 'issues/comments?sort=created&direction=desc&per_page=100'
  };
  return frameworks.map(function (fw) {
    var org = fw.org;
    var repo = fw.repo;

    return rootUrl + '/repos/' + org + '/' + repo + '/' + routeSuffixes[measurement];
  });
};

// dom interaction
var renderGraphs = function renderGraphs(data) {
  graphs.innerHTML = '';
  var graphData = void 0;
  frameworks.forEach(function (fw, i) {
    graphData = data[i].all ? data[i].all : parseComments(data[i]);
    graphs.appendChild(graph({
      data: graphData,
      id: fw.repo,
      color: fw.color
    }));
  });
};

var displayError = function displayError(error) {
  var errorMessage = document.createElement('p');
  errorMessage.innerHTML = 'There was a problem loading the data.';
  graphs.appendChild(errorMessage);
  console.error('Error loading data: ' + error);
};

var show = function show(measurement) {
  fetchData(routes(measurement)).then(function (response) {
    return response;
  }).then(function (arrs) {
    return renderGraphs(arrs);
  }).catch(function (error) {
    displayError(error);
  });
};

var handleChange = function handleChange(e) {
  show(e.target.value);
};

window.onload = function () {
  show('comments');
  document.getElementById('stat-selector').addEventListener('change', handleChange);
};