const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

// Importer les fonctions Salesforce
const { createSalesforceProduct, removeSalesforceProduct } = require("./salesforce/salesforce");

app.use(express.json());
app.use(cors());

// Connexion à MongoDB
mongoose.connect("mongodb+srv://Kawtarch:kawtar2@cluster0.emfwu0n.mongodb.net/e-commerce", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// API de test
app.get("/", (req, res) => {
  res.send("Express app is running");
});

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Endpoint pour l'upload des images
app.use('/images', express.static('upload/images'));

app.post("/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
  });
});

// Schéma pour les produits
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

// Endpoint pour ajouter un produit
app.post('/addproduct', async (req, res) => {
  let products = await Product.find({});
  let id;

  if (products.length > 0) {
    let lastProduct = products[products.length - 1];
    id = lastProduct.id + 1;
  } else {
    id = 1;
  }

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  try {
    await product.save();
    console.log("Product saved in MongoDB");

    // Création du produit dans Salesforce
    const salesforceProduct = {
      name: req.body.name,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      // Ajoutez d'autres champs nécessaires si requis
    };

    const salesforceResponse = await createSalesforceProduct(salesforceProduct);
    console.log("Product saved in Salesforce");

    res.json({
      success: true,
      name: req.body.name,
      salesforceId: salesforceResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour supprimer un produit
app.post('/removeproduct', async (req, res) => {
  const productId = req.body.id;

  try {
    // Supprimer le produit de MongoDB
    await Product.findOneAndDelete({ id: productId });
    console.log("Product removed from MongoDB");

    // Supprimer le produit de Salesforce
    await removeSalesforceProduct(productId);
    console.log("Product removed from Salesforce");

    res.json({
      success: true,
      name: req.body.name,
    });
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer tous les produits
app.get('/allproducts', async (req, res) => {
  let products = await Product.find({});
  console.log("All products fetched");
  res.send(products);
});

// Schéma pour les utilisateurs
const Users = mongoose.model('Users', {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  }
});

// Endpoint pour enregistrer un utilisateur
app.post('/signup', async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, errors: "An existing user was found with the same email" });
  }

  const cart = {};
  for (let i = 0; i < 300; i++) { // initialise le panier avec des zéros
    cart[i] = 0;
  }

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();
  const data = {
    user: {
      id: user.id
    }
  };
  const token = jwt.sign(data, 'secret_ecom');
  res.json({ success: true, token });
});

// Endpoint pour la connexion
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id
        }
      };
      const token = jwt.sign(data, 'secret_ecom');
      res.json({ success: true, token });
    } else {
      res.json({ success: false, errors: "Wrong password!" });
    }
  } else {
    res.json({ success: false, errors: "Wrong Email!" });
  }
});

// Endpoint pour les nouvelles collections
app.get('/newcollections', async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("New collection fetched");
  res.send(newcollection);
});

// Endpoint pour les produits populaires chez les femmes
app.get('/popularinwomen', async (req, res) => {
  let products = await Product.find({ category: "women" });
  let popular_in_women = products.slice(0, 4);
  console.log("Popular in women fetched");
  res.send(popular_in_women);
});

// Middleware pour récupérer l'utilisateur
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using valid token" });
  } else {
    try {
      const data = jwt.verify(token, 'secret_ecom');
      req.user = data.user;
      next();
    } catch (error) {
      res.status(401).send({ errors: "Please authenticate using valid token" });
    }
  }
};

// Endpoint pour ajouter des produits au panier
app.post('/addtocart', fetchUser, async (req, res) => {
  console.log("Added", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

// Endpoint pour retirer des produits du panier
app.post('/removefromcart', fetchUser, async (req, res) => {
  console.log("Removed", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Removed");
});

// Endpoint pour récupérer les données du panier
app.post('/getcart', fetchUser, async (req, res) => {
  console.log("GetCart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

app.listen(port, (error) => {
  if (!error) {
    console.log("Server running on port " + port);
  } else {
    console.log("Error: " + error);
  }
});
