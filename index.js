const path = require("path");
const express = require("express");
const cors = require("cors");
const dotEnv = require("dotenv");

const generateShortURL = require("./src/defaultRoutes/generateShortURL");
const history = require("./src/defaultRoutes/history");
const redirectShortURL = require("./src/defaultRoutes/redirectShortURL");
const authenticate = require("./src/defaultRoutes/authenticate");

dotEnv.config();
const port = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public/")));

app.use(authenticate, generateShortURL, history, redirectShortURL);

app.all("*", (req, res) => {
    console.log("User bhand ho gya hai.");
    res.status(404).sendFile(path.join(__dirname, "../public/404.html"));
});

app.listen(port, () => {
    console.log("Server running at port : " + port);
});
