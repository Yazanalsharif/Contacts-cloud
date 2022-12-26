const asyncHandler = require("../middlewares/asyncHandler");
const Contacts = require("../models/Contacts");
const ErrorResponse = require("../utils/ErrorResponse");
const googlePhone = require("google-libphonenumber");
const geoCode = require("../utils/geoCoder");
const ContactHistory = require("../models/ContactsHistory");

// @Description              insert a new Contact to you contact cloud
// @Method                   Post /v1/contact
// @access                   Private  User
const insertContact = asyncHandler(async (req, res, next) => {
  //   create the contact and store in the database
  let contact = await Contacts.findOne({
    phoneNumber: req.body.phoneNumber,
    user: req.user.id,
  });

  if (contact) {
    return next(
      new ErrorResponse(`the contact is already exist with ${contact._id}`, 400)
    );
  }

  //req.user come from the protect middleWare
  req.body.user = req.user.id;
  //   insert new contact with unique number
  contact = await Contacts.create(req.body);

  //   return a response to the user
  res.status(200).json({
    success: true,
    data: contact,
  });
});

// @Description              Update the contacts
// @Method                   PUT /v1/contact/:id
// @access                   Private  User
const updateContact = asyncHandler(async (req, res, next) => {
  const feilds = {
    firstName: req.body.firstName,
    middleName: req.body.middleName,
    lastName: req.body.lastName,
    note: req.body.note,
    phoneNumber: req.body.phoneNumber,
    address: req.body.address,
  };

  // empty object that we will use to collect the current data for storeing it before the update
  let previousContact = new Object();

  // find the contact for the update
  let contact = await Contacts.findById(req.params.id);

  // check if the contact exist
  if (!contact) {
    return next(
      new ErrorResponse(`The contact with ${req.params.id} Not Exist`, 400)
    );
  }

  if (req.user.id !== contact.user.toString()) {
    return next(
      new ErrorResponse(
        `you are not able to update this contact. Not Authorized`,
        401
      )
    );
  }
  if (req.body.address) {
    // if the address updated it will update a lone because we have to validate and geoCode it
    // store it in the history data
    previousContact.address = contact.address;
    contact.address = req.body.address;
    await contact.save();
  }

  // if the phoneNumber updated it will update a lone because we have to validate and made it E.164
  if (req.body.phoneNumber) {
    // store it in the history data
    previousContact.phoneNumber = contact.phoneNumber;
    contact.phoneNumber = req.body.phoneNumber;
    await contact.save();
  }

  const updatedFieldsKeys = ["firstName", "middleName", "lastName", "note"];

  // return the keys that only has a valus
  const feildsUpdated = updatedFieldsKeys.filter((item, index) => {
    return feilds[item] !== undefined;
  });

  // assign the key with its own values if exist
  feildsUpdated.forEach((value) => {
    // assign the values with the previouse values
    previousContact[value] = contact[value];
  });

  delete feilds.phoneNumber;
  delete feilds.address;

  contact = await Contacts.findByIdAndUpdate(req.params.id, feilds, {
    runValidator: true,
    new: true,
  });

  previousContact.contact = contact.id;
  previousContact.user = req.user.id;

  previousContact = await ContactHistory.create(previousContact);

  res.status(200).json({
    success: true,
    data: contact,
  });
});

// @Description              Get the Contact by the firstName, middleName and the lastName
// @Method                   GET /v1/contact/search/:fullName
// @access                   Private  User
const getContactByName = asyncHandler(async (req, res, next) => {
  const name = req.params.fullName;

  // here
  if (!name) {
    return next(
      new ErrorResponse(
        `Please enter the name of the contacts that you are looking for`,
        400
      )
    );
  }

  const query = { $text: { $search: name }, user: req.user.id };

  const contacts = await Contacts.find(query);

  res.status(200).json({
    success: true,
    data: contacts,
  });
});

// @Description              Get the Contact by the Part of the name
// @Method                   GET /v1/contact/search/part/:partOfName
// @access                   Private  User
const getContactByPartOfName = asyncHandler(async (req, res, next) => {
  const name = req.params.partOfName;

  if (!name) {
    return next(new ErrorResponse(`Please Enter a part of the name`, 400));
  }

  let contacts = [];

  const firstName = await Contacts.find({
    firstName: { $regex: name, $options: "i" },
    user: req.user.id,
  });

  const lastName = await Contacts.find({
    lastName: { $regex: name, $options: "i" },
    user: req.user.id,
  });

  const middleName = await Contacts.find({
    middleName: { $regex: name, $options: "i" },
    user: req.user.id,
  });

  // clone the searches parts to make it 1 part
  contacts = [...firstName, ...middleName, ...lastName];

  removeDuplicate(contacts);
  // filtering the array
  res.status(200).json({
    success: true,
    counts: contacts.length,
    data: contacts,
  });
});

// @Description              Delete the Contact
// @Method                   DELETE /v1/contact/:id
// @access                   Private  User
const deleteContact = asyncHandler(async (req, res, next) => {
  const contact = Contacts.findById(req.params.id);

  if (!contact) {
    return next(
      new ErrorResponse(`The contact with ${contact.id} Not Exist`, 400)
    );
  }

  await contact.remove();

  res.status(200).json({
    success: true,
    msg: "the contact have been deleted",
    data: {},
  });
});

// @desc         Get my contacts by distence and redious
// @Method       GET  /v1/contact/redius/:address/:distance
// access        Public
const getContactsByRadius = asyncHandler(async (req, res, next) => {
  const { address, distance } = req.params;
  //get the lat, long from the zipcode
  const loc = await geoCode(address);

  const lat = loc.latitude;
  const lng = loc.longitude;

  // the earth redius is 3,963 mi
  /* read more about the redians and redius and geoSpatial Query */
  const redius = distance / 3963;

  const contacts = await Contacts.find({
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], redius] },
    },
    user: req.user.id,
  });

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
});

// @Description              Get the Contact by ID
// @Method                   GET /v1/contact/:id
// @access                   Private  User
const getContactById = asyncHandler(async (req, res, next) => {
  const contact = await Contacts.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate({
    path: "contacts",
    select: "name",
  });

  if (!contact) {
    return next(
      new ErrorResponse(`The contact with ${req.params.id} Not Exist`, 400)
    );
  }

  res.status(200).json({
    success: true,
    data: contact,
  });
});

// @Description              Get the Contact History by the id
// @Method                   GET /v1/contact/history/:id
// @access                   Private  User
const getContactHistoryById = asyncHandler(async (req, res, next) => {
  const contactsHistory = await ContactHistory.find({
    contact: req.params.id,
    user: req.user.id,
  })
    .populate("contact")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    length: contactsHistory.length,
    data: contactsHistory,
  });
});

// @Description              Get the Contacts History
// @Method                   GET /v1/contact/history
// @access                   Private  User
const getContactsHistory = asyncHandler(async (req, res, next) => {
  console.log(req.user.id);
  const contactsHistory = await ContactHistory.find({
    user: req.user.id,
  }).sort("-createdAt");

  res.status(200).json({
    success: true,
    length: contactsHistory.length,
    data: contactsHistory,
  });
});

// @Description              Get My Contacts with the history data
// @Method                   GET /v1/contact
// @access                   Private  User
const getMyContacts = asyncHandler(async (req, res, next) => {
  const contacts = await Contacts.find({ user: req.user.id }).populate();

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
});

module.exports = {
  insertContact,
  updateContact,
  deleteContact,
  getContactById,
  getContactByName,
  getContactByPartOfName,
  getContactsByRadius,
  getMyContacts,
  getContactHistoryById,
  getContactsHistory,
};

const removeDuplicate = (contacts) => {
  for (let i = 0; i < contacts.length; i++) {
    let contact = contacts[i];

    // start from item 1 becasue the first item is
    for (let x = i + 1; x < contacts.length; x++) {
      if (contact._id.equals(contacts[x]._id)) {
        contacts.splice(x, 1);
      }
    }
  }
};
