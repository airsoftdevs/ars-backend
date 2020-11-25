const { Op } = require('sequelize');
const { parseJson } = require('./utils');
const { getModelHelper } = require('./db');
const log = require('./log')({ file: __filename });

/**
 * @param {import('sequelize').ModelCtor<import('sequelize').Model>} model Sequelize model
 */
function createController(model) {
  const controller = getModelHelper(model);

  return {
    async get({ ctx, query: { rows = 10, page = 1, match, search, sortBy } }) {
      const pagination =
        rows != -1
          ? {
              limit: rows,
              offset: (page - 1) * rows
            }
          : {};
      const where = parseJson(match);
      const searchEntries = Object.entries(parseJson(search) || {});
      const like = searchEntries.length
        ? {
            [Op.or]: searchEntries.map(([key, value]) => {
              return {
                [key]: {
                  [Op.iLike]: `%${value}%`
                }
              };
            })
          }
        : {};
      const order = {
        order: Object.entries(parseJson(sortBy) || {})
      };

      const results = await model.findAndCountAll({
        ...pagination,
        ...order,
        where: { ...where, ...like, ...ctx.where }
      });

      if (ctx.parser) await ctx.parser(results);

      return results;
    },
    async getById({ ctx, params: { id } }) {
      const result = await controller.get(id);

      if (ctx.parser) await ctx.parser(result);
      return result;
    },
    post({ body }) {
      return controller.post(body);
    },
    put({ params: { id }, query: { upsert }, body }) {
      return controller.put(id, body, upsert);
    },
    patch({ params: { id }, body }) {
      return controller.patch(id, body);
    },
    delete({ params: { id } }) {
      return controller.delete(id);
    }
  };
}

module.exports.createController = createController;
module.exports.generateDefaultRoutes = (router, model) => {
  const routes = [
    { method: 'get' },
    { method: 'post' },
    { method: 'get', param: 'id', func: 'getById' },
    { method: 'put', param: 'id' },
    { method: 'patch', param: 'id' },
    { method: 'delete', param: 'id' }
  ];

  const controller = createController(model);

  routes.forEach(route => {
    router[route.method](route.param ? '/:id' : '/', (req, res) => {
      return controller[route.func || route.method](req)
        .then(data => {
          res.json(data);
        })
        .catch(err => {
          res.status(err.status || 400).send({ error: err.message });
          log.error(err.message, { stack: err.stack });
        });
    });
  });

  return router;
};
