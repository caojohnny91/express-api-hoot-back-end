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

module.exports = router;
