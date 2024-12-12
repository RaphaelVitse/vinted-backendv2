//// Valider que le USER est bien identifié pour povoir poster une offre ///////////

const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // je récupere le token d'authentification
  const token = req.headers.authorization.replace("Bearer ", ""); // recupère le champs authorization lors de la requete (forme bearer token) puis je supprime et remplace le mot "bearer " par un simple espace, afin de ne conserver que le jeton

  const user = await User.findOne({ token: token }); // je recherche dans la base de données si un user à le token indiqué. si pas de user trouvé alors retournera null

  if (!user || !token) {
    return res.status(401).json({ error: "Unauthorized !" });
  }
  req.user = user; // je rattache le user trouvé à la requete  req
  next(); // indique que le traitement du middleware est terminé et indique de passer à la suite du code
};

module.exports = isAuthenticated;
