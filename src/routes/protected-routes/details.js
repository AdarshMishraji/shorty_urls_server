const express = require("express");
const dotEnv = require("dotenv");

const { validateAccess, validateUser } = require("../../middlewares");

dotEnv.config();

const app = express.Router();

app.use(validateAccess);
app.use(validateUser);

app.get("/details", (req, res) => {
    myDetails(res.locals.user, req.app.locals.db)
        .then(({ code, data }) => res.status(code).json(data))
        .catch(({ code, error }) => res.status(code).json({ error }));
});

exports.details = app;
