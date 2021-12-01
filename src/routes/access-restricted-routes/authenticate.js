const express = require("express");
const dotEnv = require("dotenv");

const { authenticate } = require("../../controllers");
const { validateAuthToken, validateAccess } = require("../../middlewares");

dotEnv.config();

const app = express.Router();

app.use(validateAccess);
app.use(validateAuthToken);

app.post("/", (req, res) => {
    authenticate(res.locals.user, req.app.locals.db)
        .then(({ code, data }) => res.status(code).json(data))
        .catch(({ code, error }) => res.status(code).json({ error }));
});

exports.authenticate = app;
