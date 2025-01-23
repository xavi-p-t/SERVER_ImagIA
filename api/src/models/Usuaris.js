const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuaris = sequelize.define('Usuaris', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    telèfon: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            isNumeric: true, // Valida que solo contenga números
            len: [10, 15] // Longitud mínima y máxima del número de teléfono
        }
    },
    nickname: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 50] // Longitud mínima y máxima para el nickname
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            isEmail: true // Valida que sea un correo electrónico válido
        }
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
