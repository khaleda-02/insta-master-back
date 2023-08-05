const { Router } = require('express')
const { postController } = require('../controllers');
const { protected } = require('../middleware')
const router = Router();

router
  .post('/create-post', protected, postController.createPost)

  .get('/get-posts', protected, postController.getPosts)

  .get('/get-posts-by-day/:date', protected, postController.getPostByDay)


  .get('/get-posts-by-month', protected, postController.getPostByMonth)

  .delete('/delete-post/:id', protected, postController.deletePost)

  .put('/update-post/:id', protected, postController.updatePost)





module.exports = router;