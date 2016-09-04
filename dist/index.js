'use strict';

var parent = document.querySelector('#app');
var githubApi = 'https://api.github.com/';

fetch(githubApi).then(function (response) {
  return response.json();
}).then(function (data) {
  var newP = void 0;
  for (var entry in data) {
    newP = document.createElement('p');
    newP.textContent = data[entry];
    parent.appendChild(newP);
  }
});