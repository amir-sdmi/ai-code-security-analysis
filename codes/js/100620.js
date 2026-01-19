// created by Copilot edited by dkause

/**
 * The secret key used for JWT authentication.
 * @type {string}
 */
const jwtSecret = 'your_jwt_secret' // This has to be the same key as used in JWTStrategy

const jwt = require('jsonwebtoken'),
  passport = require('passport')

require('./passport') // Your local passport file

/**
 * Generates a JWT token for the given user.
 * The JWT Token expires in seven days.
 * @param {object} user - The user object.
 * @returns {string} - The generated JWT token.
 */
let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // This is the username you will encode in the Json Web Token (JWT)
    expiresIn: '7d', // The JWT expires in seven days
    algorithm: 'HS256' // Uses HS256 algorithm to encode the values of the JWT
  })
}

/* POST login. */
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Something is not right',
          user: user,
          error: error,
          info: info
        })
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error)
        }
        let token = generateJWTToken(user.toJSON())
        return res.json({ user, token })
      })
    })(req, res)
  })
}
