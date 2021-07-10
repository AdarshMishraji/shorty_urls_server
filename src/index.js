const path = require("path");
const { MongoClient } = require("mongodb");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const dotEnv = require("dotenv");

dotEnv.config();
const port = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public/")));

// mongodb configured.
const mongoURI = `mongodb+srv://${process.env.MONGO_USER_NAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_NAME}.mongodb.net/<dbname>?retryWrites=true&w=majority`;
const client = new MongoClient(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect();

const collection = (client) =>
  client.db("shorty_urls").collection("shorten_urls");

app.post("/generate_short_url", (req, res) => {
  const { authorization } = req.headers;
  if (authorization === process.env.AUTHORIZATION) {
    const { url } = req.body;
    const newEndpoint = crypto.randomBytes(4).toString("hex");
    if (url) {
      collection(client)
        .findOne({ url })
        .then((value) => {
          if (value) {
            console.log("URL already exists.");
            res.status(409).json({
              short_url: value.short_url,
              error: "URL already exists.",
            });
            return;
          } else {
            collection(client)
              .insertOne({
                url,
                short_url: newEndpoint,
                num_of_visits: 0,
                created_at: Date.now(),
              })
              .then((value) => {
                console.log("Inserted one url." + JSON.stringify(value.result));
                res.status(200).json({ short_url: newEndpoint });
              })
              .catch((e) => {
                console.log("Error while inserting url.", JSON.stringify(e));
                res.status(500).json({ error: "Internal Error." });
              });
            return;
          }
        });
    } else {
      res.status(422).json({ error: "Not accepted empty url." });
    }
  } else {
    res.status(422).json({ error: "Authorization Failed." });
  }
});

app.get("/history", (req, res) => {
  const { authorization } = req.headers;
  if (authorization === process.env.AUTHORIZATION) {
    collection(client)
      .find({})
      .toArray()
      .then((value) => {
        res.status(200).json({
          history: value,
        });
      })
      .catch((e) => {
        console.log("Error while fetching history", e);
        res.send(500).json({ error: "Error while fetching history" });
      });
  } else {
    res.status(422).json({ error: "Authorization Failed." });
  }
});

app.get("/history/:limit", (req, res) => {
  const { authorization } = req.headers;
  if (authorization === process.env.AUTHORIZATION) {
    const { limit } = req.params;
    console.log(limit);
    collection(client)
      .find({})
      .limit(parseInt(limit))
      .toArray()
      .then((value) => {
        res.status(200).json({
          history: value,
        });
      })
      .catch((e) => {
        console.log("Error while fetching history", e);
        res.send(500).json({ error: "Error while fetching history" });
      });
  } else {
    res.status(422).json({ error: "Authorization Failed." });
  }
});

app.get("/:url", (req, res) => {
  const { url } = req.params;
  console.log(url);
  collection(client)
    .findOne({ short_url: url })
    .then((value) => {
      if (value) {
        console.log("URL found.", value);
        collection(client).updateOne(
          { short_url: url },
          { $inc: { num_of_visits: 1 } }
        );
        res.status(200).redirect(`${value.url}`);
        return;
      } else {
        console.log("No url found.");
        res.status(404).sendFile(path.join(__dirname, "../public/404.html"));
        return;
      }
    })
    .catch((e) => {
      console.log("Error while fetching url.", JSON.stringify(e));
      res
        .status(500)
        .sendFile(path.join(__dirname, "../public/InternalError.html"));
    });
});

app.all("*", (req, res) => {
  console.log("User bhand ho gya hai.");
  res.status(404).sendFile(path.join(__dirname, "../public/404.html"));
});

app.listen(port, () => {
  console.log("Server running at port : " + port);
});
