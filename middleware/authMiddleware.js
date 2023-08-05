const jwt = require("jsonwebtoken");
const { User } = require("../models");
const asyncHandler = require("express-async-handler");

const authenticateUser = asyncHandler(async (req, res, next) => {
  let token;
  //!getting the token
  let header = req.headers.authorization;
  if (header && header.startsWith("Bearer")) {
    try {
      token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findOne({ _id: decoded.id }).select(
        "_id email username verified",
      );
      next();
    } catch (error) {
      res.status(401);
      throw new Error("unauthorized ,invalid token");
    }
  } else {
    res.status(401);
    throw new Error("unauthorized , missing token");
  }
});
module.exports = authenticateUser;
