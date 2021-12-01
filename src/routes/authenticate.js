const express = require("express");
const dotEnv = require("dotenv");

const { validateAccess } = require("../middlewares");
const { decodeJWT } = require("../helpers");
const { authenticate } = require("../utils/auth");

dotEnv.config();

const app = express.Router();

app.use(validateAccess);

app.post("/", (req, res) => {
    const { token } = req.body;
    try {
        if (token) {
            const user = decodeJWT(token);
            authenticate(user, req.app.locals.db)
                .then(({ code, data }) => res.status(code).json(data))
                .catch(({ code, error }) => res.status(code).json({ error }));
        } else {
            return res.status(401).json({ error: "Authorization Failed.", reason: "Token not available." });
        }
    } catch (error) {
        console.log(e);
        return res.status(401).json({ error: "Authorization Failed.", reason: e });
    }
});

module.exports = app;
