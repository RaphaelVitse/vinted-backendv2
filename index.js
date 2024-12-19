const express = require("express"); // j/importe le package express
const cors = require("cors");
const mongoose = require("mongoose"); // j'importe le package mongoose

const app = express(); // je créé le serveur

app.use(express.json()); // permt de lire du JSON
app.use(cors()); // permet d'ouvir la connexion au serveur

require("dotenv").config(); // j'importe les variables dotenv
mongoose.connect(process.env.MONGO_URI); // je me connecte à la base de donnée mongoose

const userRouter = require("./routes/user"); // j'importe ma route UserRouter
const offerRouter = require("./routes/offer"); // j'importe ma route UserRouter
const paymentRouter = require("./routes/payment");

//////// ROUTES ////////////

app.get("/", (req, res) => {
  try {
    console.log("Sur le serveur vinted");

    res.status(200).json({ message: "Bienvenue sur le serveur Vinted !" });
  } catch (error) {
    console.log(error);
  }
});
app.use(userRouter); // je lance ma route userRouter
app.use(offerRouter); // je lance ma route userRouter
app.use(paymentRouter);

app.all("*", (req, res) => {
  console.log("Sur la route all");
  res.status(404).json({ message: "Page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Serveur Vinted started 🚀");
});
