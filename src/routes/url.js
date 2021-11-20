const express = require("express");
const dotEnv = require("dotenv");
const { VerifyAndDecodeJWT } = require("../helpers");
const { getURLs, urlData, getMeta } = require("../utils/url");

dotEnv.config();

const app = express.Router();

app.get("/urls", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { limit, skip } = req.query;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (user) {
                getURLs(user, limit, skip, req.app.locals.db)
                    .then(({ code, data }) => res.status(code).json(data))
                    .catch(({ code, error }) => res.status(code).json({ error }));
            } else {
                res.status(400).json({ error: "Invalid User." });
            }
        } else {
            res.status(401).json({ error: "Authorization Failed." });
        }
    } else {
        res.status(401).json({ error: "Invalid Access." });
    }
});

app.get("/url/:urlID", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    if (authorization === process.env.AUTHORIZATION) {
        const { urlID } = req.params;
        if (accesstoken) {
            const user = VerifyAndDecodeJWT(accesstoken);
            if (user) {
                urlData(user, urlID, req.app.locals.db)
                    .then(({ code, data }) => res.status(code).json(data))
                    .catch(({ code, error }) => res.status(code).json({ error }));
            } else {
                res.status(401).json({ error: "Authorization Failed." });
            }
        } else {
            res.status(401).json({ error: "Invalid Access." });
        }
    }
});

app.get("/meta", (req, res) => {
    const { authorization, accesstoken } = req.headers;
    const { withoutAuth } = req.query;
    if (authorization === process.env.AUTHORIZATION) {
        if (withoutAuth === "true" || accesstoken) {
            const user = withoutAuth === "true" || VerifyAndDecodeJWT(accesstoken);
            getMeta(withoutAuth, user, req.app.locals.db)
                .then(({ code, data }) => res.status(code).json(data))
                .catch(({ code, error }) => res.status(code).json({ error }));
        } else {
            res.status(401).json({ error: "Authorization Failed." });
        }
    } else {
        res.status(401).json({ error: "Invalid Access." });
    }
});

module.exports = app;
