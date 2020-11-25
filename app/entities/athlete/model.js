const { DataTypes, UUIDV4 } = require('sequelize');

module.exports = sequelize => {
  return sequelize.define('Athlete', {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
