const asyncHandler = require("express-async-handler");
const { getUserInfoApi } = require("./insightsController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { signupValidator } = require("../middleware/signupValidator");
const { User } = require("../models");
const { createTransport } = require("nodemailer");

//!  MINOR FUNCTIONS
const cookiesExpireTime = 24 * 60 * 60 * 1000;

const tokenGenrator = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

const codeGenrator = () => {
  return Math.floor(Math.random() * 9000 + 1000);
};

// For email sending ...
const transporter = createTransport({
  service: "Gmail",
  auth: {
    user: "khaleda.02f@gmail.com",
    pass: "kizzzwntxcfrniaz",
  },
});

//! MAIN FUNCTIONS
// @des    login
// @route  GET /api/auth/login
// @access public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("add credintional ");
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      status: "success",
      message: "login successfully ",
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        token: tokenGenrator(user._id),
      },
    });
  }

  res.status(401);
  throw new Error("wronge password || email");
});

// @des    register
// @route  POST /api/auth/register
// @access public
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  //validation
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("add credintional ");
  }
  const { error } = signupValidator({ username, email, password });

  if (error) {
    const message = error.details.map((el) => el.message);
    res.status(400);
    throw new Error(message);
  }

  //TODO: should us to check of the username && email ?
  const userExists = await User.findOne({ email, username });
  if (userExists) {
    res.status(400);
    throw new Error("the user is already exist ");
  }

  const userInfo = await getUserInfoApi({ username });
  console.log(userInfo);
  if (!userInfo) {
    res.status(400);
    throw new Error("wrong in the username ...  ");
  }
  if (userInfo.is_private) {
    res.status(400);
    throw new Error("the account is private ...  ");
  }
  if (!userInfo.pk_id) {
    res.status(400);
    throw new Error("wrong insta username ...  ");
  }

  const user = await User.create({
    email,
    username,
    password: await bcrypt.hash(password, 12),
    instaId: userInfo.pk_id,
  });

  res.status(200).json({
    status: "success",
    message: "register successfully ",
    data: {
      _id: user._id,
      email: user.email,
      username: user.username,
      token: tokenGenrator(user._id),
    },
  });
});

// @des    logout
// @route  get /api/auth/logout
// @access public
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "logout successful",
    data: {},
  });
});

// @des    isauth
// @route  get /api/auth/isauth
// @access public
const isAuth = (req, res) => {
  res.status(200).json(req.user);
};

// @des    forgot password
// @route  GET /api/auth/forgot-password/:email
// @access public
const sendEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  if (!email) {
    res.status(400);
    throw new Error("add credintional ");
  }

  // find & update (IN ONE OPERATION)
  //instead of find the user then update it , here will update the user if the user exist .
  const OTP = codeGenrator();
  const user = await User.findOneAndUpdate(
    { email },
    {
      OTP,
      OTPCodeExpiration: Date.now() + 3600000, // ONE HOUR
    },
    { new: true },
  );

  if (!user) {
    // throw an error
    return res.status(404).json({ message: "User not found" });
  }

  // sending email .
  const mailOTPions = {
    from: "khaleda.02f",
    to: user.email,
    subject: "Password Reset",
    text: `Your password reset code is: ${OTP}`,
  };

  await transporter.sendMail(mailOTPions);

  return res.status(200).json({
    status: true,
    data: {
      _id: user._id,
      email: user.email,
      username: user.username,
    },
  });
});

// @des    forgot password
// @route  POST /api/auth/forgot-password
// @access public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, OTP, newPassword } = req.body;

  console.log(email, OTP, newPassword);
  if (!email || !OTP || !newPassword) {
    res.status(400);
    throw new Error("add credintional ");
  }

  const user = await User.findOneAndUpdate(
    { email, OTP, OTPCodeExpiration: { $gt: Date.now() } },
    {
      // ecrypt the new password
      password: await bcrypt.hash(newPassword, 12),
      resetCode: undefined,
      resetCodeExpiration: undefined,
    },
    { new: true },
  );

  console.log(user, "user");
  if (!user) {
    res.status(400);
    throw new Error(" Invalid or expired code ");
  }

  res.status(200).json({
    status: true,
    data: {
      _id: user._id,
      email: user.email,
      username: user.username,
    },
  });

  // then in the front . redirect the user to login page .
});

module.exports = { login, register, logout, isAuth, forgotPassword, sendEmail };
