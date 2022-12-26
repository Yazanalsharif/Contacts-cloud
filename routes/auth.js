const express = require("express");
const { register, login } = require("../controllers/auth");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);

module.exports = router;
