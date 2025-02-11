const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const Usuaris = sequelize.define('Usuaris', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    telefon: {
        type: DataTypes.STRING,
        validate: {
            notEmpty: true,
            isNumeric: true, // Valida que solo contenga números
        }
    },
    nickname: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            isEmail: true // Valida que sea un correo electrónico válido
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    rol: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user'
    },
    pla: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'free'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Usuaris;
