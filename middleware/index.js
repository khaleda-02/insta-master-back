const protected = require('./authMiddleware');
const errorHandler = require('./errorHandler');

module.exports = {
  protected,
  errorHandler,
}