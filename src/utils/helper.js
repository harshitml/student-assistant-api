import fs from "fs";
import mongoose from "mongoose";

export const getLocalPath = (fileName) => {
  return `public/images/${fileName}`;
};

export const getStaticFilePath = (req, fileName) => {
  return `${req.protocol}://${req.get("host")}/temp/${fileName}`;
};

export const removeLocalFile = (localPath) => {
  fs.unlink(localPath, (err) => {
    if (err) console.log("Error while removing local files: ", err);
    else {
      console.log("Removed local: ", localPath);
    }
  });
};
