const graphs = document.getElementById('graph-list');
const rootUrl = 'https://api.github.com/';
const NS = 'http://www.w3.org/2000/svg';

const setAttributes = (el, attrs) => {
  Object.keys(attrs).forEach((attr) => {
    el.setAttributeNS(null, attr, attrs[attr]);
  });
};

const svg = (tag) => {
  const newSvg = document.createElementNS(NS, tag);
  return newSvg;
};

const bar = (attrs) => {
  const { width, height, fill, i } = attrs;

  const newBar = svg('g');
  setAttributes(newBar, {
    transform: `translate(${width * i}, 0)`,
  });

  const newRect = svg('rect');
  setAttributes(newRect, {
    width: `${width - 2}`,
    y: `${100 - height}`,
    height,
    fill,
  });

  newBar.appendChild(newRect);
  return newBar;
};

const avgLine = (attrs) => {
  const { avg, length } = attrs;

  const newLine = svg('line');
  setAttributes(newLine, {
    x1: '0',
    x2: length,
    y1: `${100 - avg}`,
    y2: `${100 - avg}`,
    'stroke-width': '1px',
    stroke: 'orange',
  });

  return newLine;
};

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

const graph = (attrs) => {
  const { route, id, color, width = 250 } = attrs;

  fetch(`${rootUrl}${route}`)
  .then((response) => response.json())
  .then((response) => {
    let data;
    if (/participation/.test(route)) {
      data = response.all;
    } else {
      data = parseComments(response);
    }

    const avg = data.reduce((sum, d) => sum + d) / data.length;
    const barWidth = width / data.length;
    const max = Math.max(...data);
    const height = max > 140 ? max : 140;

    const newGraph = svg('svg');
    setAttributes(newGraph, { height, width, id });

    data.forEach((d, i) => {
      newGraph.appendChild(bar({
        width: barWidth,
        height: d,
        fill: color,
        i,
      }));
    });

    newGraph.appendChild(avgLine({ avg, length: width }));
    graphs.appendChild(newGraph);
  })
  .catch((error) => {
    const errorMessage = document.createElement('p');
    errorMessage.innerHTML = 'There was a problem loading the data.';
    graphs.appendChild(errorMessage);
    console.error(`Error loading data: ${error}`);
  });
};

const frameworks = [
  {
    org: 'facebook',
    repo: 'react',
    color: 'blue',
  }, {
    org: 'angular',
    repo: 'angular',
    color: 'red',
  }, {
    org: 'emberjs',
    repo: 'ember.js',
    color: 'green',
  }, {
    org: 'vuejs',
    repo: 'vue',
    color: 'purple',
  },
];

window.onload = () => {
  const form = document.getElementById('stat-selector');
  let routeSuffix;

  form.onchange = (event) => {
    if (event.target.value === 'participation') {
      routeSuffix = 'stats/participation';
    } else {
      routeSuffix = 'issues/comments?sort=created&direction=desc&per_page=100';
    }

    graphs.innerHTML = '';
    for (const fw of frameworks) {
      const { org, repo, color } = fw;
      graph({
        route: `repos/${org}/${repo}/${routeSuffix}`,
        id: repo,
        color,
      });
    }
  };
};
