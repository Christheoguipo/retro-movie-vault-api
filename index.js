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
// mongoose.connect("mongodb://127.0.0.1:27017/movieVaultDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// not needed for Express v4.16 and higher
// app.use(bodyParser.json());

// let allowedOrigins = ["*"];
let allowedOrigins = [
  "http://localhost:8080",
  "http://testsite.com",
  "http://localhost:1234",
  "http://localhost:4200", // This is to allow the local angular client app
  "https://christheoguipo.github.io", // This is to allow the deployed angular client app
  "https://retro-movie-vault.netlify.app",
];

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
 * @api {get} /movies Get All Movies
 * @apiName GetMovies
 * @apiGroup Movies
 * @apiVersion 1.0.0
 * @apiDescription Retrieves a list of all movies.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {Object[]} movies List of movie objects.
 * @apiSuccess {Object} movies.Genre Genre information for the movie.
 * @apiSuccess {String} movies.Genre.Name Name of the genre.
 * @apiSuccess {String} movies.Genre.Description Description of the genre.
 * @apiSuccess {Object} movies.Director Director information for the movie.
 * @apiSuccess {String} movies.Director.Name Name of the director.
 * @apiSuccess {String} movies.Director.Bio Biography of the director.
 * @apiSuccess {String} movies.Director.Birthyear Birth year of the director.
 * @apiSuccess {String} movies.Director.Deathyear Death year of the director (null if alive).
 * @apiSuccess {Object[]} movies.Actors List of actors in the movie (empty array if none).
 * @apiSuccess {String} movies._id Unique identifier for the movie.
 * @apiSuccess {String} movies.Title Title of the movie.
 * @apiSuccess {String} movies.Description Description of the movie.
 * @apiSuccess {String} movies.Imageurl URL of the movie's image.
 * @apiSuccess {Boolean} movies.Featured Indicates if the movie is featured or not.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *         {
 *             "Genre": {
 *                 "Name": "Animated",
 *                 "Description": "Animation is a method in which pictures are manipulated to appear as moving images. In traditional animation, images are drawn or painted by hand on transparent celluloid sheets to be photographed and exhibited on film."
 *             },
 *             "Director": {
 *                 "Name": "John Lasseter",
 *                 "Bio": "John Lasseter is a pioneering animator and filmmaker who co-founded Pixar Animation Studios and directed beloved films like \"Toy Story\" and \"Cars.\"",
 *                 "Birthyear": "1957-01-12",
 *                 "Deathyear": null
 *             },
 *             "Actors": [],
 *             "_id": "6512195699eb8a7d7fdf59cb",
 *             "Title": "Toy Story 2",
 *             "Description": "When Woody is stolen by a toy collector, Buzz and his friends set out on a rescue mission to save Woody before he becomes a museum toy property with his roundup gang Jessie, Prospector, and Bullseye.",
 *             "Imageurl": "https://wallpaperaccess.com/full/1706600.jpg",
 *             "Featured": false
 *         },
 *         // Additional movie objects...
 *     ]
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
 *     }
 */
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const movies = await Movies.find();
      res.json(movies);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

/**
 * @api {get} /movies/:Title Get Movie by Title
 * @apiName GetMovieByTitle
 * @apiGroup Movies
 * @apiVersion 1.0.0
 * @apiDescription Retrieves a specific movie by its title.
 *
 * @apiParam {String} Title Title of the movie to be retrieved.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {Object} movie Movie object.
 * @apiSuccess {Object} movie.Genre Genre information for the movie.
 * @apiSuccess {String} movie.Genre.Name Name of the genre.
 * @apiSuccess {String} movie.Genre.Description Description of the genre.
 * @apiSuccess {Object} movie.Director Director information for the movie.
 * @apiSuccess {String} movie.Director.Name Name of the director.
 * @apiSuccess {String} movie.Director.Bio Biography of the director.
 * @apiSuccess {String} movie.Director.Birthyear Birth year of the director.
 * @apiSuccess {String} movie.Director.Deathyear Death year of the director (null if alive).
 * @apiSuccess {Object[]} movie.Actors List of actors in the movie (empty array if none).
 * @apiSuccess {String} movie._id Unique identifier for the movie.
 * @apiSuccess {String} movie.Title Title of the movie.
 * @apiSuccess {String} movie.Description Description of the movie.
 * @apiSuccess {String} movie.Imageurl URL of the movie's image.
 * @apiSuccess {Boolean} movie.Featured Indicates if the movie is featured or not.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "Genre": {
 *             "Name": "Drama",
 *             "Description": "Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters."
 *         },
 *         "Director": {
 *             "Name": "James Cameron",
 *             "Bio": "James Cameron is a visionary director and filmmaker celebrated for his groundbreaking work on movies like \"Avatar\" and \"Titanic.\"",
 *             "Birthyear": "1954-08-16",
 *             "Deathyear": null
 *         },
 *         "Actors": [],
 *         "_id": "651218a699eb8a7d7fdf59c9",
 *         "Title": "Titanic",
 *         "Description": "Incorporating both historical and fictionalized aspects, it is based on accounts of the sinking of RMS Titanic in 1912. Kate Winslet and Leonardo DiCaprio star as members of different social classes who fall in love during the ship's maiden voyage.",
 *         "Imageurl": "https://wallpapercave.com/wp/UbJdgza.jpg",
 *         "Featured": false
 *     }
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (400 Bad Request) {String} error The movie {Title} was not found.
 * @apiErrorExample {json} MovieNotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
 *         "error": "The movie {Title} was not found."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
 * @api {get} /movies/genre/:GenreName Get Movie Genre by Name
 * @apiName GetMovieGenreByName
 * @apiGroup Movies
 * @apiVersion 1.0.0
 * @apiDescription Retrieves the genre information for movies with a specific genre name.
 *
 * @apiParam {String} GenreName Name of the genre to be retrieved.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {Object} genre Genre object.
 * @apiSuccess {String} genre.Name Name of the genre.
 * @apiSuccess {String} genre.Description Description of the genre.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "Name": "Drama",
 *         "Description": "Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters."
 *     }
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (400 Bad Request) {String} error Genre {GenreName} was not found.
 * @apiErrorExample {json} GenreNotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
 *         "error": "Genre {GenreName} was not found."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
 * @api {get} /directors/:Name Get Director by Name
 * @apiName GetDirectorByName
 * @apiGroup Directors
 * @apiVersion 1.0.0
 * @apiDescription Retrieves information for a director by their name.
 *
 * @apiParam {String} Name Name of the director to be retrieved.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {Object} director Director object.
 * @apiSuccess {String} director.Name Name of the director.
 * @apiSuccess {String} director.Bio Biography of the director.
 * @apiSuccess {String} director.Birthyear Birth year of the director.
 * @apiSuccess {String} director.Deathyear Death year of the director (null if alive).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "Name": "Steven Spielberg",
 *         "Bio": "Steven Spielberg is a prolific filmmaker known for directing classic movies like \"E.T. the Extra-Terrestrial\" and \"Jurassic Park.\"",
 *         "Birthyear": "1946-12-18",
 *         "Deathyear": null
 *     }
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (400 Bad Request) {String} error Director {Name} was not found.
 * @apiErrorExample {json} DirectorNotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
 *         "error": "Director {Name} was not found."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
 * @api {post} /users Create User
 * @apiName CreateUser
 * @apiGroup Users
 * @apiVersion 1.0.0
 * @apiDescription Creates a new user with the provided information.
 *
 * @apiParam {String} Username User's username (min length: 5, alphanumeric).
 * @apiParam {String} Password User's password (non-empty).
 * @apiParam {String} Email User's email (valid email format).
 * @apiParam {Date} Birthday User's birthday (valid date format).
 *
 * @apiHeader {String} Content-Type="application/json" Request content type.
 *
 * @apiSuccess {String} Username Username of the created user.
 * @apiSuccess {String} Password Hashed password of the created user.
 * @apiSuccess {String} Email Email of the created user.
 * @apiSuccess {Date} Birthday Birthday of the created user.
 * @apiSuccess {Array} FavoriteMovies Empty array for favorite movies (initially).
 * @apiSuccess {String} _id Unique identifier for the created user.
 * @apiSuccess {Number} __v Version of the document (MongoDB internal versioning).
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *         "Username": "user9",
 *         "Password": "user9",
 *         "Email": "user9@gmail.com",
 *         "Birthday": "2000-01-01"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *         "Username": "user9",
 *         "Password": "$2b$10$WM0XGiZhTwSG6IA3oz.H0ul0vD2p23.Yy8UxUmaQdPc7u4Vz7DoKK",
 *         "Email": "user9@gmail.com",
 *         "Birthday": "2000-01-01T00:00:00.000Z",
 *         "FavoriteMovies": [],
 *         "_id": "65776a91bac585852a17a95c",
 *         "__v": 0
 *     }
 *
 * @apiError (400 Bad Request) {String} error {Username} already exists.
 * @apiErrorExample {json} UsernameExists:
 *     HTTP/1.1 400 Bad Request
 *     {
 *         "error": "user9 already exists."
 *     }
 *
 * @apiError (422 Unprocessable Entity) {Object[]} errors Array of validation errors.
 * @apiErrorExample {json} ValidationErrors:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *         "errors": [
 *             {
 *                 "msg": "Username is too short.",
 *                 "param": "Username",
 *                 "location": "body"
 *             },
 *             {
 *                 "msg": "Username contains non alphanumeric characters - not allowed.",
 *                 "param": "Username",
 *                 "location": "body"
 *             },
 *             {
 *                 "msg": "Password is required.",
 *                 "param": "Password",
 *                 "location": "body"
 *             },
 *             {
 *                 "msg": "Email does not appear to be valid.",
 *                 "param": "Email",
 *                 "location": "body"
 *             },
 *             {
 *                 "msg": "Birthday does not appear to be valid Date.",
 *                 "param": "Birthday",
 *                 "location": "body"
 *             }
 *         ]
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * @api {get} /users Get All Users
 * @apiName GetAllUsers
 * @apiGroup Users
 * @apiVersion 1.0.0
 * @apiDescription Retrieves a list of all users.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {Object[]} users List of user objects.
 * @apiSuccess {String} users._id Unique identifier for the user.
 * @apiSuccess {String} users.Username Username of the user.
 * @apiSuccess {String} users.Password Hashed password of the user.
 * @apiSuccess {String} users.Email Email of the user.
 * @apiSuccess {Date} users.Birthday Birthday of the user.
 * @apiSuccess {Array} users.FavoriteMovies Array of favorite movie IDs for the user (empty array initially).
 * @apiSuccess {Number} users.__v Version of the document (MongoDB internal versioning).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *         {
 *             "_id": "651c616a22d1f1825c83da0b",
 *             "Username": "User2",
 *             "Password": "$2b$10$/ACgE3IPKbSXDMGbFcW31uEMGqCxJ6Ykd1BHwtfn5Oo4FZRXH/9me",
 *             "Email": "User2NewEmail@gmail.com",
 *             "Birthday": "2000-01-01T00:00:00.000Z",
 *             "FavoriteMovies": [],
 *             "__v": 0
 *         },
 *         // Additional user objects...
 *     ]
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {get} /users/:Username Get User by Username
 * @apiName GetUserByUsername
 * @apiGroup Users
 * @apiVersion 1.0.0
 * @apiDescription Retrieves information for a user by their username.
 *
 * @apiParam {String} Username Username of the user to be retrieved.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {String} _id Unique identifier for the user.
 * @apiSuccess {String} Username Username of the user.
 * @apiSuccess {String} Password Hashed password of the user.
 * @apiSuccess {String} Email Email of the user.
 * @apiSuccess {Date} Birthday Birthday of the user.
 * @apiSuccess {Array} FavoriteMovies Array of favorite movie IDs for the user (empty array initially).
 * @apiSuccess {Number} __v Version of the document (MongoDB internal versioning).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "_id": "65776a91bac585852a17a95c",
 *         "Username": "user9",
 *         "Password": "$2b$10$WM0XGiZhTwSG6IA3oz.H0ul0vD2p23.Yy8UxUmaQdPc7u4Vz7DoKK",
 *         "Email": "user9@gmail.com",
 *         "Birthday": "2000-01-01T00:00:00.000Z",
 *         "FavoriteMovies": [],
 *         "__v": 0
 *     }
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * @api {put} /users/:Username Update User Information
 * @apiName UpdateUser
 * @apiGroup Users
 * @apiVersion 1.0.0
 * @apiDescription Updates information for a user with the provided username.
 *
 * @apiParam {String} Username User's username (min length: 5, alphanumeric).
 * @apiParam {String} Password User's password (non-empty).
 * @apiParam {String} Email User's email (valid email format).
 * @apiParam {Date} Birthday User's birthday (valid date format).
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 * @apiHeader {String} Content-Type="application/json" Request content type.
 *
 * @apiSuccess {String} _id Unique identifier for the user.
 * @apiSuccess {String} Username Updated username of the user.
 * @apiSuccess {String} Password Hashed password of the user.
 * @apiSuccess {String} Email Updated email of the user.
 * @apiSuccess {Date} Birthday Updated birthday of the user.
 * @apiSuccess {Array} FavoriteMovies Updated array of favorite movie IDs for the user.
 * @apiSuccess {Number} __v Version of the document (MongoDB internal versioning).
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *         "Username": "user9",
 *         "Password": "newpassword",
 *         "Email": "new@email.com",
 *         "Birthday": "2005-01-01"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "_id": "65592d088e592ab3286693b8",
 *         "Username": "user9",
 *         "Password": "$2b$10$QyzGqZ1wV66M44NGVyRui.gbCHsvjsW3vD5vaN/0rPykIBLd701Em",
 *         "Email": "new@email.com",
 *         "Birthday": "2005-01-01T00:00:00.000Z",
 *         "FavoriteMovies": [
 *             "651219ba99eb8a7d7fdf59d0",
 *             "651219ba99eb8a7d7fdf59ce",
 *             "6512195699eb8a7d7fdf59cd",
 *             "651218a699eb8a7d7fdf59ca"
 *         ],
 *         "__v": 0
 *     }
 *
 * @apiError (400 Bad Request) {String} error Permission denied.
 * @apiErrorExample {json} PermissionDenied:
 *     HTTP/1.1 400 Bad Request
 *     {
 *         "error": "Permission denied."
 *     }
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
 * @api {post} /users/:Username/movies/:MovieID Add Movie to User's Favorites
 * @apiName AddMovieToUserFavorites
 * @apiGroup Users
 * @apiVersion 1.0.0
 * @apiDescription Adds a movie to the list of favorite movies for a user.
 *
 * @apiParam {String} Username Username of the user.
 * @apiParam {String} MovieID Unique identifier of the movie to be added to favorites.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {String} _id Unique identifier for the user.
 * @apiSuccess {String} Username Username of the user.
 * @apiSuccess {String} Password Hashed password of the user.
 * @apiSuccess {String} Email Email of the user.
 * @apiSuccess {Date} Birthday Birthday of the user.
 * @apiSuccess {Array} FavoriteMovies Updated array of favorite movie IDs for the user.
 * @apiSuccess {Number} __v Version of the document (MongoDB internal versioning).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "_id": "65592d088e592ab3286693b8",
 *         "Username": "user9",
 *         "Password": "$2b$10$QyzGqZ1wV66M44NGVyRui.gbCHsvjsW3vD5vaN/0rPykIBLd701Em",
 *         "Email": "new@email.com",
 *         "Birthday": "2005-01-01T00:00:00.000Z",
 *         "FavoriteMovies": [
 *             "651219ba99eb8a7d7fdf59d0",
 *             "651219ba99eb8a7d7fdf59ce",
 *             "6512195699eb8a7d7fdf59cd",
 *             "651218a699eb8a7d7fdf59ca",
 *             "6512195699eb8a7d7fdf59cb"
 *         ],
 *         "__v": 0
 *     }
 *
 * @apiError (400 Bad Request) {String} error User not found.
 * @apiErrorExample {json} UserNotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
 *         "error": "User not found."
 *     }
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
 * @api {delete} /users/:Username/movies/:MovieID Remove Movie from User's Favorites
 * @apiName RemoveMovieFromUserFavorites
 * @apiGroup Users
 * @apiVersion 1.0.0
 * @apiDescription Removes a movie from the list of favorite movies for a user.
 *
 * @apiParam {String} Username Username of the user.
 * @apiParam {String} MovieID Unique identifier of the movie to be removed from favorites.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {String} _id Unique identifier for the user.
 * @apiSuccess {String} Username Username of the user.
 * @apiSuccess {String} Password Hashed password of the user.
 * @apiSuccess {String} Email Email of the user.
 * @apiSuccess {Date} Birthday Birthday of the user.
 * @apiSuccess {Array} FavoriteMovies Updated array of favorite movie IDs for the user.
 * @apiSuccess {Number} __v Version of the document (MongoDB internal versioning).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "_id": "65592d088e592ab3286693b8",
 *         "Username": "user9",
 *         "Password": "$2b$10$QyzGqZ1wV66M44NGVyRui.gbCHsvjsW3vD5vaN/0rPykIBLd701Em",
 *         "Email": "new@email.com",
 *         "Birthday": "2005-01-01T00:00:00.000Z",
 *         "FavoriteMovies": [
 *             "651219ba99eb8a7d7fdf59d0",
 *             "651219ba99eb8a7d7fdf59ce",
 *             "6512195699eb8a7d7fdf59cd",
 *             "651218a699eb8a7d7fdf59ca"
 *         ],
 *         "__v": 0
 *     }
 *
 * @apiError (400 Bad Request) {String} error User not found.
 * @apiErrorExample {json} UserNotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
 *         "error": "User not found."
 *     }
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
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
 * @api {delete} /users/:Username Delete User
 * @apiName DeleteUser
 * @apiGroup Users
 * @apiVersion 1.0.0
 * @apiDescription Deletes a user with the provided username.
 *
 * @apiParam {String} Username Username of the user to be deleted.
 *
 * @apiHeader {String} Authorization User's JWT token for authentication.
 *
 * @apiSuccess {String} Message Deletion success message.
 *
 * @apiSuccessExample {text} Success-Response:
 *     HTTP/1.1 200 OK
 *     user9 was deleted.
 *
 * @apiError (400 Bad Request) {String} error User not found.
 * @apiErrorExample {json} UserNotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
 *         "error": "user9 was not found."
 *     }
 *
 * @apiError (401 Unauthorized) {String} error Missing or invalid authentication token.
 * @apiErrorExample {json} Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *         "error": "Unauthorized - Missing or invalid authentication token."
 *     }
 *
 * @apiError (500 Internal Server Error) {String} error Something went wrong on the server.
 * @apiErrorExample {json} InternalServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *         "error": "Internal Server Error - Something went wrong on the server."
 *     }
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
        res.status(500).send("Error: " + err);
      });
  }
);

app.get("/home", (req, res) => {
  res.send("Classic Movies of all Time!");
});

app.get("/documentation", (req, res) => {
  res.sendFile("public/index.html", { root: __dirname });
});

// Catches errors
app.use((err, req, res, next) => {

  res.status(500).send({
    message: err.message,
  });
});

// listen for requests
const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
