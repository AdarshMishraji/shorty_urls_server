const express = require("express");
const dotEnv = require("dotenv");

const { verifyAndDecodeJWT } = require("../../helpers");
const { getMeta } = require("../../controllers");
const { validateAccess, trackUserGeoData } = require("../../middlewares");

dotEnv.config();

const app = express.Router();

app.use(validateAccess);
app.use(trackUserGeoData);

app.get("/", (req, res) => {
    const { access_token } = req.headers;
    const { withoutAuth } = req.query;
    if (withoutAuth) {
        if (withoutAuth === "true" || access_token) {
            const response = withoutAuth === "true" || verifyAndDecodeJWT(access_token);
            if (response === "TokenExpiredError") return res.status(401).json({ error: "Unauthorized User.", reason: "Token Expired." });
            getMeta(withoutAuth, res.locals.geo_data, response, req.app.locals.db)
                .then(({ code, data }) => res.status(code).json(data))
                .catch(({ code, error, reason = "" }) => res.status(code).json({ error, reason }));
        } else {
            return res.status(401).json({ error: "Invalid Access.", reason: "Access Token Missing." });
        }
    } else return res.status(422).json({ error: "Unprocessable Request.", reason: "Required Parameters are missing." });
});

exports.meta = app;
