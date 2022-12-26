const asyncHandler = require("../middlewares/asyncHandler");
const User = require("../models/User");
const ErrorResponse = require("../utils/ErrorResponse");

// @Description             insert new user to the data base
// @Method                   Post /v1/contact
// @access                   Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({ name, email, password });

  if (!user) {
    return next(
      new ErrorResponse(`Something went wrong please try again later`, 500)
    );
  }

  await sendTokenWithCookie(res, user, 201);
});

// @Description              login with a specific user and generate and send token using email and password
// @Method                   Post /v1/contact
// @access                   Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  // check if there is a user belong to the database with this email
  if (!user) {
    return next(new ErrorResponse(`Invalid Credientials`, 400));
  }

  // check if the password corret or what
  const isMatchPassword = await user.isMatchPassword(password);

  console.log(isMatchPassword);

  if (!isMatchPassword) {
    return next(new ErrorResponse(`Invalid Credientials`, 400));
  }

  await sendTokenWithCookie(res, user, 200);
});

// @Description              update the account details
// @Method                   Post /v1/contact
// @access                   Public
const updateDetails = asyncHandler(async (req, res, next) => {});
// only you can update the register and the login
module.exports = { register, login };
// method for sending the json token to the client side
const sendTokenWithCookie = async (res, user, statusCode) => {
  try {
    const token = await user.createJwtToken();
    // the options for the cookies
    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      secure: false,
      httpOnly: true,
    };

    //if you are usign ssl connection and production enviorment please put secure true
    res.status(statusCode).cookie("token", token, options).json({
      success: true,
      token: token,
    });
  } catch (err) {
    console.log(err.message);
  }
};
