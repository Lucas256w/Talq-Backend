const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

const cloudinary = require("../../config/cloudinaryConfig");

// Function to validate input fields
const validate = (method) => {
  switch (method) {
    case "find_user": {
      return [
        body("username", "Username is required").escape().notEmpty(),
        body("password", "Password is required").escape().notEmpty(),
      ];
    }
    case "new_user": {
      return [
        body("username", "Username must be at least 4 characters long")
          .trim()
          .isLength({ min: 4 })
          .escape(),
        body("email", "Must be a valid email address")
          .trim()
          .isEmail()
          .normalizeEmail()
          .escape(),
        body("password", "Password must be at least 8 characters long")
          .trim()
          .isLength({ min: 8 })
          .escape(),
        body("confirmPassword", "Confirm Password does not match password")
          .trim()
          .custom((value, { req }) => value === req.body.password)
          .escape(),
      ];
    }
  }
};

//Login handler
exports.find_user = validate("find_user").concat(
  asyncHandler(async (req, res) => {
    const errors = validationResult;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({ username: req.body.usernmae }).exec();
    if (!user) {
      return res.status(401).json({ message: "Login failed: User not found." });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (match) {
      // USE JWT TO SIGN USER AND SEND TOKEN
      jwt.sign(
        { user },
        process.env.SECRET_KEY,
        { expiresIn: "2 days" },
        (err, token) => {
          return res.json({
            message: "Login successful",
            username: user.username,
            email: user.email,
            profile_img: user.profile_img,
            id: user.id,
            token,
          });
        }
      );
    } else {
      return res
        .status(401)
        .json({ message: "Login failed: Incorrect password." });
    }
  })
);

// re-login handler
exports.re_login_user = asyncHandler(async (req, res) => {
  res.json({
    username: req.user.username,
    email: req.user.username,
    profile_img: req.user.profile_img,
    id: req.user._id,
  });
});

// Sign up handler
exports.new_user = validate("new_user").concat(
  asyncHandler(async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);

    const userExist = await User.findOne({
      username: req.body.username,
    }).exec();

    if (userExist) {
      return res.status(401).json({ message: "Username taken" });
    }

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let user;

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      user = new User({
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
        profile_img: result.secure_url,
        cloudinary_id: result.public_id,
      });
    } else {
      user = new User({
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
      });
    }

    try {
      await user.save();
      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      // Handle errors like duplicate username/email
      console.log("hello");
      res.status(500).json({
        message: "An error occurred while creating the user.",
        error: error.message,
      });
    }
  })
);
