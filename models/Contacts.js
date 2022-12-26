const mongoose = require("mongoose");
const geoCoder = require("../utils/geoCoder");
const googlePhone = require("google-libphonenumber");
const ErrorResponse = require("../utils/ErrorResponse");

const ContactSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, `Please Enter the first Name`],
      maxlength: [20, "The maximum length is 20 character"],
      minlength: [3, `the min length is 3 character`],
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: [20, "The maximum length is 20 character"],
      minlength: [3, `the min length is 3 character`],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, `Please Enter the last Name`],
      maxlength: [20, "The maximum length is 20 character"],
      minlength: [3, `the min length is 3 character`],
    },
    phoneNumber: {
      type: String,
      maxlength: [15, "The maximum length is 15 character"],
      trim: true,
      required: [true, "Please enter the phone number"],
    },
    note: {
      type: String,
      maxlength: [30, "The maximum length is 30 character for the notes"],
      trim: true,
    },
    address: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        index: "2dsphere", // i don't know any thing about
      },
      zipcode: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ContactSchema.index({
  firstName: "text",
  lastName: "text",
  middleName: "text",
});

ContactSchema.pre("save", async function (next) {
  // check if the phone number modified
  if (!this.isModified("phoneNumber")) {
    return next();
  }

  // operations fro the phone number
  try {
    const PNF = googlePhone.PhoneNumberFormat;
    //   phone util to check the phone nubmer if its valid or not
    const phoneUtil = googlePhone.PhoneNumberUtil.getInstance();

    //   convert the data type of the string and trim it
    let phoneNumber = this.phoneNumber.toString().trim();

    //   check if the number exist in the body request
    if (!phoneNumber) {
      return next(new ErrorResponse(`Please enter the phone nubmer`, 400));
    }

    //   parse the phone nubmer to phoneUtil to generate a phone nubmer
    const number = phoneUtil.parseAndKeepRawInput(phoneNumber);

    // check if the number is valid to use
    if (!phoneUtil.isValidNumber(number)) {
      return next(
        new ErrorResponse(
          `Please enter the valid number with their country code`,
          400
        )
      );
    }
    console.log("here we go", phoneUtil.isValidNumber(number));
    //   insert only the numbers with E164 format
    this.phoneNumber = phoneUtil.format(number, PNF.E164);
    next();
  } catch (err) {
    console.log(err.message);
    return next(new ErrorResponse(`${err.message}`, 500));
  }
});

ContactSchema.pre("save", async function (next) {
  if (!this.address) {
    return next();
  }

  if (!this.isModified("address")) {
    return next();
  }

  // get the Object that have the coordinates and address
  const loc = await geoCoder(this.address);
  this.location = {
    type: "Point",
    coordinates: [loc.longitude, loc.latitude],
    zipcode: loc.zipcode,
  };
  console.log(loc);
  next();
});

//create virtual proberity which it linked with the bootcamp database.
ContactSchema.virtual("contacts", {
  ref: "ContactsHistory",
  localField: "_id",
  foreignField: "contact",
  justOne: false,
});

const Contact = mongoose.model("Contact", ContactSchema);

Contact.createIndexes();
module.exports = Contact;
