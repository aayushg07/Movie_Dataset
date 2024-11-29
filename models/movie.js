const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    Movie_ID: { type: Number, required: true },
    Title: { type: String, required: true },
    imdbRating: { type: String },
    Released: { type: String, required: true },
    Year: { type: Number, required: true },
    Genre: { type: String, required: true },
    Language: { type: String},
    Website: { type: String},
    Image: { type: String},  // Optional field for storing image URL
}, {collection: 'movieDB'});

module.exports = mongoose.model('Movie', movieSchema);
