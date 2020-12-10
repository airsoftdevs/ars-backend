const { getFiles } = require('../services/files');
const denylist = ['readme', 'index'];
const requireOrder = ['db', 'auth'];
const services = getFiles('app/config/*').filter(
  path => !denylist.some(deny => path.includes(deny))
);

function prioritize(list) {
  const results = [];
  let i;

  for (const priority of requireOrder) {
    while ((i = list.findIndex(path => path.includes(priority))) !== -1) {
      results.push(list.splice(i, 1)[0]);
    }
  }
  return results.concat(list);
}

module.exports = prioritize(services).map(require);
