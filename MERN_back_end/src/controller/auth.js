const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");

const generateJwtToken = (_id, role) => {
  return jwt.sign({ _id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

exports.signup = (req, res) => {
  User.findOne({ email: req.body.email }).exec(async (error, user) => {
    if (user) {
      return res.status(400).json({
        message: "User already registered",
      });
    }

    const { firstname, lastname, email, password } = req.body;
    const hash_password = await bcrypt.hash(password, 10);
    const _user = new User({
      firstname,
      lastname,
      email,
      hash_password,
      username: shortid.generate(),
    });

    _user.save((error, user) => {
      if (error) {
        return res.status(400).json({
          message: "Something went wrong",
        });
      }

      if (user) {
        const token = generateJwtToken(user._id, user.role);
        const { _id, firstname, lastname, email, role, fullname } = user;
        return res.status(201).json({
          token,
          user: { _id, firstname, lastname, email, role, fullname },
        });
      }
    });
  });
};

exports.signin = (req, res) => {
  User.findOne({ email: req.body.email }).exec((error, user) => {
    if (error) {
      return res.status(400).json({ error });
    }
    if (user) {
      const isPassword = user.authenticate(req.body.password);
      if (isPassword && user.role === "user") {
        const token = generateJwtToken(user._id, user.role);
        const { _id, firstname, lastname, email, role, fullname } = user;
        res.status(200).json({
          token,
          user: { _id, firstname, lastname, email, role, fullname },
        });
      } else {
        return res.status(400).json({
          message: "Something went wrong",
        });
      }
    }
  });
};
