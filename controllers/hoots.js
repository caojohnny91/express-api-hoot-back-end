// controllers/hoots.js

const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Hoot = require("../models/hoot.js");
const router = express.Router();

// ========== Public Routes ===========

// ========= Protected Routes =========

// veryfiy goes above all these routes becasue only a user can access these routes
router.use(verifyToken);

// everything is already prepended with /hoots from our app.use

// First, before creating a hoot, we’ll append req.user._id to req.body.author. This updates the form data that will be used to create the resource, and ensures that the logged in user is marked as the author of a hoot.
// Next, we’ll call create() on our Hoot model, and pass in req.body. The create() method will return a new hoot document. The author property of this document will only contain an ObjectId, as the data has not yet been populated. In lieu of the populate() method, we’ll append a complete user object to the hoot document, as user is already accessible on our request object (req).
// When we call Mongoose’s create() method, the newly created document is not just a plain JavaScript object, but an instance of a Mongoose document. Before being converted to JSON, this document adds another layer to the structure of a hoot, including a _doc property containing the document that was retrieved from MongoDB. Normally, we don’t need to concern ourselves with this detail, but because we are modifying the author property before issuing a response, we’ll need to go through the _doc property of hoot, to access the actual document.
router.post("/", async (req, res) => {
  try {
    req.body.author = req.user._id;
    const hoot = await Hoot.create(req.body);
    hoot._doc.author = req.user;
    res.status(201).json(hoot);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// We’ll call upon the find({}) method of our Hoot model, retrieving all hoots from the database. When we call upon find({}), we’ll chain two additional methods to the end.
// The first is the populate() method. We’ll use this to populate the author property of each hoot with a user object.
// The second is the sort() method. We’ll use this to sort hoots in descending order, meaning the most recent entries will be at the at the top.
// Once the new hoots are retrieved, we’ll send a JSON response containing the hoots array
router.get("/", async (req, res) => {
  try {
    const hoots = await Hoot.find({})
      .populate("author")
      .sort({ createdAt: "desc" });
    res.status(200).json(hoots);
  } catch (error) {
    res.status(500).json(error);
  }
});

// We’ll call upon our Hoot model’s findById() method and pass in req.params.hootId. We’ll also call populate() on the end of our query to populate the author property of the hoot.
// Once the new hoot is retrieved, we’ll send a JSON response with the hoot object.
router.get("/:hootId", async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId).populate("author");
    res.status(200).json(hoot);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
