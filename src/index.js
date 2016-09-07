const graphs = document.getElementById('graph-list');
const rootUrl = 'https://api.github.com';
const NS = 'http://www.w3.org/2000/svg';
const frameworks = [
  { org: 'facebook', repo: 'react', color: 'blue' },
  { org: 'angular', repo: 'angular', color: 'red' },
  { org: 'emberjs', repo: 'ember.js', color: 'green' },
  { org: 'vuejs', repo: 'vue', color: 'purple' },
];

// Utility Functions

const setAttributes = (el, attrs) => {
  Object.keys(attrs).forEach((attr) => {
    el.setAttributeNS(null, attr, attrs[attr]);
  });
};

const svg = (tag) => {
  const newSvg = document.createElementNS(NS, tag);
  return newSvg;
};

// 'Components'

const bar = (attrs) => {
  const { value, width, height, fill, i } = attrs;

  const newBar = svg('g');
  setAttributes(newBar, {
    transform: `translate(${width * i}, 0)`,
  });

  const newRect = svg('rect');
  setAttributes(newRect, {
    width: `${width - 2}`,
    y: `${height - value}`,
    height: value,
    fill,
  });

  newBar.appendChild(newRect);
  return newBar;
};

const axis = (attrs) => {
  const { value, width, height, stroke = 'silver', labels = [Math.round(value)] } = attrs;
  const newAxis = svg('g');
  setAttributes(newAxis, {
    transform: `translate(0, ${height - value})`,
  });

  const line = svg('line');
  setAttributes(line, {
    x2: width,
    y2: '0',
    stroke,
    'stroke-width': '1px',
  });

  if (labels) {
    labels.forEach((label, i) => {
      const newLabel = svg('text');
      setAttributes(newLabel, {
        x: width * i / labels.length,
        y: '15',
        stroke,
      });
      newLabel.innerHTML = label;
      newAxis.appendChild(newLabel);
    });
  }
  newAxis.appendChild(line);
  return newAxis;
};

const graph = (attrs) => {
  const { data, id, color } = attrs;
  const avg = data.reduce((sum, d) => sum + d) / data.length;
  const max = Math.max(...data);
  const height = max > 100 ? max : 100;
  const width = 0.6 * window.innerWidth;
  const barWidth = width / data.length;

  const newGraph = svg('svg');
  setAttributes(newGraph, {
    class: 'graph',
    id,
    height,
    width,
    transform: 'translate(20, 20)',
  });

  data.forEach((d, i) => {
    newGraph.appendChild(bar({
      value: d,
      fill: color,
      width: barWidth,
      height,
      i,
    }));
  });

  newGraph.appendChild(axis({ value: 0, width, height }));
  newGraph.appendChild(axis({ value: height / 2, width, height }));
  newGraph.appendChild(axis({ value: height, width, height }));
  newGraph.appendChild(axis({ value: avg, width, height, stroke: 'orange', labels: ['', Math.round(avg), 'average'] }));
  return newGraph;
};

// data fetching and parsing

const parseComments = (comments) => {
  const daysAgo = [];
  for (let i = 6; i >= 0; i--) { daysAgo.push(i); }

  const commentAges = comments.map((comment) => {
    return Math.round((Date.now() - new Date(comment.created_at)) / (1000 * 60 * 60 * 24));
  });

  return daysAgo.map((days) => {
    return commentAges.reduce((total, commentAge) => {
      return days === commentAge ? total + 1 : total;
    }, 0);
  });
};

const fetchData = (routes) => {
  const fetches = routes.map((route) => {
    return fetch(route)
    .then((response) => response.json());
  });
  return Promise.all(fetches);
};

const routes = (measurement) => {
  const routeSuffixes = {
    participation: 'stats/participation',
    comments: 'issues/comments?sort=created&direction=desc&per_page=100',
  };
  return frameworks.map((fw) => {
    const { org, repo } = fw;
    return `${rootUrl}/repos/${org}/${repo}/${routeSuffixes[measurement]}`;
  });
};

// dom interaction
const renderGraphs = (data) => {
  graphs.innerHTML = '';
  let graphData;
  frameworks.forEach((fw, i) => {
    graphData = data[i].all ? data[i].all : parseComments(data[i])
    graphs.appendChild(graph({
      data: graphData,
      id: fw.repo,
      color: fw.color,
    }));
  });
};

const displayError = (error) => {
  const errorMessage = document.createElement('p');
  errorMessage.innerHTML = 'There was a problem loading the data.';
  graphs.appendChild(errorMessage);
  console.error(`Error loading data: ${error}`);
};

const show = (measurement) => {
  fetchData(routes(measurement))
  .then((response) => response)
  .then((arrs) => renderGraphs(arrs))
  .catch((error) => {
    displayError(error);
  });
};

const handleChange = (e) => {
  show(e.target.value);
};

window.onload = () => {
  show('comments');
  document.getElementById('stat-selector')
  .addEventListener('change', handleChange);
};
