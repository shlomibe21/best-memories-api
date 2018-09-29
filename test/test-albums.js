"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");

// this makes the expect syntax available throughout this module
const expect = chai.expect;
// this makes the should syntax available throughout this module
const should = chai.should();

const { Albums } = require("../albums/models");
const { closeServer, runServer, app } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

chai.use(chaiHttp);

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure data from one test does not stick
// around for next one
function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn("Deleting database");
    mongoose.connection
      .dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedAlbumsData() {
  console.info("seeding Albums data");
  const seedData = [];
  for (let i = 1; i <= 10; i++) {
    seedData.push({
      albumName: faker.name.findName(),
      dateCreated: faker.date.past(),
      comment: faker.lorem.text(),
      files: [
        {
          fileName: faker.name.findName(),
          dateAdded: faker.date.past(),
          comment: faker.lorem.text(),
          storageLocation: "url"
        },
        {
          fileName: faker.name.findName(),
          dateAdded: faker.date.past(),
          comment: faker.lorem.text(),
          storageLocation: "url"
        }
      ]
    });
  }
  // this will return a promise
  return Albums.insertMany(seedData);
}

describe("Best Memories resource", function() {
  let token;

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedAlbumsData();
  });

  afterEach(function() {
    // tear down database so we ensure no state from this test
    // effects any coming after.
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe("GET /api/albums", () => {
    it("Should return all existing albums", () => {
      // strategy:
      //    1. get back all albums returned by GET request
      //    2. prove res has right status, data type
      //    3. prove the number of albums we got back is equal to number in db.
      //    4. prove all keys exist
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai
        .request(app)
        .get("/api/albums")
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.albums).to.be.a("array");
          expect(res.body.albums).to.have.lengthOf.at.least(1);
          res.body.albums.forEach(function(item) {
            expect(item).to.be.a("object");
            expect(item).to.have.all.keys(
              "id",
              "albumName",
              "dateCreated",
              "comment",
              "files"
            );
          });
          return Albums.countDocuments();
        })
        .then(function(count) {
          expect(res.body.albums).to.have.lengthOf(count);
        });
    });
  });

  describe("GET /api/albums/:id", () => {
    it("Should return one album found by its id", () => {
      let res;
      return Albums.findOne().then(album => {
        let albumId = album.id;
        return chai
          .request(app)
          .get(`/api/albums/${albumId}`)
          .then(function(_res) {
            res = _res;
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a("object");
            expect(res.body).to.have.all.keys(
              "id",
              "albumName",
              "dateCreated",
              "comment",
              "files"
            );
          });
      });
    });
  });

  /*describe("GET /api/albums/:id/:fileid", () => {
    it("Should return one media file found by its id", () => {
      let res;
      return Albums.findOne().then(album => {
        let albumId = album.id;
        let fileId = album.files[0].id;
        return chai
          .request(app)
          .get(`/api/albums/${albumId}/${fileId}`)
          .then(function(_res) {
            res = _res;
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a("object");
            expect(res.body).to.have.all.keys(
              "dateAdded",
              "fileName",
              "files",
              "id",
              "storageLocation",
              "comment"
            );
          });
      });
    });
  });*/

  // TODO: add test to more fields and fix date compare issue
  describe("POST /api/albums", function() {
    it("should add a new album on POST", function() {
      // strategy:
      // make a POST request with data,
      // then prove that the album we get back has
      // right keys, and that `id` is there (which means
      // the data was inserted into db)
      const newAlbum = {
        albumName: faker.name.findName(),
        dateCreated: faker.date.past(),
        comment: faker.lorem.text(),
        files: [
          {
            fileName: faker.name.findName(),
            dateAdded: faker.date.past(),
            comment: faker.lorem.text(),
            storageLocation: "url"
          }
        ]
      };
      return chai
        .request(app)
        .post("/api/albums")
        .send(newAlbum)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body).to.include.keys(
            "id",
            "albumName",
            "dateCreated",
            "comment",
            "files"
          );
          expect(res.body.id).to.not.equal(null);
          expect(res.body.albumName).to.be.equal(newAlbum.albumName);
          //expect(res.body.dateCreated).to.be.equal(newAlbum.dateCreated);
          return Albums.findById(res.body.id);
        })
        .then(album => {
          album.albumName.should.equal(newAlbum.albumName);
          //album.dateCreated.should.equal(newAlbum.dateCreated);
          album.comment.should.equal(newAlbum.comment);
        });
    });
  });

  // TODO: add test to more fields and fix date compare issue
  describe("PUT /api/albums", function() {
    // strategy:
    //  1. Get an existing album from db
    //  2. Make a PUT request to update that album
    //  3. Prove album returned by request contains data we sent
    //  4. Prove album in db is correctly updated
    it("should update fields you send over", function() {
      const updateData = {
        albumName: faker.name.findName(),
        dateCreated: faker.date.past(),
        comment: faker.lorem.text(),
        files: [
          {
            fileName: faker.name.findName(),
            dateAdded: faker.date.past(),
            comment: faker.lorem.text(),
            storageLocation: "url"
          },
          {
            fileName: faker.name.findName(),
            dateAdded: faker.date.past(),
            comment: faker.lorem.text(),
            storageLocation: "url"
          }
        ]
      };

      return Albums.findOne()
        .then(album => {
          updateData.id = album.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return (
            chai
              .request(app)
              .put(`/api/albums/${album.id}`)
              /*.set("Authorization", `Bearer ${token}`)*/
              .send(updateData)
          );
        })
        .then(function(res) {
          expect(res).to.have.status(201);
          return Albums.findById(updateData.id);
        })
        .then(album => {
          album.albumName.should.equal(updateData.albumName);
          //album.dateCreated.should.equal(updateData.dateCreated);
          album.comment.should.equal(updateData.comment);
        });
    });
  });
});
