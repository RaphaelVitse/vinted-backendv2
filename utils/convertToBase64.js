//pour convertir des images au format compatibles cloudinary
const convertToBase64 = (file) => {
  console.log("log de file", file);

  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

module.exports = convertToBase64;
