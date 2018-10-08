"use strict";

const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { Albums } = require("./models");

const aws = require("aws-sdk");

const jsonParser = bodyParser.json();
const { S3_BUCKET, S3_URL } = require("../config");

aws.config.region = "us-east-1";
// AWS S3 - GET Signed URL
router.get("/sign-s3", (req, res) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  const fileName = req.query["file-name"];
  const fileType = req.query["file-type"];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: `${fileName}`,
    Expires: 600,
    ACL: "public-read",
    ContentType: fileType
  };

  s3.getSignedUrl("putObject", s3Params, (err, data) => {
    if (err) {
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `${S3_URL}${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

// AWS S3 - Get the entire object from the bucket
router.get("/get-object-s3", (req, res) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  const fileName = req.query["file-name"];
  const fileType = req.query["file-type"];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName
  };
  s3.getObject(s3Params, (err, data) => {
    if (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "PUT album error: Internal server error" });
    }
    const returnData = {
      signedRequest: data,
      url: `${S3_URL}test.png`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

// AWS S3 - Get the object's head from the bucket
router.get("/get-head-object-s3", (req, res) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  const fileName = req.query["file-name"];
  const fileType = req.query["file-type"];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName
  };
  s3.headObject(s3Params, (err, data) => {
    if (err) {
      console.log(err.statusCode);
      if(err.statusCode === 404) {
          res.status(404).end();
          return;
      }
      res
        .status(500)
        .json({ message: "PUT album error: Internal server error" });
    }

    res.status(200).end();
  });
});

// AWS S3 - Delete an object from the bucket
router.delete("/delete-object-s3", (req, res) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  const fileName = req.query["file-name"];
  const fileType = req.query["file-type"];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName
  };
  s3.deleteObject(s3Params, (err, data) => {
    if (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "AWS S3 delete object: Internal server error" });
    }
    res.status(200).end();
  });
});

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
    comment: req.body.comment,
    files: req.body.files
  })
    .then(Albums => {
      res.status(201).json(Albums.serialize());
    })
    .catch(err => {
      console.error(err);
      res
        .status(500)
        .json({ error: "POST album error: Internal server error" });
    });
});

// PUT request, update album
router.put("/:id", (req, res) => {
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
  const updateableFields = ["albumName", "dateCreated", "comment", "files"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });
  console.log(`Updating an album item: \`${req.params.id}\``);
  Albums.findByIdAndUpdate(
    { _id: req.params.id },
    { $set: toUpdate },
    { new: true }
  )
    .then(album => res.status(201).json(album))
    .catch(error => {
      res
        .status(500)
        .json({ message: "PUT album error: Internal server error" });
    });
});

// DELETE request, delete a single album
router.delete("/:id", (req, res) => {
  Albums.findByIdAndRemove(req.params.id).then(() => {
    console.log(`Deleted album with id \`${req.params.id}\``);
    res.status(204).end();
  });
});

// GET request to display one media file
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

// PUT request, add new media files to an album
router.patch("/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Request path id \`${req.params.id}\` and request body id 
          \`${req.body.id}\` must match.`;
    console.error(message);
    return res.status(400).json({ message: message });
  }

  const toUpdate = {};
  // we only support files as updateable field.
  const updateableFields = ["files"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });
  console.log(`Updating an album item: \`${req.params.id}\``);
  Albums.findByIdAndUpdate(
    { _id: req.params.id },
    { $push: toUpdate },
    { new: true }
  )
    .then(album => res.status(201).json(album))
    .catch(error => {
      res
        .status(500)
        .json({ message: "PUT files in album error: Internal server error" });
    });
});

// DELETE request, delete one media file
router.delete("/:id/:fileid", (req, res) => {
  Albums.update(
    { _id: req.params.id },
    { $pull: { files: { _id: req.params.fileid } } },
    { safe: true }
  )
    .then(() => res.status(204).end())
    .catch(err =>
      res
        .status(500)
        .json({ message: "DELETE single file: Internal server error" })
    );
});

module.exports = { router };
