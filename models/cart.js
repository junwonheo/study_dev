const { Model, DataTypes } = require('sequelize');
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const sequelize = new Sequelize(config.database, config.username, config.password, config);
class Cart extends Model { }


Cart.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    orderId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'items',
            key: 'id',
        },
    },
    quantity: {
        type: DataTypes.INTEGER,
    }
}, {
    sequelize,
    modelName: 'cart',
    timestamps: true
});
sequelize.sync({ force: false }).then(() => {
    console.log("carts 테이블이 생성되었습니다.");
});
module.exports = Cart;