const express = require("express"),
  morgan = require("morgan"),
  uuid = require("uuid"),
  mongoose = require("mongoose"),
  Models = require("./models.js"),
  Movies = Models.Movie,
  Users = Models.User;

const { check, validationResult } = require("express-validator");

// The actual CONNECTION_URI can be found on Heroku config vars
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// mongoose.connect('mongodb://127.0.0.1:27017/movieVaultDB', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// not needed for Express v4.16 and higher
// app.use(bodyParser.json());

// let allowedOrigins = ["*"];
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com', 'http://localhost:1234'
  , 'http://localhost:4200' // This is to allow the local angular client app
  , 'https://christheoguipo.github.io' // This is to allow the deployed angular client app
  , 'https://retro-movie-vault.netlify.app'];

const cors = require("cors");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      // If a specific origin isn't found on the list of allowed origins
      if (allowedOrigins.indexOf(origin) === -1) {
        let message =
          "The CORS policy for this application doesn't allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

// Log requests to terminal using morgan's common formatting
app.use(morgan("common"));

// routes requests to 'public' folder
app.use("/", express.static("public"));


/**
 * @api {get} /movies Get a list of movies
 * @apiName GetMovies
 * @apiGroup Movies
 * @apiDescription Retrieve a list of movies.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiSuccess {Object[]} movies List of movies.
 * @apiSuccess {String} movies.title Title of the movie.
 * @apiSuccess {String} movies.director Director of the movie.
 * @apiSuccess {Number} movies.year Year of release.
 * @apiSuccess {String} movies.genre Genre of the movie.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "title": "Movie 1",
 *         "director": "Director 1",
 *         "year": 2022,
 *         "genre": "Action"
 *       },
 *       {
 *         "title": "Movie 2",
 *         "director": "Director 2",
 *         "year": 2023,
 *         "genre": "Drama"
 *       },
 *       // ... additional movies
 *     ]
 *
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while fetching movies."
 *     }
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movies.find();
    res.json(movies);
  } catch (err) {
    res.status(500).send('Error: ' + err);
  }
});

/**
 * @api {get} /movies/:Title Get a movie by title
 * @apiName GetMovieByTitle
 * @apiGroup Movies
 * @apiDescription Retrieve a movie by its title.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam {String} Title Title of the movie to retrieve.
 * 
 * @apiSuccess {String} title Title of the movie.
 * @apiSuccess {String} director Director of the movie.
 * @apiSuccess {Number} year Year of release.
 * @apiSuccess {String} genre Genre of the movie.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "title": "Movie 1",
 *       "director": "Director 1",
 *       "year": 2022,
 *       "genre": "Action"
 *     }
 *
 * @apiError (400 Bad Request) {String} error Error message if the movie is not found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "The movie MovieTitle was not found."
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while fetching the movie."
 *     }
 */
app.get(
  "/movies/:Title",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        if (!movie) {
          res
            .status(400)
            .send("The movie " + req.params.Title + " was not found.");
        } else {
          res.json(movie);
        }
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {get} /movies/genre/:GenreName Get movies by genre
 * @apiName GetMoviesByGenre
 * @apiGroup Movies
 * @apiDescription Retrieve movies by their genre.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam {String} GenreName Name of the genre to retrieve movies for.
 * 
 * @apiSuccess {Object} Genre Genre information.
 * @apiSuccess {String} Genre.name Name of the genre.
 * @apiSuccess {String} Genre.description Description of the genre.
 * @apiSuccess {String} Genre.imageUrl URL to an image representing the genre.
 * @apiSuccess {Object[]} Genre.movies List of movies in the specified genre.
 * @apiSuccess {String} Genre.movies.title Title of the movie.
 * @apiSuccess {String} Genre.movies.director Director of the movie.
 * @apiSuccess {Number} Genre.movies.year Year of release.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "Action",
 *       "description": "Movies with high-intensity action sequences.",
 *       "imageUrl": "https://example.com/action.jpg",
 *       "movies": [
 *         {
 *           "title": "Movie 1",
 *           "director": "Director 1",
 *           "year": 2022
 *         },
 *         {
 *           "title": "Movie 2",
 *           "director": "Director 2",
 *           "year": 2023
 *         }
 *         // ... additional movies
 *       ]
 *     }
 *
 * @apiError (400 Bad Request) {String} error Error message if the genre is not found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Genre GenreName was not found."
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while fetching movies by genre."
 *     }
 */
app.get(
  "/movies/genre/:GenreName",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.findOne({ "Genre.Name": req.params.GenreName })
      .then((movieGenre) => {
        if (!movieGenre) {
          res
            .status(400)
            .send("Genre " + req.params.GenreName + " was not found.");
        } else {
          res.json(movieGenre.Genre);
        }
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {get} /directors/:Name Get movies by director
 * @apiName GetMoviesByDirector
 * @apiGroup Directors
 * @apiDescription Retrieve movies directed by a specific director.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam {String} Name Name of the director to retrieve movies for.
 * 
 * @apiSuccess {Object} Director Director information.
 * @apiSuccess {String} Director.name Name of the director.
 * @apiSuccess {String} Director.bio Biography of the director.
 * @apiSuccess {String} Director.imageUrl URL to an image representing the director.
 * @apiSuccess {Object[]} Director.movies List of movies directed by the specified director.
 * @apiSuccess {String} Director.movies.title Title of the movie.
 * @apiSuccess {String} Director.movies.genre Genre of the movie.
 * @apiSuccess {Number} Director.movies.year Year of release.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "Director 1",
 *       "bio": "Renowned director with a successful career.",
 *       "imageUrl": "https://example.com/director1.jpg",
 *       "movies": [
 *         {
 *           "title": "Movie 1",
 *           "genre": "Drama",
 *           "year": 2022
 *         },
 *         {
 *           "title": "Movie 2",
 *           "genre": "Action",
 *           "year": 2023
 *         }
 *         // ... additional movies
 *       ]
 *     }
 *
 * @apiError (400 Bad Request) {String} error Error message if the director is not found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Director Name was not found."
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while fetching movies by director."
 *     }
 */
app.get(
  "/directors/:Name",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.findOne({ "Director.Name": req.params.Name })
      .then((movieDirector) => {
        if (!movieDirector) {
          res
            .status(400)
            .send("Director " + req.params.Name + " was not found.");
        } else {
          res.json(movieDirector.Director);
        }
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {post} /users Create a new user
 * @apiName CreateUser
 * @apiGroup Users
 * @apiDescription Create a new user account.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam (Body) {String} Username User's username (min length: 5, alphanumeric).
 * @apiParam (Body) {String} Password User's password.
 * @apiParam (Body) {String} Email User's email address (must be valid).
 * @apiParam (Body) {Date} Birthday User's date of birth (must be a valid Date).
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "Username": "NewUser",
 *       "Password": "StrongPassword123",
 *       "Email": "newuser@example.com",
 *       "Birthday": "2000-01-01"
 *     }
 * 
 * @apiSuccess (201 Created) {Object} user Created user object.
 * @apiSuccess {String} user.Username Username of the created user.
 * @apiSuccess {String} user.Email Email of the created user.
 * @apiSuccess {Date} user.Birthday Birthday of the created user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "Username": "NewUser",
 *       "Email": "newuser@example.com",
 *       "Birthday": "2000-01-01"
 *     }
 * 
 * @apiError (422 Unprocessable Entity) {Object[]} errors Array of validation errors.
 * @apiErrorExample {json} Validation-Error-Response:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *       "errors": [
 *         {"msg": "Username is too short.", "param": "Username", "location": "body"},
 *         {"msg": "Username contains non alphanumeric characters - not allowed.", "param": "Username", "location": "body"},
 *         {"msg": "Password is required.", "param": "Password", "location": "body"},
 *         {"msg": "Email does not appear to be valid.", "param": "Email", "location": "body"},
 *         {"msg": "Birthday does not appear to be valid Date.", "param": "Birthday", "location": "body"}
 *       ]
 *     }
 *
 * @apiError (400 Bad Request) {String} error Error message if the username already exists.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Username already exists."
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while creating the user."
 *     }
 */
app.post(
  "/users",
  // Validation logic here for request
  [
    check("Username", "Username is too short.").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required.").not().isEmpty(),
    check("Email", "Email does not appear to be valid.").isEmail(),
    check("Birthday", "Birthday does not appear to be valid Date.").isDate(),
  ],
  async (req, res) => {
    // Check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + " already exists.");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * @api {get} /users Get a list of users
 * @apiName GetUsers
 * @apiGroup Users
 * @apiDescription Retrieve a list of users.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiSuccess (200 OK) {Object[]} users List of user objects.
 * @apiSuccess {String} users.Username Username of the user.
 * @apiSuccess {String} users.Email Email of the user.
 * @apiSuccess {Date} users.Birthday Birthday of the user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "Username": "User1",
 *         "Email": "user1@example.com",
 *         "Birthday": "1995-05-15"
 *       },
 *       {
 *         "Username": "User2",
 *         "Email": "user2@example.com",
 *         "Birthday": "1990-12-10"
 *       },
 *       // ... additional users
 *     ]
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while fetching users."
 *     }
 */
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.err(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {get} /users/:Username Get user by username
 * @apiName GetUserByUsername
 * @apiGroup Users
 * @apiDescription Retrieve user information by username.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam {String} Username Username of the user to retrieve.
 * 
 * @apiSuccess (200 OK) {String} Username Username of the user.
 * @apiSuccess {String} Email Email of the user.
 * @apiSuccess {Date} Birthday Birthday of the user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "Username": "User1",
 *       "Email": "user1@example.com",
 *       "Birthday": "1995-05-15"
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while fetching user by username."
 *     }
 */
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.err(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {put} /users/:Username Update user information
 * @apiName UpdateUser
 * @apiGroup Users
 * @apiDescription Update user information by username.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam (Body) {String} Username User's username (min length: 5, alphanumeric).
 * @apiParam (Body) {String} Password User's updated password.
 * @apiParam (Body) {String} Email User's updated email address (must be valid).
 * @apiParam (Body) {Date} Birthday User's updated date of birth (must be a valid Date).
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "Username": "UpdatedUser",
 *       "Password": "UpdatedPassword123",
 *       "Email": "updateduser@example.com",
 *       "Birthday": "2000-02-02"
 *     }
 * 
 * @apiSuccess (200 OK) {Object} user Updated user object.
 * @apiSuccess {String} user.Username Updated username of the user.
 * @apiSuccess {String} user.Email Updated email of the user.
 * @apiSuccess {Date} user.Birthday Updated birthday of the user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "Username": "UpdatedUser",
 *       "Email": "updateduser@example.com",
 *       "Birthday": "2000-02-02"
 *     }
 * 
 * @apiError (400 Bad Request) {String} error Error message if the user is not found or permission is denied.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "User not found."
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while updating the user."
 *     }
 */
app.put(
  "/users/:Username",
  // Validation logic here for request
  [
    check("Username", "Username is too short.").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required.").not().isEmpty(),
    check("Email", "Email does not appear to be valid.").isEmail(),
    check("Birthday", "Birthday does not appear to be valid Date.").isDate(),
  ],
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied.");
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      {
        new: true, // This line makes sure that the updated document is returned
      }
    )
      .then((updatedUser) => {
        if (!updatedUser) {
          res.status(400).send("User not found.");
        } else {
          res.json(updatedUser);
        }
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {post} /users/:Username/movies/:MovieID Add movie to user's favorites
 * @apiName AddMovieToFavorites
 * @apiGroup Users
 * @apiDescription Add a movie to the user's list of favorite movies.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam {String} Username Username of the user.
 * @apiParam {String} MovieID ID of the movie to add to favorites.
 * 
 * @apiSuccess (200 OK) {String} Username Username of the user.
 * @apiSuccess {String} Email Email of the user.
 * @apiSuccess {Date} Birthday Birthday of the user.
 * @apiSuccess {String[]} FavoriteMovies Updated list of favorite movies.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "Username": "User1",
 *       "Email": "user1@example.com",
 *       "Birthday": "1995-05-15",
 *       "FavoriteMovies": ["MovieID1", "MovieID2", "NewMovieID"]
 *     }
 * 
 * @apiError (400 Bad Request) {String} error Error message if the user is not found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "User not found."
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while adding the movie to favorites."
 *     }
 */
app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: {
          FavoriteMovies: req.params.MovieID,
        },
      },
      {
        new: true, // this line when set to "true" returns the updated document
      }
    )
      .then((updatedUser) => {
        if (!updatedUser) {
          res.status(400).send("User not found.");
        } else {
          res.json(updatedUser);
        }
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {delete} /users/:Username/movies/:MovieID Remove movie from user's favorites
 * @apiName RemoveMovieFromFavorites
 * @apiGroup Users
 * @apiDescription Remove a movie from the user's list of favorite movies.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam {String} Username Username of the user.
 * @apiParam {String} MovieID ID of the movie to remove from favorites.
 * 
 * @apiSuccess (200 OK) {String} Username Username of the user.
 * @apiSuccess {String} Email Email of the user.
 * @apiSuccess {Date} Birthday Birthday of the user.
 * @apiSuccess {String[]} FavoriteMovies Updated list of favorite movies.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "Username": "User1",
 *       "Email": "user1@example.com",
 *       "Birthday": "1995-05-15",
 *       "FavoriteMovies": ["MovieID1", "MovieID2"]
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while removing the movie from favorites."
 *     }
 */
app.delete(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: {
          FavoriteMovies: req.params.MovieID,
        },
      },
      {
        new: true, // this line when set to "true" returns the updated document
      }
    )
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {delete} /users/:Username Delete user account
 * @apiName DeleteUser
 * @apiGroup Users
 * @apiDescription Delete a user account by username.
 * 
 * @apiHeader {String} Authorization User's JWT token for authentication (Bearer Token).
 * 
 * @apiParam {String} Username Username of the user to delete.
 * 
 * @apiSuccess (200 OK) {String} message Success message indicating the user was deleted.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "User1 was deleted."
 *     }
 * 
 * @apiError (400 Bad Request) {String} error Error message if the user is not found.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Username was not found."
 *     }
 * 
 * @apiError (500 Internal Server Error) {String} error Error message if the server encounters an issue.
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Internal Server Error: Something went wrong while deleting the user."
 *     }
 *
 */
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found.");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

app.get("/", (req, res) => {
  res.send("Classic Movies of all Time!");
});

const documentationPath = path.join(__dirname, "out");

// Serve the API documentation and its assets
app.use("/documentation", express.static(documentationPath));


// app.get("/documentation", (req, res) => {
//   res.sendFile("out/index.html", { root: __dirname });
// });

// Catches errors
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).send({
    message: err.message,
  });
});

// listen for requests
const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
