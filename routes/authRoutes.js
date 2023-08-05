const {Router} = require('express')
const {protected} = require('../middleware');
const router = Router();
const {authController} = require('../controllers');

router
  .post('/login', authController.login)
  .post('/register', authController.register)
  .get('/forgot-password/:email', authController.sendEmail)
  .post('/forgot-password', authController.forgotPassword)
  .get('/logout', authController.logout)
  .get('/isauth', protected, authController.isAuth)


module.exports = router;  