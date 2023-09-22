const express = require('express'),
  morgan = require('morgan');

const app = express();

let movies = [
  {
    title: 'Pulp Fiction',
    description: 'Pulp Fiction is a 1994 American crime film written and directed by Quentin Tarantino from a story he conceived with Roger Avary. It tells four intertwining tales of crime and violence in Los Angeles, California.',
    genre: 'Crime',
    director: 'Quentin Tarantino',
    image_url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg'
  },
  {
    title: 'Titanic',
    description: 'Incorporating both historical and fictionalized aspects, it is based on accounts of the sinking of RMS Titanic in 1912. Kate Winslet and Leonardo DiCaprio star as members of different social classes who fall in love during the ship\'s maiden voyage.',
    genre: 'Drama, Romance',
    director: 'James Cameron',
    image_url: 'https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png'
  },
  {
    title: 'Jurassic Park',
    description: 'Jurassic Park is a 1993 American science fiction-adventure-drama film directed by Steven Spielberg, based upon the novel of the same name, written by Michael Crichton. The story involves scientists visiting a safari amusement park of genetically engineered dinosaurs on an island over one weekend.',
    genre: 'Action, Adventure, Sci-Fi, Thriller',
    director: 'Steven Spielberg',
    image_url: 'https://static.wikia.nocookie.net/jurassicpark/images/f/fe/Gate_Entrance_%282%29.JPG/revision/latest/scale-to-width-down/1600?cb=20121109061245'
  },
  {
    title: 'Saving Private Ryan',
    description: 'Set in 1944 in France during World War II, it follows a group of soldiers, led by Captain John Miller (Tom Hanks), on their mission to locate Private James Francis Ryan (Matt Damon) and bring him home safely after his three brothers are killed in action.',
    genre: 'Drama, War',
    director: 'Steven Spielberg',
    image_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ac/Saving_Private_Ryan_poster.jpg/220px-Saving_Private_Ryan_poster.jpg'
  },
  {
    title: 'Toy Story 2',
    description: 'When Woody is stolen by a toy collector, Buzz and his friends set out on a rescue mission to save Woody before he becomes a museum toy property with his roundup gang Jessie, Prospector, and Bullseye.',
    genre: 'Computer-animated, Adventure, Comedy',
    director: 'John Lasseter',
    image_url: 'https://upload.wikimedia.org/wikipedia/en/c/c0/Toy_Story_2.jpg'
  },
  // {
  //   title: 'The Matrix',
  //   director: 'Lana Wachowski'
  // },
  // {
  //   title: 'Fight Club',
  //   director: 'David Fincher'
  // },
  // {
  //   title: 'The Lion King',
  //   director: 'Jon Favreau'
  // },
  // {
  //   title: 'Liar Liar',
  //   director: 'Tom Shadyac'
  // },
  // {
  //   title: 'Apollo 13',
  //   director: 'Ron Howard'
  // }
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
  res.status(200).json(movies.find((movie) => {
    return movie.title === req.params.title
  }));
});

// Return data about a genre (description) by name/title
app.get('/movies/:title/genre', (req, res) => {
  res.send('Successful GET request returning data about the genre of a movie by title.');
});

// Return data about a director (bio, birth year, death year) by name
app.get('/directors/:name', (req, res) => {
  res.send('Successful GET request returning data about a director by name.');
});

// Allow new users to register
app.post('/register', (req, res) => {
  res.send('Successful POST request allowing users to register.');
});

// Allow users to update their user info (username)
app.put('/:username', (req, res) => {
  res.send('Successful PUT request allowing users to update their user info.');
});

// Allow users to add a movie to their list of favorites 
app.post('/:username/favorites', (req, res) => {
  res.send('Successful POST request allowing users to add a movie to their list of favorites.');
});

// Allow users to remove a movie from their list of favorites 
app.delete('/:username/favorites/:title', (req, res) => {
  res.send('Successful DELETE request allowing users to remove a movie from their list of favorites.');
});

// Allow existing users to deregister
app.delete('/:username', (req, res) => {
  res.send('Successful DELETE request allowing existing users to deregister.');
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
