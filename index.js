const path = require("path");
const express = require("express");
const cors = require("cors");
const dotEnv = require("dotenv");
require("ejs");

const MongoDB = require("./src/mongoDBConfig");
const { authenticate, meta, passwordProtection, redirectShortURL, manageShortURL, url, details } = require("./src/routes");
const { logRoute } = require("./src/middlewares");
const rateLimit = require("express-rate-limit");

dotEnv.config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public/")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
    rateLimit({
        handler: (req, res, next) => {
            return res.status(429).json({ error: "Server is busy, please try again after sometimes." });
        },
        windowMs: 60000,
        max: 10,
    })
);
app.use(logRoute);

app.use((req, res, next) => {
    res.setTimeout(25000, () => {
        return res.status(500).json({ error: "Server Timeout", reason: "Internal Error" });
    });
    if (app.locals?.db) next();
    else {
        MongoDB.connect((error, db) => {
            if (db) app.locals.db = db;
            else console.log("Unable to connect to DB", error);
            next();
        });
    }
});

app.use("/authenticate", authenticate);
app.use("/meta", meta);

app.use("/my", url, details);
app.use("/manage", manageShortURL);

app.use("/password_for_protected_site", passwordProtection);
app.use("/", redirectShortURL);

app.all("*", (req, res) => {
    return res.render("404");
});

app.listen(port, () => console.log("Server running at port : " + port));
