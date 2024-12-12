const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthentificated");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const convertToBase64 = require("../utils/convertToBase64");

const router = express.Router();

////////////////////////////////////////////////
/////////////////  PUBLISH /////////////////////////
////////////////////////////////////////////////
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const convertedPicture = convertToBase64(req.files.picture); // je recupere la photo transmise et la convertit en format lisible
      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertedPicture,
        { folder: "vinted/offer" }
      );

      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      ///////// CREATION De l OFFER///////////
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
            TAILLE: size,
            ETAT: condition,
            COULEUR: color,
            EMPLACEMENT: city,
          },
        ],
        product_image: cloudinaryResponse,
        owner: req.user,
      });

      await newOffer.save();

      const returnInfos = {
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
            TAILLE: size,
            ETAT: condition,
            COULEUR: color,
            EMPLACEMENT: city,
          },
        ],
        product_image: cloudinaryResponse,
        owner: req.user,
      };
      res.status(201).json(returnInfos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  }
);

////////////////////////////////////////////////
/////////////////  GET /////////////////////////
////////////////////////////////////////////////

router.get("/offers", async (req, res) => {
  try {
    console.log(req.query);
    const { title, priceMin, priceMax, page, sort } = req.query;

    let skip = 0; //Nombre de documents à ignorer (pour atteindre la bonne page).
    let limit = 0; //Nombre de résultats affichés par page
    let pageToSearch = page;
    //Si pas de page ou si page est 1 dans la requete, alors pas de skip d'annonces et on est sur la page 1
    if (!page || page === "1") {
      skip = 0;
      pageToSearch = 1;
    }
    const filters = {};
    /////// FILTRE PAR RECHERCHE ///////////
    if (title) {
      filters.product_name = new RegExp(title, "i"); // si title est dans la requete, alors je recherche les produits contenant ce mot (insensible à la casse grace à i)
    }

    ////// FILTRE PAR PRIX ////////////////////
    if (priceMax) {
      filters.product_price = { $lte: Number(priceMax) }; //Si un priceMax est dans la requete, on ajoute une condition $lte (moins ou égal).
    }

    if (priceMin) {
      if (filters.product_price) {
        filters.product_price.$gte = Number(priceMin); //Si un priceMin est dans la requete, on ajoute une condition $gte (plus ou égal).
      } else {
        filters.product_price = { $gte: Number(priceMin) };
      }
    }
    //////////////// TRI DES RESULTATS //////////////////////
    const sortPrice = {};
    if (sort === "price-desc") {
      sortPrice.product_price = -1; // -1 pour un tri par prix décroissant (plus cher au moins cher).
    } else {
      sortPrice.product_price = 1;
    } // 1 pour un tri par prix croissant (moins cher au plus cher).

    const offers = await Offer.find(filters) //Recherche les offres correspondant aux filtres passés
      .select("product_name product_price -_id") //Retourne uniquement les champs product_name et product_price en excluant l’_id.
      .sort(sortPrice)
      .limit(limit) //Limite le nombre de documents retournés par requête (pagination).
      .skip((pageToSearch - 1) * limit); //	Ignore les résultats des pages précédentes pour retourner les résultats de la page actuelle.

    const totalCount = await Offer.countDocuments(filters);

    res.status(200).json({
      count: totalCount, // Compte le nombre total d’offres correspondant aux filtres s'il y en a.
      offers: offers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  console.log(req.params.id);
  try {
    const offers = await Offer.findById(req.params.id) // je cherche et recupere les offres dans la bdd selon l'id
      .populate("owner", "account") // remplace le champs owner (stocké comme objectid) par les infos dans la collection User dans laquelle je recupere uniquement les infos account
      .select(
        "product_details product_image.secure_url product_name product_description product_price"
      ); // limite les infos a retourner
    res.status(200).json(offers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
