const express = require("express");
const dotEnv = require("dotenv");

const { generateShortURL, changeAlias, deleteURL, updateURLStatus, setExpirationTime, updatePassword, removePassword } = require("../../controllers");
const { validateAccess, validateUser } = require("../../middlewares");

dotEnv.config();

const app = express.Router();

app.use(validateAccess);
app.use(validateUser);

app.post("/generate_short_url", (req, res) => {
    const { url } = req.body;
    if (url.includes(process.env.OWN_URL_DEFAULT)) {
        return res.status(405).json({ error: "It's already shortened." });
    } else {
        if (url) {
            generateShortURL(res.locals.user, url, req.app.locals.db)
                .then(({ code, data }) => res.status(code).json(data))
                .catch(({ code, error }) => res.status(code).json({ error }));
        } else {
            return res.status(422).json({ error: "Not accepted empty url." });
        }
    }
});

app.patch("/change_alias", (req, res) => {
    const { urlID, alias } = req.body;
    if (urlID && alias) {
        changeAlias(res.locals.user, urlID, alias, req.app.locals.db)
            .then(({ code, message }) => res.status(code).json({ message }))
            .catch(({ code, error }) => res.status(code).json({ error }));
    } else {
        return res.status(422).json({ error: "Invalid Data." });
    }
});

app.delete("/delete_url", async (req, res) => {
    const { urlID } = req.body;
    if (urlID) {
        deleteURL(res.locals.user, urlID, req.app.locals.db)
            .then(({ code, message }) => res.status(code).json({ message }))
            .catch(({ code, error }) => res.status(code).json({ error }));
    } else {
        return res.status(422).json({ error: "Invalid Data." });
    }
});

app.patch("/update_url_status", (req, res) => {
    const { urlID, status } = req.body;
    if (urlID) {
        updateURLStatus(res.locals.user, urlID, status, req.app.locals.db)
            .then(({ code, message }) => res.status(code).json({ message }))
            .catch(({ code, error }) => res.status(code).json({ error }));
    } else {
        return res.status(422).json({ error: "Invalid Data." });
    }
});

app.patch("/set_expiration_time", (req, res) => {
    const { urlID, expired_at } = req.body;
    if (urlID) {
        setExpirationTime(res.locals.user, urlID, expired_at, req.app.locals.db)
            .then(({ code, message }) => res.status(code).json({ message }))
            .catch(({ code, error }) => res.status(code).json({ error }));
    } else {
        return res.status(422).json({ error: "Invalid Data." });
    }
});

app.patch("/update_password", (req, res) => {
    const { urlID, password } = req.body;
    if (urlID && password) {
        updatePassword(res.locals.user, urlID, password, req.app.locals.db)
            .then(({ code, message }) => res.status(code).json({ message }))
            .catch(({ code, error }) => res.status(code).json({ error }));
    } else {
        return res.status(422).json({ error: "Invalid Data." });
    }
});

app.delete("/remove_password", (req, res) => {
    const { urlID } = req.body;
    if (urlID) {
        removePassword(res.locals.user, urlID, req.app.locals.db)
            .then(({ code, message }) => res.status(code).json({ message }))
            .catch(({ code, error }) => res.status(code).json({ error }));
    } else {
        return res.status(422).json({ error: "Invalid Data." });
    }
});

exports.manageShortURL = app;
