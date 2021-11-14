const path = require("path");
const express = require("express");
const cors = require("cors");
const dotEnv = require("dotenv");
const ejs = require("ejs");

const manageShortURL = require("./src/defaultRoutes/manageShortURL");
const history = require("./src/defaultRoutes/url");
const passwordProtection = require("./src/defaultRoutes/passwordProtection");
const redirectShortURL = require("./src/defaultRoutes/redirectShortURL");
const authenticate = require("./src/defaultRoutes/authenticate");

dotEnv.config();
const port = process.env.PORT || 4000;

const app = express();
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

app.listen(port, () => {
    console.log("Server running at port : " + port);
});
