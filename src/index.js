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
  const { data, id, color, max, avg } = attrs;
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

  const axes = [
    { value: 0, width, height },
    { value: height / 2, width, height },
    { value: height, width, height },
  ];
  axes.forEach((newAxis) => newGraph.appendChild(axis(newAxis)));

  data.forEach((datum, i) => {
    const barAttrs = { value: datum, fill: color, width: barWidth, height, i };
    newGraph.appendChild(bar(barAttrs));
  });

  newGraph.appendChild(axis({ value: avg, width, height, stroke: 'grey', labels: ['', Math.round(avg)] }));

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

const frameworkObjs = (response) => {
  let fw;
  return frameworks.map((framework, i) => {
    fw = Object.assign({}, framework);
    fw.data = response[i].all ? response[i].all : parseComments(response[i]);
    fw.max = Math.max(...fw.data);
    fw.avg = fw.data.reduce((sum, d) => sum + d) / fw.data.length;
    fw.graph = graph({
      data: fw.data,
      id: fw.repo,
      color: fw.color,
      max: fw.max,
      avg: fw.avg,
    });
    return fw;
  });
};

// dom interaction

const renderGraphs = (fws) => {
  graphs.innerHTML = '';
  fws.forEach((fw) => {
    graphs.appendChild(fw.graph);
  });
};

const displayError = (error) => {
  const errorMessage = document.createElement('p');
  errorMessage.innerHTML = 'There was a problem loading the data.';
  graphs.appendChild(errorMessage);
  console.error(`Error loading data: ${error}`);
};

const show = (attrs) => {
  const { measurement, stat, order } = attrs;
  fetchData(routes(measurement))
  .then((response) => response)
  .then((arrs) => {
    const selectedFws = frameworkObjs(arrs).sort((a, b) => {
      return order === 'asc' ? a[stat] - b[stat] : b[stat] - a[stat];
    });
    renderGraphs(selectedFws);
  })
  .catch((error) => {
    displayError(error);
  });
};

const handleChange = (e) => {
  const fields = [...e.currentTarget.elements];
  show({ measurement: fields[0].value, stat: fields[1].value, order: fields[2].value });
};

window.onload = () => {
  show({ measurement: 'comments', stat: 'max', order: 'desc' });
  document.getElementById('graph-selection-form')
  .addEventListener('change', handleChange);
};
