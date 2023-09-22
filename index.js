const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

let movies = [
  {
    title: 'Pulp Fiction',
    description: 'Pulp Fiction is a 1994 American crime film written and directed by Quentin Tarantino from a story he conceived with Roger Avary. It tells four intertwining tales of crime and violence in Los Angeles, California.',
    genre: {
      name: 'Crime',
      description: 'Crime genre is largely classified by a story that is centered around the solving of a crime.'
    },
    director: { 
      name: 'Quentin Tarantino',            
      bio: 'Quentin Tarantino is a renowned filmmaker known for his distinctive style and iconic movies, such as "Pulp Fiction" and "Kill Bill."',
      birthyear: 1963, 
      deathyear: null
    },
    image_url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg',
    featured: false
  },
  {
    title: 'Titanic',
    description: 'Incorporating both historical and fictionalized aspects, it is based on accounts of the sinking of RMS Titanic in 1912. Kate Winslet and Leonardo DiCaprio star as members of different social classes who fall in love during the ship\'s maiden voyage.',
    genre: {
      name: 'Drama',
      description: 'Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.'
    },
    director: { 
      name: 'James Cameron',
      bio: 'James Cameron is a visionary director and filmmaker celebrated for his groundbreaking work on movies like "Avatar" and "Titanic."',
      birthyear: 1954,
      deathyear: null
    },
    image_url: 'https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png',
    featured: false
  },
  {
    title: 'Jurassic Park',
    description: 'Jurassic Park is a 1993 American science fiction-adventure-drama film directed by Steven Spielberg, based upon the novel of the same name, written by Michael Crichton. The story involves scientists visiting a safari amusement park of genetically engineered dinosaurs on an island over one weekend.',
    genre: {
      name: 'Adventure',
      description: 'A common theme of adventure films is of characters leaving their home or place of comfort and going to fulfill a goal, embarking on travels, quests, treasure hunts, heroic journeys; and explorations or searches for the unknown.'
    },
    director: { 
      name: 'Steven Spielberg',            
      bio: 'Steven Spielberg is a prolific filmmaker known for directing classic movies like "E.T. the Extra-Terrestrial" and "Jurassic Park."',
      birthyear: 1946, 
      deathyear: null
    },
    image_url: 'https://static.wikia.nocookie.net/jurassicpark/images/f/fe/Gate_Entrance_%282%29.JPG/revision/latest/scale-to-width-down/1600?cb=20121109061245',
    featured: false
  },
  {
    title: 'Saving Private Ryan',
    description: 'Set in 1944 in France during World War II, it follows a group of soldiers, led by Captain John Miller (Tom Hanks), on their mission to locate Private James Francis Ryan (Matt Damon) and bring him home safely after his three brothers are killed in action.',
    genre: {
      name: 'Drama',
      description: 'Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.'
    },
    director: { 
      name: 'Steven Spielberg',            
      bio: 'Steven Spielberg is a prolific filmmaker known for directing classic movies like "E.T. the Extra-Terrestrial" and "Jurassic Park."',
      birthyear: 1946, 
      deathyear: null
    },
    image_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ac/Saving_Private_Ryan_poster.jpg/220px-Saving_Private_Ryan_poster.jpg',
    featured: false
  },
  {
    title: 'Toy Story 2',
    description: 'When Woody is stolen by a toy collector, Buzz and his friends set out on a rescue mission to save Woody before he becomes a museum toy property with his roundup gang Jessie, Prospector, and Bullseye.',
    genre: {
      name: 'Adventure',
      description: 'A common theme of adventure films is of characters leaving their home or place of comfort and going to fulfill a goal, embarking on travels, quests, treasure hunts, heroic journeys; and explorations or searches for the unknown.'
    },
    director: { 
      name: 'John Lasseter',            
      bio: 'John Lasseter is a pioneering animator and filmmaker who co-founded Pixar Animation Studios and directed beloved films like "Toy Story" and "Cars."',
      birthyear: 1957, 
      deathyear: null
    },
    image_url: 'https://upload.wikimedia.org/wikipedia/en/c/c0/Toy_Story_2.jpg',
    featured: false
  }
];

let users = [
  {
    id: 1,
    name: 'User1',
    email: 'user1@gmail.com',
    favoriteMovies: []
},
{
  id: 2,
  name: 'User2',
  email: 'user2@gmail.com',
  favoriteMovies: ['The Lord of the Rings']
}
];

// Log requests to terminal using morgan's common formatting
app.use(morgan('common'));

// routes requests to 'public' folder
app.use('/', express.static('public'));

// GET requests

// Returns a list of ALL movies
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

// Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title
app.get('/movies/:title', (req, res) => {
  const movie = movies.find((movie) => {
    return movie.title === req.params.title;
  });

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('Movie not found.');
  }
});

// Return data about a genre (description) by genre name
app.get('/movies/genre/:genreName', (req, res) => {
  const genre = movies.find((movie) => {
    return movie.genre.name === req.params.genreName;
  }).genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send('Genre not found.');
  }
});

// Return data about a director (bio, birth year, death year) by name
app.get('/directors/:name', (req, res) => {
  const director = movies.find((movie) => {
    return movie.director.name === req.params.name;
  }).director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('Director not found.')
  }
});

// Allow new users to register
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).send(newUser);
  } else {
    res.status(400).send('Name is missing in the request body.');
  }
});

// Allow users to update their user info (username)
app.put('/users/:id', (req, res) => {
  const updateUser = req.body;

  let user = users.find((user) => {
    // We use == instead of === because user.id is int while req.params.id is string
    return user.id == req.params.id;
  });

  if (user) {
    user.name = updateUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('User not found.')
  }
});

// Allow users to add a movie to their list of favorites 
app.post('/users/:id/:movieTitle', (req, res) => {
  const id = req.params.id;
  const movieTitle = req.params.movieTitle;

  let user = users.find((user) => {
    return user.id == id; 
  });
 
  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}'s list of favorite movies.`);
  } else {
    res.status(400).send('User not found.');
  } 
});

// Allow users to remove a movie from their list of favorites 
app.delete('/users/:id/:movieTitle', (req, res) => {
  const id = req.params.id;
  const movieTitle = req.params.movieTitle;

  let user = users.find((user) => {
    return user.id == id; 
  });
  
  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter((title) => title !== movieTitle);
    res.status(200).send(`${movieTitle} has been removed from user ${id}'s list of favorite movies.`);
  } else {
    res.status(400).send('User not found.');
  } 
});

// Allow existing users to deregister
app.delete('/users/:id', (req, res) => {
  const id = req.params.id;

  let user = users.find((user) => {
    return user.id == id; 
  });
  
  if (user) {
    // We use != instead of !== because user.id is int while id is string
    users = users.filter((user) => user.id != id);
    res.status(200).send(`User ${id}'s email has been removed.`);
  } else {
    res.status(400).send('User not found.');
  } 
});

// Displays the Home page
app.get('/', (req, res) => {
  res.send('Classic Movies of all Time!');
});

// Displays the Documentation page
app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

// Catches errors
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).send({
    message: err.message,
  });
});

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
