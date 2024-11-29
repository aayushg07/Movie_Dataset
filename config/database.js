module.exports = {
    url: "mongodb://localhost:27017/MovieDB",
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        poolSize: 10 // Adjust connection pool size as necessary
    }
};

