module.exports = (router, Order) => {
  router.get('/detailed', async (req, res) => {
    const rows = await Order.findAll();

    res.send(rows);
  });
  return router;
};
