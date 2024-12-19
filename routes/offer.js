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
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      //////////////*****************////////////////
      // const convertedPicture = convertToBase64(req.files.picture); // je recupere la photo transmise et la convertit en format lisible
      // const cloudinaryResponse = await cloudinary.uploader.upload(
      //   convertedPicture,
      //   { folder: "vinted/offer" }
      // );
      ///////// CREATION De l OFFER  ///////////

      // Si on reçoit title et price dans le body et une clef picture dans req.files.
      // req.files?.picture est du optional chaining : si req n'a pas de clef files et qu'on n'avait pas mis le ?, le fait de chercher à lire sa clef picture provoquerait une erreur. Grâce à l'optional chaining, si files n'existe pas, la clef picture n'est pas lue et on ne passe pas dans le if.
      if (title && price && req.files?.picture) {
        // Création de la nouvelle annonce (sans l'image)
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
          owner: req.user,
        });

        // Gestion de l'image. 2 possibilités :
        // POSSIBILITE 1 => Soit je recois une seule image
        // POSSIBILITE 2 =>  Soit j'en recois plusieurs

        // POSSIBILITE 1 =>
        // Si on ne reçoit qu'une image (req.files.picture n'est donc pas un tableau)
        if (!Array.isArray(req.files.picture)) {
          // On vérifie qu'on a bien affaire à une image
          if (req.files.picture.mimetype.slice(0, 5) !== "image") {
            return res.status(400).json({ message: "You must send images" });
          }
          // Envoi de l'image à cloudinary
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.picture),
            {
              // Dans le dossier suivant
              folder: `/vinted-v2/offers/${newOffer._id}`,
              // Avec le public_id suivant
              public_id: "preview",
            }
          );

          // ajout de l'image dans newOffer
          newOffer.product_image = result;
          // On rajoute l'image à la clef product_pictures
          newOffer.product_pictures.push(result);
        }
        //POSSIBILITE 2 =>
        else {
          // Si on a affaire à un tableau, on le parcourt
          for (let i = 0; i < req.files.picture.length; i++) {
            const picture = req.files.picture[i];
            // Si on a afaire à une image
            if (picture.mimetype.slice(0, 5) !== "image") {
              return res.status(400).json({ message: "You must send images" });
            }
            if (i === 0) {
              // On envoie la première image à cloudinary et on en fait l'image principale (product_image)
              const result = await cloudinary.uploader.upload(
                convertToBase64(picture),
                {
                  folder: `vinted-v2/offers/${newOffer._id}`,
                  public_id: "preview",
                }
              );
              // ajout de l'image dans newOffer
              newOffer.product_image = result;
              newOffer.product_pictures.push(result);
            } else {
              // On envoie toutes les autres à cloudinary et on met les résultats dans product_pictures
              const result = await cloudinary.uploader.upload(
                convertToBase64(picture),
                {
                  folder: `vinted-v2/offers/${newOffer._id}`,
                }
              );
              newOffer.product_pictures.push(result);
            }
          }
        }
        await newOffer.save();
        res.status(201).json(newOffer);
      } else {
        res
          .status(400)
          .json({ message: "title, price and picture are required" });
      }

      // const returnInfos = {
      //   product_name: title,
      //   product_description: description,
      //   product_price: price,
      //   product_details: [
      //     {
      //       MARQUE: brand,
      //       TAILLE: size,
      //       ETAT: condition,
      //       COULEUR: color,
      //       EMPLACEMENT: city,
      //     },
      //   ],
      //   product_image: cloudinaryResponse,
      //   owner: req.user,
      // };
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
    const { title, priceMin, priceMax, page, sort, limit } = req.query;

    let skip = 0; //Nombre de documents à ignorer (pour atteindre la bonne page).

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
      .select(
        "product_name product_price product_description product_details product_image.secure_url product_pictures _id"
      ) //Retourne uniquement les champs product_name et product_price (pour exclure l'id j'aurais du mettre -_id.
      .populate("owner", "account") // remplace le champs owner (stocké comme objectid) par les infos dans la collection User dans laquelle je recupere uniquement les infos account
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

router.get("/offers/:id", async (req, res) => {
  console.log(req.params.id);
  try {
    const offers = await Offer.findById(req.params.id) // je cherche et recupere les offres dans la bdd selon l'id
      .populate("owner", "account") // remplace le champs owner (stocké comme objectid) par les infos dans la collection User dans laquelle je recupere uniquement les infos account
      .select(
        "product_details product_image.secure_url product_name product_description product_price product_pictures _id"
      ); // limite les infos a retourner
    res.status(200).json(offers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
