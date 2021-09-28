const { MongoClient } = require("mongodb");
const dotEnv = require("dotenv");
dotEnv.config();

const connectToMongoDBServer = (dbname, callback) => {
    const mongoURI = `mongodb+srv://${process.env.MONGO_USER_NAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_NAME}.mongodb.net/<dbname>?retryWrites=true&w=majority`;
    MongoClient.connect(
        mongoURI,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
        (error, client) => {
            if (error) {
                console.log("Error in connecting DB.", error);
                return callback(error, null);
            } else {
                return callback(null, client.db(dbname));
            }
        }
    );
};

module.exports = connectToMongoDBServer;
