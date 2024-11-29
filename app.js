
/******************************************************************************
***
* ITE5315 – Assignment 4
* I declare that this assignment is my own work in accordance with Humber Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Name: Aayush Gautam Student ID: N01704876 Date: 2024-11-27
*
*
******************************************************************************
**/
const express = require('express'); // Import Express framework
const mongoose = require('mongoose'); // MongoDB object modeling tool
const bodyParser = require('body-parser'); // Middleware to parse incoming request bodies
const path = require('path'); // Module to handle file and directory paths
const exphbs = require('express-handlebars'); // Template engine for rendering views
const database = require('./config/database'); // Database configuration (ensure database.url is set)
const Movie = require('./models/movie'); // Mongoose model for Movie collection
const port = process.env.PORT || 8000;// Define the port, using environment variable or defaulting to 8000

const app = express(); // Initialize the Express application


// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data from form submissions
app.use(bodyParser.json()); // Parse JSON data from incoming requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory
app.set('views',path.join(__dirname,'/views'));



// Handlebars setup
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', exphbs.engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');


// Database connection
mongoose.connect(database.url, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("Database connected successfully"))
.catch(err => console.error("Database connection error:", err));



// Route to display the movie edit form (GET)
app.get('/movies/update/:movieID', async (req, res) => {
	const movieID = req.params.movieID;
    try {
        // Find the movie by its Movie_ID
        const movie = await Movie.findOne({ Movie_ID: movieID });

        if (!movie) {
            return res.status(404).render('error', { message: 'Movie not found for editing', title: 'Error' });
        }
        // Render the update movie form with the movie data
        res.render('update_movie', 
			{ Movie_ID: movie.Movie_ID, 
				title: 'Edit Movie' });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Error fetching movie for edit', title: 'Error' });
    }
});
// Route to handle the update submission (POST)
app.post('/movies/update/:movieID', async (req, res) => {
	const movieID = req.params.movieID;
	console.log("Form submitted with data", req.body);
    try {
        // Update the movie fields based on the form data
        const updatedMovie = await Movie.findOneAndUpdate(
            { Movie_ID: movieID },
            {   Title: req.body.Title,
                imdbRating: req.body.imdbRating,
                Year: req.body.Year,
                Released: req.body.Released,
                Genre: req.body.Genre,
                Director: req.body.Director,
                Language: req.body.Language,
                Awards: req.body.Awards,
                Plot: req.body.Plot,
                Website: req.body.Website
            },
            { new: true }
        );
        if (!updatedMovie) {
            return res.status(404).render('error', { message: 'Movie not found for update', title: 'Error' });
        }

        // Redirect to the updated movie's detail view
        res.redirect(`/movies/${updatedMovie.Movie_ID}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Error updating movie', title: 'Error' });
    }
});

// Route to add a new movie
app.get('/movies/add', (req, res) => { // Displays the "Add a New Movie" form.
    res.render('add_movie', { title: 'Add Movie' });
});

app.post('/movies/add', async (req, res) => {
    try {
        console.log("Form Data:", req.body);
        const { Movie_ID, Title, imdbRating, Year, Released, Genre } = req.body;

        // Create a new movie object using the data from the form
        const newMovie = new Movie({
			Movie_ID: parseInt(Movie_ID, 10),
            Title,
            imdbRating,
            Year: parseInt(Year, 10),
            Released: Released,
            Genre
        });
        await newMovie.save();
        res.redirect('/movies');  // Redirect to the movies list after saving
    } catch (error) {
        console.error('Error adding movie:', error.message);
        res.status(500).send('Error adding movie');  // Handle any errors that occur during saving
    }
});


// Route to delete a movie (GET)
app.get('/movies/delete/:movieID', async (req, res) => {
    try {
        const movieID = req.params.movieID;
        const deletedMovie = await Movie.findOneAndDelete({ Movie_ID: movieID });

        if (!deletedMovie) {
            return res.status(404).render('error', { message: 'Movie not found for deletion', title: 'Error' });
        }

        res.redirect('/movies');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Error deleting movie', title: 'Error' });
    }
});


// Route to handle the  update submission (POST)
app.get('/movies/:movieID', async (req, res) => {
    try {
        const movieID = req.params.movieID;
        const movie = await Movie.findOne({ Movie_ID: movieID }).lean();

        if (!movie) {
            return res.status(404).render('error', { message: 'Movie not found', title: 'Error' });
        }

        res.render('movieDetail', { movie });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Error retrieving movie details', title: 'Error' });
    }
});

//--------------------------------------------------------------------------------------

// Home Route (Optional)
app.get('/', (req, res) => {
    res.render('home', {title: 'Home'});  // A basic home page
});

// Show all movies
app.get('/movies', async (req, res) => {
  
    try {
      const movies = await Movie.find().lean();// Fetch movies and convert to plain JS objects
        // console.log(movies);
        res.render('movies', { title: 'All Movies', movies }); // Render the movies page
    } catch (err) {
        // console.error('Error retrieving movies:', err);
        res.render('error', { title: 'Error', message: 'Error retrieving movies' }); // Render an error page
    }
});


// Route to get all movies
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get movie by movie_id or _id
app.get('/api/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id; // Use 'id' from the route parameter

        // If movieId is a valid ObjectId, query by _id, otherwise query by Movie_ID
        const query = {
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(movieId) ? mongoose.Types.ObjectId(movieId) : null }, // Check if it's a valid ObjectId, if so query by _id
                { Movie_ID: movieId } // Always check for Movie_ID
            ]
        };

        const movie = await Movie.findOne(query);

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Get movie by movie_title
app.get('/api/movies/title/:movie_title', async (req, res) => {
    try {
        const movie = await Movie.findOne({ Title: req.params.movie_title });
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Post a new movie
app.post('/api/movies', async (req, res) => {
    const movie = new Movie({
        Movie_ID: req.body.Movie_ID,
        Title: req.body.Title,
        Released: req.body.Released,
        Year: req.body.Year,
        Genre: req.body.Genre,
        Language: req.body.Language,
        Website: req.body.Website,
        Poster: req.body.Poster  // Optional field
    });

    try {
        const newMovie = await movie.save();  // Save movie to database
        res.status(201).json(newMovie);        // Respond with the new movie details
    } catch (err) {
        res.status(400).json({ message: err.message });  // Error handling
    }
});

// Update a movie by Movie_ID or _id
app.put('/api/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        console.log("Movie ID from URL: ", movieId);

        // Create an object for the update with the provided fields
        const updateFields = {
            Title: req.body.Title,
            Released: req.body.Released,
            Year: req.body.Year,
            Genre: req.body.Genre,
            Language: req.body.Language,
            Website: req.body.Website,
        };

        // Include Image only if provided in the request body
        if (req.body.Image) {
            updateFields.Image = req.body.Image;
        }

        let movie;
        // Check if movieId is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(movieId)) {
            console.log("Attempting to update movie by ObjectId");
            movie = await Movie.findByIdAndUpdate(movieId, updateFields, { new: true });
        } else {
            console.log("Attempting to update movie by Movie_ID");
            // If not an ObjectId, update by Movie_ID
            movie = await Movie.findOneAndUpdate({ Movie_ID: movieId }, updateFields, { new: true });
        }

        // If no movie is found, return a 404
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Return the updated movie
        res.json(movie);
    } catch (err) {
        console.error('Error updating movie:', err);  // More detailed error logging
        res.status(400).json({ message: err.message });
    }
});


// Delete a movie by Movie_ID or _id
app.delete('/api/movies/:movie_id', async (req, res) => {
    try {
        const movieId = req.params.movie_id;  // Corrected to movie_id (lowercase)

        let movie;
        // Check if movieId is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(movieId)) {
            // If movieId is valid, delete by _id
            movie = await Movie.findByIdAndDelete(movieId);
        } else {
            // If not an ObjectId, delete by Movie_ID
            movie = await Movie.findOneAndDelete({ Movie_ID: movieId });
        }

        // If no movie is found, return 404
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
    } catch (err) {
        console.error('Error deleting movie:', err);
        res.status(500).json({ message: err.message });
    }
});


// Start the server

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
