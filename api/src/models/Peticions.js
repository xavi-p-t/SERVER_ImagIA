const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Usuaris } = require('./src/models/Usuaris');

const Peticions = sequelize.define('Peticions', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    prompt: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    imatges: {
        type: DataTypes.TEXT, // Se utiliza TEXT para almacenar múltiples imágenes como JSON (opcional).
        allowNull: true,
        validate: {
            isUrl: true // Si se esperan URLs, esta validación puede ser útil.
        }
    },
    model: {
        type: DataTypes.STRING,
        defaultValue: "qwen2.5-coder",
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    usuariId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

// Establecer relación
Peticions.belongsTo(Usuaris, { foreignKey: 'usuariId' });
Usuaris.hasMany(Peticions, { foreignKey: 'usuariId' });


module.exports = Peticions;
