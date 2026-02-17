const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

const router = Router();

router.post('/register',
  body('name').isString().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').not().exists().withMessage('Role cannot be set during self-registration'),
  authController.register
);

router.post('/login',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  authController.login
);

router.get('/me', auth(), authController.me);

router.post('/forgot-password', body('email').isEmail(), authController.forgotPassword);
router.post('/reset-password',
  body('token').isString(),
  body('password').isLength({ min: 6 }),
  authController.resetPassword
);

module.exports = router;
