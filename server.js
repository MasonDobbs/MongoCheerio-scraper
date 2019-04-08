const mongoose = require("mongoose");
const axios = require("axios");
const express = require("express");
const cheerio = require("cheerio");
const db = require("./models");
const logger = require("morgan");
const exphbs = require("express-handlebars");


const PORT = 3000;

const app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

app.engine(
    "handlebars",
    exphbs({
      defaultLayout: "main"
    })
  );
  app.set("view engine", "handlebars");
  

mongoose.connect("mongodb://localhost/articles", {useNewUrlParser: true});

app.get("/scrape", (req, res) => {

    axios.get("https://www.ign.com/").then(response => {
        const $ = cheerio.load(response.data);

        $("div article").each(function (i, element) {

            let result = {};

            result.title = $(this).text();
            result.link = $(this).children("a").attr("href");
            console.log(result);

            db.Article.create(result).then(dbArticle => {
                console.log(dbArticle);
            }).catch((err) => {
                console.error(err);
            });
        });

        res.send("Scrape Completed");
    });
});

app.get("/articles", (req, res) => {

    db.Article.find({}).then(dbArticle => {
        res.json(dbArticle);
    }).catch((err) => {
        res.json(err);
    });
});

app.post("/articles/:id", (req, res) => {
    db.Article.findOne({ _id: req.params.id }).populate("note").then(dbArticle => {
        res.json(dbArticle);
    }).catch(err => {
        res.json(err);
    });
});

app.post("articles/:id", (req, res) => {

    db.Note.create(req.body).then( dbNote => {

        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id}, {new: true});
    }).then( dbArticle => {
        res.json(dbArticle);
    }).catch( err => {
        res.json(err);
    });
});

app.listen(PORT, () => {
    console.log("App running on port " + PORT);
});