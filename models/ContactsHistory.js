const mongoose = require("mongoose");

const ContactHistorySchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
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
    maxlength: [20, "The maximum length is 20 character"],
    minlength: [3, `the min length is 3 character`],
  },
  phoneNumber: {
    type: String,
    maxlength: [15, "The maximum length is 15 character"],
    trim: true,
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
  contact: {
    type: mongoose.Schema.ObjectId,
    ref: "Contact",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("ContactsHistory", ContactHistorySchema);
