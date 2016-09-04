const parent = document.querySelector('#app');
const githubApi = 'https://api.github.com/'

fetch(githubApi)
.then((response) => {
  return response.json()
})
.then((data) => {
  let newP;
  for(let entry in data) {
    newP = document.createElement('p');
    newP.textContent = data[entry];
    parent.appendChild(newP);
  }
})
