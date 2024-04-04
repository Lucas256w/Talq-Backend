const multer = require("multer");
const path = require("path");

const imagesPath = path.join(__dirname, "..", "public", "images");

// storing image on server's disk with multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
