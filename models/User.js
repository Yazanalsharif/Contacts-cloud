const mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add your name"],
      trim: true,
      minLength: [3, "The minmium name length is 3 characters"],
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: [
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please add the email address",
      ],
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },
    //create some rules to the password
    password: {
      type: String,
      required: true,
      minLength: 6,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJson: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// create a virtual field for the contacts
userSchema.virtual("Contacts", {
  ref: "Contact",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

// hash the password before insert it to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const genSalt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, genSalt);

  this.password = hashedPassword;
  next();
});

// create a JWT and return it to the user
userSchema.methods.createJwtToken = async function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIREIN,
    }
  );
};

userSchema.methods.isMatchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
