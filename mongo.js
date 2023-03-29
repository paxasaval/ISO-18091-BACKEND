const config = require("./utils/config");
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const fs = require("fs");
const ODS = require("./models/ods");
const Type = require("./models/tipo");
mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB");
    saveData();
  })
  .catch((error) => {
    logger.error("error conecting to MongoDB:", error.message);
  });
const saveData = () => {
  const rawData = fs.readFileSync("./prueba2.json");
  const jsonData = JSON.parse(rawData);

  //console.log(jsonData)
  let index = 0;
  jsonData.map((data) => {
    const newData = new Type({ ...data });
    //    console.log(newData)
    newData.save().then(() => {
      index += 1;
      console.log("new data!", index);
    });
  });
};
