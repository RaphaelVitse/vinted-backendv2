const express = require("express");
const stripe = require("stripe")(process.env.STRIPE);

const router = express.Router();

router.post("/payment", async (req, res) => {
  try {
    console.log(req.body.amount);

    const paymentIntent = await stripe.paymentIntents.create({
      description: req.body.title,
      amount: (req.body.amount * 100).toFixed(0),
      currency: "eur",
    });
    res.status(200).json({ paymentIntent });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
