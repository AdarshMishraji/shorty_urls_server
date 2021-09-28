const path = require("path");
const express = require("express");
const cors = require("cors");
const dotEnv = require("dotenv");

const generateShortURL = require("./defaultRoutes/generateShortURL");
const history = require("./defaultRoutes/history");
const redirectShortURL = require("./defaultRoutes/redirectShortURL");
const authenticate = require("./defaultRoutes/authenticate");

const generateShortURL_v2 = require("./v2Routes/generateShortURL");
const allURLs_v2 = require("./v2Routes/allURLs");
const urlVisitHistory_v2 = require("./v2Routes/urlVisitHistory");
const redirectShortURL_v2 = require("./v2Routes/redirectShortURL");
const routeErrorHandler_v2 = require("./v2Routes/routeErrorHandler");

dotEnv.config();
const port = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public/")));

app.use("/v2", generateShortURL_v2, allURLs_v2, urlVisitHistory_v2, redirectShortURL_v2, routeErrorHandler_v2);
app.use(authenticate, generateShortURL, history, redirectShortURL);

app.all("*", (req, res) => {
    console.log("User bhand ho gya hai.");
    res.status(404).sendFile(path.join(__dirname, "../public/404.html"));
});

app.listen(port, () => {
    console.log("Server running at port : " + port);
});
