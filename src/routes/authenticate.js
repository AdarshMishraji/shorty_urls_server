const express = require("express");
const dotEnv = require("dotenv");

const { decodeJWT } = require("../helpers");
const { authenticate } = require("../utils/auth");

dotEnv.config();

const app = express.Router();

app.post("/authenticate", (req, res) => {
    const { authorization } = req.headers;
    const { token } = req.body;
    if (token) {
        const user = decodeJWT(token);
        if (authorization === process.env.AUTHORIZATION && user) {
            authenticate(user, req.app.locals.db)
                .then(({ code, token }) => res.status(code).json({ token }))
                .catch(({ code, error }) => res.status(code).json({ error }));
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    } else {
        res.status(401).json({ error: "Authorization Failed." });
    }
});

module.exports = app;
