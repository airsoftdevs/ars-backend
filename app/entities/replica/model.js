const { DataTypes, UUIDV4 } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define('Replica', {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    data: {
      type: DataTypes.JSONB
    },
    type: {
      type: DataTypes.STRING
    }
  });
};
