const errorHandler = (err, req, res, next) => {
  const codeStatus = res.statusCode || 500;

  res.statusCode = codeStatus;

  res.status(400).json({ message: err.message, stack: err.stack })

}
module.exports = errorHandler;