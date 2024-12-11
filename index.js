const express = require("express"); // j/importe le package express
const cors = require("cors");
const mongoose = require("mongoose"); // j'importe le package mongoose

const app = express(); // je créé le serveur

app.use(express.json()); // permt de lire du JSON
app.use(cors()); // permet d'ouvir la connexion au serveur

mongoose.connect("mongodb://localhost:27017/vinted-backendv2"); // je me connecte à la base de donnée mongoose

const userRouter = require("./routes/user"); // j'importe ma route UserRouter

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

app.all("*", (req, res) => {
  console.log("Sur la route all");
  res.status(404).json({ message: "Page not found" });
});

app.listen(3000, () => {
  console.log("Serveur Vinted started 🚀");
});