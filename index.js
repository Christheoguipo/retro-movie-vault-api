const express = require('express'),
  morgan = require('morgan');

const app = express();

let topMovies = [
  {
    title: 'Pulp Fiction',
    director: 'Quentin Tarantino'
  },
  {
    title: 'Titanic',
    director: 'James Cameron'
  },
  {
    title: 'Jurassic Park',
    director: 'Steven Spielberg'
  },
  {
    title: 'Saving Private Ryan',
    director: 'Steven Spielberg'
  },
  {
    title: 'Toy Story 2',
    director: 'John Lasseter'
  },
  {
    title: 'The Matrix',
    director: 'Lana Wachowski'
  },
  {
    title: 'Fight Club',
    director: 'David Fincher'
  },
  {
    title: 'The Lion King',
    director: 'Jon Favreau'
  },
  {
    title: 'Liar Liar',
    director: 'Tom Shadyac'
  },
  {
    title: 'Apollo 13',
    director: 'Ron Howard'
  }
];

// Log requests to terminal using morgan's common formatting
app.use(morgan('common'));

// routes requests to 'public' folder
app.use('/', express.static('public'));

// GET requests
app.get('/', (req, res) => {
  res.send('Come and see my classic Movie Collection!');
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/movies', (req, res) => {
  res.json(topMovies);
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
