
const express = require('express');
const verifyToken = require("../middleware/verify-token.js");
const Hoot = require("../models/hoot.js");
const router = express.Router();

// POST /hoots - CREATE "protected" 
router.post('/', verifyToken, async (req, res) => {
    try {
        req.body.author = req.user._id;
        const hoot = await Hoot.create(req.body);
        hoot._doc.author = req.user // see all authors
        res.status(201).json(hoot);
    } catch (error) {
        console.log(error) //TODO: remove before production 
        res.status(500).json({ error: error.message })
    }
});

// GET /hoots - read ROUTE "Protected"
router.get("/", verifyToken, async (req, res) => {
    try {
      const hoots = await Hoot.find({})
        .populate('author')
        .sort({ createdAt: "desc" });
      res.status(200).json(hoots);
    } catch (err) {
      console.log(err);
      res.status(500).json({ err: err.message });
    }
});

// GET /hoots/"hootId" - READ Route "Protected"
router.get('/:hootId', verifyToken, async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId)
        .populate([
            'author',
            'comments.author',
        ]);
        res.status(200).json(hoot);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
})

// PUT /hoots/: hootId update ROUTE "Protected"
router.put('/:hootId', verifyToken, async(req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        if(!hoot.author.equals(req.user._id)){
           return res.status(403).send('You\'re not allowed to do that!');
        }
        const updateHoot = await Hoot.findByIdAndUpdate(
            req.params.hootId,
            req.body,
            { new: true }
        );
        updateHoot._doc.author = req.user // a great alternative since we don't have .populate
        res.status(200).json(updateHoot);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

router.delete("/:hootId", verifyToken, async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);

        if (!hoot.author.equals(req.user._id)){
            return res.status(403).send("You're not allowed to do that!");
        }

        const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
        res.status(200).json(deletedHoot);
    } catch (error) {
        console.log(error);
        res.status(500).json({ err: err.message });
    }
});

// POST /hoots/:hootId/comments CREATE comment "protected"
router.post('/:hootId/comments', verifyToken, async(req, res) => {
    try{
        req.body.author = req.user._id;
        const hoot = await Hoot.findById(req.params.hootId);
        hoot.comments.push(req.body);
        await hoot.save();

        const newComment = hoot.comments[hoot.comments.length -1];
        newComment._doc.author = req.user; // add requesting user's details 
        res.status(201).json(newComment);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
})


module.exports = router;
