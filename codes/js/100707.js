// created by Copilot edited by dkause

/**
 * Callback function for the error message.
 *
 * @param {Error} error - The error message.
 * @param {boolean} result - The result of the callback.
 * @returns {function} The callback function.
 */
return callback(new Error(message), false)
// ...
return callback(null, true)

/**
 * Import login from auth.js
 * @type {function}
 */
let auth = require('./auth.js')(app)

/**
 * Passport module for authentication.
 * @type {object}
 */
const passport = require('passport')

/**
 * Passport configuration.
 */
require('./passport.js')

/**
 * Root route that sends a 'hello world' message.
 * To spin up the free on render where the api is hosted.
 * Use: https://movie-api-5rhq.onrender.com/
 * Until the server responds no images are shown.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
app.get('/', (req, res) => {
  res.send('hello world')
})

/**
 * Route that gets a list of all movies.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find()
  }
)
