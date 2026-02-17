const { Router } = require('express');
const ctrl = require('../controllers/publicController');

const router = Router();

router.get('/transparency', ctrl.transparency);

module.exports = router;
