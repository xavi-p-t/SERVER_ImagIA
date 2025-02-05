const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {registerUser  } = require('../controllers/userController');

const router = express.Router();


// Ruta para subir una imagen
router.post('/registrar', registerUser);


router.post('/validar', registerUser);


module.exports = router;


