const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sentiment = sequelize.define('Sentiment', {
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    sentiment: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = { Sentiment };
