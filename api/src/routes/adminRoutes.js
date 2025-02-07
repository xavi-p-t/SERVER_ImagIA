const express = require('express');

const {loginUser, verifyToken, listUsers, updatePlan} = require('../controllers/adminController');

const router = express.Router();


// Ruta para subir una imagen
router.post('/login', loginUser);

router.post('/verificar-token', verifyToken);

router.post('/pla/actualitzar', updatePlan);

// POST /api/admin/usuaris/pla/actualitzar

router.get('/', listUsers);



module.exports = router;


