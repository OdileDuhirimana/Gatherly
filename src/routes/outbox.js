const { Router } = require('express');
const { body } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/outboxController');

const router = Router();

router.get('/', auth(['Admin']), ctrl.list);
router.post('/process', auth(['Admin']), body('limit').optional().isInt({ min: 1, max: 200 }), ctrl.processQueue);

module.exports = router;
