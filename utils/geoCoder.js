const NodeGeocoder = require("node-geocoder");
const dotenv = require("dotenv");

dotenv.config({
  path: "./config/config.env",
});

const getGeoCode = async (address) => {
  try {
    const options = {
      provider: process.env.MAP_PROVIDER,
      // Optional depending on the providers
      //fetch: customFetchImplementation,
      apiKey: process.env.MAP_QUEST_API, // for Mapquest, OpenCage, Google Premier
      formatter: null, // 'gpx', 'string', ...
    };

    const geoCoder = NodeGeocoder(options);

    const loc = await geoCoder.geocode(address);

    return loc[0];
  } catch (err) {
    console.log(err);
    return err.message;
  }
};

module.exports = getGeoCode;
