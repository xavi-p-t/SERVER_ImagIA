const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuaris = require('./Usuaris');

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
    usuarid: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

// Establecer relación
Peticions.belongsTo(Usuaris, { foreignKey: 'usuarid' }); 
Usuaris.hasMany(Peticions, { foreignKey: 'usuarid' });   


module.exports = Peticions;
