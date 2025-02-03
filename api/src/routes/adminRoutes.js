const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {loginUser  } = require('../controllers/adminController');

const router = express.Router();


// Ruta para subir una imagen
router.post('/login', registerUser);

router.post('/verificar-token', verifyToken);



module.exports = router;


