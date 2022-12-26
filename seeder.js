const mongoose = require("mongoose");
const dotenv = require("dotenv");
const chalk = require("chalk");
const Contacts = require("./models/Contacts.js");
const User = require("./models/User");
const fs = require("fs");
const { faker } = require("@faker-js/faker");

//setup the env veriables
dotenv.config({
  path: "./config/config.env",
});

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, "utf-8")
);

// avoid the warnings
mongoose.set("strictQuery", "false");

//connect to the DB
mongoose.connect(process.env.MONGOOSE_LOCAL_URI, {});
const importData = async () => {
  try {
    await User.create(users);
    console.log(chalk.white.bgGreen("data Destroyed..."));

    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(0);
  }
};
//deleteData
const deleteData = async () => {
  try {
    await Contacts.deleteMany();
    await User.deleteMany();
    //log deletion after the deletion finish
    console.log(chalk.white.bgRed("data Destroyed..."));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
};

const getData = async () => {
  try {
    const data = [];
    for (let i = 0; i < 500; i++) {
      data[i] = {
        firstName: faker.name.firstName(),
        middleName: faker.name.middleName(),
        lastName: faker.name.lastName(),
        phoneNumber: faker.phone
          .phoneNumber("+## ## ### ## ##")
          .split(" ")
          .join(""),
        address: faker.address.city(),
      };
    }

    await Contacts.create(data);
    console.log(chalk.white.bgGreen(`the data is imported`));
  } catch (error) {
    console.log(chalk.white.bgRed(error.message));
  }
  process.exit(0);
};

if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
}
