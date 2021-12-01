const express = require("express");
const dotEnv = require("dotenv");

const { verifyAndDecodeJWT } = require("../../helpers");
const { getMeta } = require("../../controllers");
const { validateAccess } = require("../../middlewares");

dotEnv.config();

const app = express.Router();

app.use(validateAccess);

app.get("/", (req, res) => {
    const { access_token } = req.headers;
    const { withoutAuth } = req.query;
    if (withoutAuth === "true" || access_token) {
        const user = withoutAuth === "true" || verifyAndDecodeJWT(access_token);
        getMeta(withoutAuth, user, req.app.locals.db)
            .then(({ code, data }) => res.status(code).json(data))
            .catch(({ code, error }) => res.status(code).json({ error }));
    } else {
        return res.status(401).json({ error: "Authorization Failed." });
    }
});

exports.meta = app;