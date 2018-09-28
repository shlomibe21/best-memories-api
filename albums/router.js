"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const { Albums } = require("./models");

const router = express.Router();

const jsonParser = bodyParser.json();

// GET request to display all albums
router.get("/", (req, res) => {
  Albums.find()
    .then(albums => {
      res.json({
        albums: albums.map(album => album.serialize())
      });
    })
    .catch(err => {
      console.error(err);
      res
        .status(500)
        .json({ message: "GET albums error: Internal server error" });
    });
});

// GET ID request to display one album
router.get("/:id", (req, res) => {
  Albums.findById(req.params.id)
    .then(album => res.json(album.serialize()))
    .catch(error => {
      console.error(error);
      res.status.json({
        message: "GET album by id error: internal server error"
      });
    });
});

// GET ID request to display one media file
router.get("/:id/:fileid", (req, res) => {
  Albums.findOne(
    { _id: req.params.id },
    { files: { $elemMatch: { _id: req.params.fileid } } }
  )
    .then(file => res.json(file.serialize()))
    .catch(err => {
      console.error(err);
      res
        .status(500)
        .json({ message: "GET media file by id error: Internal server error" });
    });
});

// POST request, create a new album
router.post("/", (req, res) => {
    console.log(req.user);
    const requiredFields = ["albumName", "dateCreated"];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    Albums.create({
        albumName: req.body.albumName,
        dateCreated: req.body.dateCreated,
        text: req.body.text,
        files: req.body.files
    })
        .then(Albums => {
            res.status(201).json(Albums.serialize())
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'POST album error: Internal server error' });
        });
});

// PUT request, update album
router.put('/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = `Request path id \`${req.params.id}\` and request body id 
		\`${req.body.id}\` must match.`;
        console.error(message);
        return res.status(400).json({ message: message });
    }

    const toUpdate = {};
    // we only support a subset of fields being updateable.
    // if the user sent over any of the updatableFields, we udpate those values
    // in document
    const updateableFields = ['albumName', 'dateCreated', 'text', 'files'];

    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });
    console.log(`Updating an album item: \`${req.params.id}\``);
    Albums.findByIdAndUpdate({ _id: req.params.id }, { $set: toUpdate }, { new: true })
        .then(album => res.status(201).json(album))
        .catch(error => res.status(500).json({ message: "PUT album error: Internal server error" }));
});

// DELETE request, delete a single album
router.delete("/:id", (req, res) => {
    Albums.findByIdAndRemove(req.params.id)
        .then(() => {
            console.log(`Deleted album with id \`${req.params.id}\``);
            res.status(204).end();
        });
});

module.exports = { router };
