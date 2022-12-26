const asyncHandler = require("./asyncHandler");
const ErrorResponse = require("../utils/ErrorResponse");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  //   if you are using cookie
  //    if (req.cookies.token) {
  //    token = req.cookies.token;
  //   }

  if (!token) {
    return next(new ErrorResponse(`Not authorized`, 401));
  }

  try {
    //   verify the token and get the data
    const tokenVerified = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(tokenVerified.id);

    if (!user) {
      return next(new ErrorResponse(`Not authorized`, 401));
    }

    req.user = user;
    next();
  } catch (err) {
    console.log(err.message);
    return next(
      new ErrorResponse(
        "There is an Error and you are Not authorized to this route",
        401
      )
    );
  }
});

module.exports = { protect };
