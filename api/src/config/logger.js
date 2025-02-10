const winston = require('winston');
const { format } = winston;
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise'); // Importamos mysql2

// Format comú per tots els transports
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (Object.keys(metadata).length > 0) {
            log += ` ${JSON.stringify(metadata)}`;
        }
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// Configuració base del logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat
            )
        })
    ]
});

// Configurar transport per fitxer si s'especifica la ruta
if (process.env.LOG_FILE_PATH) {
    const logDir = process.env.LOG_FILE_PATH;
    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
            console.log(`Directori de logs creat: ${logDir}`);
        }

        const fileTransport = new winston.transports.DailyRotateFile({
            filename: path.join(logDir, '%DATE%-app.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: process.env.LOG_MAX_SIZE || '20m',
            maxFiles: process.env.LOG_MAX_FILES || '14d',
            format: logFormat
        });

        fileTransport.on('rotate', (oldFilename, newFilename) => {
            logger.info('Rotating log files', { oldFilename, newFilename });
        });

        logger.add(fileTransport);
    } catch (error) {
        console.error('Error al crear el directori de logs:', error);
    }
}

// Connexió a la base de dades
const db = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'mi_base_de_datos',
    port: process.env.MYSQL_PORT || 3306
});

// Nou mètode per guardar logs a la base de dades
logger.logToDatabase = async (logData) => {
    const { tag, peticio_id, usuari_id, ip, metodo_http, status, mensaje } = logData;

    try {
        const query = `
            INSERT INTO logs_actividades (tag, peticio_id, usuari_id, ip, metodo_http, status, mensaje)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await db.execute(query, [tag, peticio_id, usuari_id, ip, metodo_http, status, mensaje]);
        logger.info('Log guardado en la base de datos', logData);
    } catch (error) {
        logger.error('Error al guardar el log en la base de datos', { error, logData });
    }
};

// Middleware per Express
const expressLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            tag: 'PETICIÓN',
            peticio_id: null, // Se puede ajustar según el sistema
            usuari_id: null,  // Se puede ajustar según el sistema
            ip: req.ip,
            metodo_http: req.method,
            status: res.statusCode,
            mensaje: `HTTP ${req.method} ${req.url} completada en ${duration}ms`
        };
        logger.logToDatabase(logData);
    });
    next();
};

module.exports = { logger, expressLogger };
