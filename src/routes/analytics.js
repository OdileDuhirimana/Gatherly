const { Router } = require('express');
const { param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/analyticsController');

const router = Router();

router.get('/events/:id', auth(), param('id').isInt(), ctrl.eventStats);
router.get('/users', auth(['Admin']), ctrl.usersMetrics);

module.exports = router;
