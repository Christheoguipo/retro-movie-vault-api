const express = require("express"),
  morgan = require("morgan"),
  // bodyParser = require('body-parser'),
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
// mongoose.connect('mongodb://127.0.0.1:27017/movieVaultDB', { useNewUrlParser: true, useUnifiedTopology: true});


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// not needed for Express v4.16 and higher
// app.use(bodyParser.json());

let allowedOrigins = ["*"];
// let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

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

// Returns a list of ALL movies
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.find()
      .then((movies) => {
        res.json(movies);
      })
      .catch((err) => {
        res.status(500).send("Error: " + err);
      });
  }
);

// Return data about a single movie by title
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

// Return data about a genre (description) by genre name
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

// Return data about a director (bio, birth year, death year) by name
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

// Add/Register a user
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

// Get all users
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

// Get user by username
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

// Update user's info, by username
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

// Allow users to add movies to their favorite
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

// Allow users to remove a movie from their list of favorites
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

// Allow existing users to deregister by their username
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

// Displays the Home page
app.get("/", (req, res) => {
  res.send("Classic Movies of all Time!");
});

// Displays the Documentation page
app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

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
