const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImage } = require('../controllers/imageController');

const router = express.Router();

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Ruta para subir una imagen
router.post('/analitzar-imatge', upload.single('image'), uploadImage);

module.exports = router;


