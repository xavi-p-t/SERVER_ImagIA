const express = require('express');

const {loginUser, verifyToken} = require('../controllers/adminController');

const router = express.Router();


// Ruta para subir una imagen
router.post('/login', loginUser);

router.post('/verificar-token', verifyToken);



module.exports = router;


