function createController(model) {
  return {
    get({ query: { rows = 10, page = 1 } }) {
      return model.findAndCountAll({
        limit: rows,
        offset: (page - 1) * rows
      });
    },
    getById({ params: { id } }) {
      return model.findAll({ where: { id } }).then(rows => rows[0]);
    },
    post({ body }) {
      return model.create(body);
    },
    put({ params: { id }, body }) {
      return model.update(body, {
        where: {
          id
        }
      });
    },
    delete({ params: { id } }) {
      return model.destroy({ where: { id } });
    }
  };
}

module.exports = createController;

module.exports.generateDefaultRoutes = (router, model) => {
  const routes = [
    { method: 'get' },
    { method: 'post' },
    { method: 'get', param: 'id', func: 'getById' },
    { method: 'put', param: 'id' },
    { method: 'delete', param: 'id' }
  ];

  const controller = createController(model);

  routes.forEach(route => {
    router[route.method](route.param ? '/:id' : '/', (req, res) => {
      controller[route.func || route.method](req)
        .then(data => {
          res.json(data);
        })
        .catch(err => {
          res.status(400).send(err.message);
        });
    });
  });

  return router;
};
