const path = require("path");
const express = require("express");
const cors = require("cors");
const dotEnv = require("dotenv");
require("ejs");

const manageShortURL = require("./src/routes/manageShortURL");
const history = require("./src/routes/url");
const passwordProtection = require("./src/routes/passwordProtection");
const redirectShortURL = require("./src/routes/redirectShortURL");
const authenticate = require("./src/routes/authenticate");
const { MongoDB } = require("./src/mongoDBConfig");

dotEnv.config();
const port = process.env.PORT || 5000;

const app = express();
const mongoClient = new MongoDB();
mongoClient.connect((error, db) => {
    if (error) {
        console.log("Error while establishing connection with Mongo Server");
        process.exit(0);
    } else {
        app.locals.db = db;
        app.all("/:x/:y", (req, res, next) => {
            console.log("endpoint", req.params.x, req.params.y);
            next();
        });
        app.all("/:x", (req, res, next) => {
            console.log("endpoint", req.params.x);
            next();
        });
        app.use(cors());
        app.use(express.json());
        app.use(express.static(path.join(__dirname, "../public/")));
        app.set("views", path.join(__dirname, "views"));
        app.set("view engine", "ejs");

        app.use("/", authenticate, manageShortURL, history, passwordProtection, redirectShortURL);

        app.all("*", (req, res) => {
            res.render("404");
        });
    }
});
app.listen(port, () => {
    console.log("Server running at port : " + port);
});
