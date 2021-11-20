const { MongoClient } = require("mongodb");
const dotEnv = require("dotenv");
dotEnv.config();

exports.MongoDB = class MongoDB {
    connect = (callback) => {
        const mongoURI = `mongodb+srv://${process.env.MONGO_USER_NAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_NAME}.mongodb.net/<dbname>?retryWrites=true&w=majority`;
        MongoClient.connect(
            mongoURI,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            },
            (error, client) => {
                if (client) {
                    this.db = client.db("shorty_urls");
                    return callback(null, this.db);
                }
                if (error) {
                    return callback(error, null);
                }
            }
        );
    };
};
