const express = require("express");
const {
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
} = require("../controllers/Contacts");
const { protect } = require("../middlewares/auth");
const router = express.Router();

router.use(protect);

router.route("/history").get(getContactsHistory);
router.route("/history/:id").get(getContactHistoryById);

router.route("/").post(insertContact).get(getMyContacts);
router
  .route("/:id")
  .get(getContactById)
  .put(updateContact)
  .delete(deleteContact);

router.route("/search/:fullName").get(getContactByName);
router.route("/search/part/:partOfName").get(getContactByPartOfName);
router.route("/redius/:address/:distance").get(getContactsByRadius);

module.exports = router;
