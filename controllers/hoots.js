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

// First, we’ll retrieve the hoot we want to update from the database. We’ll do this using our Hoot model’s findById() method.
// With our retrieved hoot, we need check that this user has permission to update the resource. We accomplish this using an if condition, comparing the hoot.author to _id of the user issuing the request (req.user._id). Remember, hoot.author contains the ObjectId of the user who created the hoot. If these values do not match, we will respond with a 403 status.

router.put("/:hootId", async (req, res) => {
  try {
    // Find the hoot:
    const hoot = await Hoot.findById(req.params.hootId);

    // As an extra layer of protection, we’ll use conditional rendering in our React app to limit access to this functionality so that only the author of a hoot can view the UI elements that allow editing.
    // Check permissions:
    if (!hoot.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    // Update hoot:
    // If the user has permission to update the resource, we’ll call upon our Hoot model’s findByIdAndUpdate() method.
    // When calling upon findByIdAndUpdate(), we pass in three arguments:
    // The first is the ObjectId (req.params.hootId) by which we will locate the hoot.
    // The second is the form data (req.body) that will be used to update the hoot document.
    // The third argument ({ new: true }) specifies that we want this method to return the updated document.
    const updatedHoot = await Hoot.findByIdAndUpdate(
      req.params.hootId,
      req.body,
      { new: true }
    );

    // Append req.user to the author property:
    // After updating the hoot, we’ll append a complete user object to the updatedHoot document (as we did in our create controller function).
    updatedHoot._doc.author = req.user;

    // Issue JSON response:
    res.status(200).json(updatedHoot);
  } catch (error) {
    res.status(500).json(error);
  }
});

// First, we’ll retrieve the hoot we want to delete from the database. We’ll do this using our Hoot model’s findById() method.
// With our retrieved hoot, we need check that this user has permission to delete the resource. We accomplish this using an if condition, comparing the hoot.author to _id of the user issuing the request (req.user._id). Remember, hoot.author contains the ObjectId of the user who created the hoot. If these values do not match, we respond with a 403 Forbidden status.
// If the user has permission to delete the resource, we call upon our Hoot model’s findByIdAndDelete() method.
// The findByIdAndDelete() accepts an ObjectId (req.params.hootId), used to locate the hoot we wish to remove from the database.

router.delete("/:hootId", async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);

    if (!hoot.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
    res.status(200).json(deletedHoot);
  } catch (error) {
    res.status(500).json(error);
  }
});

// As we did when creating hoots, we’ll first append req.user._id to req.body.author. This updates the form data that will be used to create the resource, and ensures that the logged in user is marked as the author of a comment.

// Next we’ll call upon the Hoot model’s findById() method. The retrieved hoot is the parent document we wish to add a comment to.

// Because comments are embedded inside hoot’s, the commentSchema has not been compiled into a model. As a result, we cannot call upon the create() method to produce a new comment. Instead, we’ll use the Array.prototype.push() method, provide it with req.body, and add the new comment data to the comments array inside the hoot document.

// To save the comment to our database, we call upon the save() method of the hoot document instance.

// After saving the hoot document, we locate the newComment using its position at the end of the hoot.comments array, append the author property with a user object, and issue the newComment as a JSON response.

router.post("/:hootId/comments", async (req, res) => {
  try {
    req.body.author = req.user._id;
    const hoot = await Hoot.findById(req.params.hootId);
    hoot.comments.push(req.body);
    await hoot.save();

    // Find the newly created comment:
    const newComment = hoot.comments[hoot.comments.length - 1];

    newComment._doc.author = req.user;

    // Respond with the newComment:
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Let’s breakdown what we’ll accomplish inside our controller function.
// First we call upon the Hoot model’s findById() method. The retrieved hoot is the parent document that holds an array of comments. We’ll need to find the specific comment we wish to update within this array. To do so, we can use the MongooseDocumentArray.prototype.id() method. This method is called on the array of a document, and returns an embedded subdocument based on the provided ObjectId (req.params.commentId).
// With the retrieved comment, we update its text property with req.body.text, before saving the parent document (hoot), and issuing a JSON response with a message of Ok

router.put("/:hootId/comments/:commentId", async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);
    const comment = hoot.comments.id(req.params.commentId);
    comment.text = req.body.text;
    await hoot.save();
    res.status(200).json({ message: "Ok" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// First we call upon the Hoot model’s findById() method. The retrieved hoot is the parent document that holds an array of comments. We’ll need to remove a specific comment from this array.

// To do so, we’ll make use of the MongooseArray.prototype.remove() method. This method is called on the array property of a document, and removes an embedded subdocument based on the provided query object ({ _id: req.params.commentId }).

// After removing the subdocument, we save the parent hoot document, and issue a JSON response with a message of Ok

// controllers/hoots.js

router.delete("/:hootId/comments/:commentId", async (req, res) => {
  try {
    const hoot = await Hoot.findById(req.params.hootId);
    hoot.comments.remove({ _id: req.params.commentId });
    await hoot.save();
    res.status(200).json({ message: "Ok" });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
