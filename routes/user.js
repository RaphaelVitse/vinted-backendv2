const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User"); // j'importe mon modele user de mongoose

const router = express.Router(); // j'importe Router pour creer ma route userRouter

/////////////////// SIGNUP ////////////////////////

router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, password, newsletter } = req.body;
    // console.log(email, username, newsletter, password);

    //////////////////// SECURISATION //////////////////
    const isUserExisting = await User.findOne({ email: email });
    // console.log("isExisting", isUserExisting);

    if (!email || !username || !password) {
      console.log("missing parameters");

      return res.status(400).json({ message: "Missing parameters !" });
    }

    if (isUserExisting) {
      console.log("Email is already existing !");
      return res.status(409).json({ message: "Email is already existing !" });
    }

    //////// CRYPTAGE DU PASSWORD //////////
    const saltSignup = uid2(16);
    console.log("salt =", saltSignup);
    const hashSignup = SHA256(password + saltSignup).toString(encBase64);
    console.log("hashSignup =", hashSignup);
    const token = uid2(64);
    console.log("token = ", token);

    ///////// CREATION DU USER ///////////
    const newUSer = new User({
      email,
      account: {
        username,
      },
      newsletter,
      token,
      hash: hashSignup,
      salt: saltSignup,
    });

    await newUSer.save();

    res.status(201).json({
      _id: newUSer.id,
      token: newUSer.token,
      account: newUSer.account,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/////////////////// LOGIN ////////////////////////

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    ///////// JE VERIFIE SI L'EMAIL EST PRESENT EN BDD SINON JE METS UN MESSAGE D'ERREUR ////////////
    const isUserExisting = await User.findOne({ email: email });
    if (!isUserExisting) {
      return res.status(401).json({ message: "email unknown !" });
    }
    //////// JE RECUPERE LE HASH ET SALT EN BASE DE DONNÉES + LE TOKEN ET USERNAME/////////////
    const hashSignup = isUserExisting.hash;
    console.log("hashSignup login  =", hashSignup);
    const saltSignup = isUserExisting.salt;
    console.log("saltSignup login  =", saltSignup);
    const tokenToRecover = isUserExisting.token;
    console.log("tokenToRecover login  =", tokenToRecover);
    const usernameToRecover = isUserExisting.account.username;
    console.log("usernameTorecover login  =", usernameToRecover);

    ////// JE VERIFIE LA COHÉRENCE ENTRE LE PASSWORD SAISI EN LOGIN ET CELUI PRESENT EN BDD ///////////
    const hashLogin = SHA256(password + saltSignup).toString(encBase64);

    if (hashSignup === hashLogin) {
      res.status(200).json({
        message: "Login ok",
        token: tokenToRecover,
        username: usernameToRecover,
      });
    } else {
      return res.status(401).json({ message: "Incorrect password !" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; // j'exporte ma route
