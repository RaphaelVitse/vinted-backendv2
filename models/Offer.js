// const mongoose = require("mongoose");

// const Offer = mongoose.model("Offer", {
//   product_name: String,
//   product_description: String,
//   product_price: Number,
//   product_details: Array,
//   product_image: Object,
//   owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
// });
// module.exports = Offer;

const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: Array,
  product_image: { type: mongoose.Schema.Types.Mixed, default: {} }, // mongoose.Schema.Types.Mixed est un type souple qui peut contenir n'importe quel type
  product_pictures: Array,
  product_date: { type: Date, default: Date.now },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
