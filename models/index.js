const insightsModel = require('./insightsModel')
const postModel = require('./postModel')
const User = require('./userModel')

module.exports = {
  Insights: insightsModel,
  Post: postModel,
  User: User
}