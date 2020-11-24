const elastic = require('../../services/elastic');
const log = require('../../services/log')({ file: __filename });
const index = `${elastic.getIndexName(__filename)}_v1`;

const handleWith = elastic.subscribe('user', 'afterSave');

handleWith(data => {
  const doc = {};
  const { id, firstName, lastName, email } = data;

  doc['name'] = `${firstName} ${lastName}`;
  doc['username'] = email;
  elastic.index(index, { id, data: doc }).then(() => {
    log.info(`document id ${id} proccesed on elastic`);
  });
});
