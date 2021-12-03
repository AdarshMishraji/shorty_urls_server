const express = require("express");
const dotEnv = require("dotenv");

const { authenticate } = require("../../controllers");
const { validateAuthToken, validateAccess, fetchUserAgent, trackUserGeoData } = require("../../middlewares");

dotEnv.config();

const app = express.Router();

app.use(validateAccess);
app.use(validateAuthToken);
app.use(trackUserGeoData);
app.use(fetchUserAgent);

app.post("/", (req, res) => {
    authenticate(res.locals.user, res.locals.geo_data, res.locals.user_agent, req.app.locals.db)
        .then(({ code, data }) => {
            res.status(code).json(data);
        })
        .catch(({ code, error, reason = "" }) => res.status(code).json({ error, reason }));
});

exports.authenticate = app;
