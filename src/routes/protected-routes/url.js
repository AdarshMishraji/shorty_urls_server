const express = require("express");
const dotEnv = require("dotenv");

const { getURLs, urlData } = require("../../controllers");
const { validateAccess, validateUser } = require("../../middlewares");

dotEnv.config();

const app = express.Router();

app.use(validateAccess);
app.use(validateUser);

app.get("/urls", (req, res) => {
    const { limit, skip, query } = req.query;
    getURLs(res.locals.user, limit, skip, query, req.app.locals.db)
        .then(({ code, data }) => res.status(code).json(data))
        .catch(({ code, error }) => res.status(code).json({ error }));
});

app.get("/url/:urlID", (req, res) => {
    const { urlID } = req.params;
    urlData(res.locals.user, urlID, req.app.locals.db)
        .then(({ code, data }) => res.status(code).json(data))
        .catch(({ code, error }) => {
            res.status(code).json({ error });
        });
});

exports.url = app;
