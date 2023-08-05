const { Router } = require('express')
const { insightsController } = require('../controllers')
const { protected } = require('../middleware')
const router = Router();

router
  .get('/',protected, insightsController.fetchInsights) 



module.exports = router;