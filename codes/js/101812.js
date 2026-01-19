/**
 * @file Defines the AccountController class.
 * @module controllers/AccountController
 * @author Mats Loock & Sabrina Prichard-Lybeck <sp223kz@student.lnu.se>
 * @version 3.1.0
 */

import http from 'node:http'
import sanitizeHtml from 'sanitize-html'
import { logger } from '../../config/winston.js'
import { JsonWebToken } from '../../lib/JsonWebToken.js'
import { UserModel } from '../../models/UserModel.js'
import { LOGIN_CUSTOM_STATUS_CODES, REGISTER_CUSTOM_STATUS_CODES } from '../../utils/customErrors.js'

/**
 * Encapsulates a controller.
 */
export class AccountController {
  /**
   * Authenticates a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async login (req, res, next) {
    try {
      logger.silly('Authenticating user', { body: req.body })

      // Sanitize the input.
      req.body.username = sanitizeHtml(req.body.username)
      req.body.password = sanitizeHtml(req.body.password)

      const userDocument = await UserModel.authenticate(req.body.username, req.body.password)
      const user = userDocument.toObject()

      // Create the access token with the shorter lifespan.
      const accessToken = await JsonWebToken.encodeUser(user,
        process.env.ACCESS_TOKEN_SECRET,
        parseInt(process.env.ACCESS_TOKEN_LIFE)
      )

      // Create the refresh token with the longer lifespan.
      const refreshToken = await JsonWebToken.encodeUser(user,
        process.env.REFRESH_TOKEN_SECRET,
        parseInt(process.env.REFRESH_TOKEN_LIFE)
      )

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid credentials')
      }

      // Determine the storage preference for the refresh token (info to be sent in the header from the client, as suggested by copilot).
      const clientType = req.useragent

      // Set the refresh token in the appropriate storage (local storage is risky since malicious users could in for example an XSS attack gain access to the refresh tokens stored there, therefore it's not recommended from my research on refresh tokens).
      if (clientType.browser === null) {
        // Return the refresh token in the response body.
        // IoT, mobile and desktop native apps etc can store the refresh token in a secure storage and aren't vulnerable to XSS or CSRF attacks in the same way as web clients.
        res
          .status(200)
          .json({
            access_token: accessToken,
            refresh_token: refreshToken
          })
      } else {
        // Store the refresh token in a cookie as a default storage method to be sent in the response and send the access token directly in the response.
        res
          .status(200)
          .cookie('refreshToken', refreshToken, {
            httpOnly: true, // Cookie is not accessible via JS, to prevent XSS attacks.
            secure: process.env.NODE_ENV === 'production', // Only send the cookie over HTTPS in production for added security.
            sameSite: 'Lax'
          })
          .json({
            access_token: accessToken
          })
      }

      logger.silly('Authenticated user', { user })
    } catch (error) {
      // Authentication failed.
      // Status code is defaulted to 500 (Internal Server Error).
      let httpStatusCode = 500

      if (error.message === 'Invalid credentials') {
        httpStatusCode = 401
      }

      const err = new Error(LOGIN_CUSTOM_STATUS_CODES[httpStatusCode] || http.STATUS_CODES[httpStatusCode])
      err.status = httpStatusCode
      err.cause = error

      next(err)
    }
  }

  /**
   * Method for refreshing the access token using the refresh token.
   *
   * @param {*} req - Express request object.
   * @param {*} res - Express response object.
   * @param {*} next - Express next middleware function.
   */
  async loginRefreshToken (req, res, next) {
    try {
      logger.silly('Refreshing access token', { body: req.body })

      // Sanitize the input.
      // The refresh token is sent in the body since it is considered more secure than sending it in the header (since headers can be logged in various places and be more vulnerable for CSRF-attacks, which is extra risky with a long-lived token).
      req.body.refreshToken = sanitizeHtml(req.body.refreshToken)

      // Decode the refresh token.
      const decodedUser = await JsonWebToken.decodeUser(req.body.refreshToken, process.env.REFRESH_TOKEN_PUBLIC_KEY)

      if (!decodedUser) {
        throw new Error('Invalid refresh token')
      }

      // Create the new access token.
      const accessToken = await JsonWebToken.encodeUser(decodedUser,
        process.env.ACCESS_TOKEN_SECRET,
        parseInt(process.env.ACCESS_TOKEN_LIFE)
      )

      // Send the new access token in the response.
      res
        .status(200)
        .json({
          access_token: accessToken
        })

      logger.silly('Refreshed access token')
    } catch (error) {
      // Refresh token failed.
      // Status code is defaulted to 500 (Internal Server Error).
      let httpStatusCode = 500

      if (error.message === 'Invalid refresh token') {
        httpStatusCode = 401
      }

      const err = new Error(LOGIN_CUSTOM_STATUS_CODES[httpStatusCode] || http.STATUS_CODES[httpStatusCode])
      err.status = httpStatusCode
      err.cause = error

      next(err)
    }
  }

  /**
   * Registers a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async register (req, res, next) {
    try {
      logger.silly('Creating new user document', { body: req.body })

      // Sanitize the input.
      req.body.username = sanitizeHtml(req.body.username)
      req.body.password = sanitizeHtml(req.body.password)
      req.body.firstName = sanitizeHtml(req.body.firstName)
      req.body.lastName = sanitizeHtml(req.body.lastName)
      req.body.email = sanitizeHtml(req.body.email)

      const { username, password, firstName, lastName, email } = req.body

      const userDocument = await UserModel.create({
        username,
        password,
        firstName,
        lastName,
        email,
        permissionLevel: 15
      })

      logger.silly('Created new user document')

      const location = new URL(
        `${req.protocol}://${req.get('host')}${req.baseUrl}/${userDocument.id}`
      )

      res
        .location(location.href)
        .status(201)
        .json({ id: userDocument.id })
    } catch (error) {
      logger.error('Failed to create new user document', { error })

      let httpStatusCode = 500

      if (error.code === 11000) {
        // Duplicated keys, which means that the user already exists.
        httpStatusCode = 409
      } else if (error.name === 'ValidationError') {
        // Validation error(s).
        httpStatusCode = 400
      }

      const err = new Error(REGISTER_CUSTOM_STATUS_CODES[httpStatusCode] || http.STATUS_CODES[httpStatusCode])
      err.status = httpStatusCode
      err.cause = error

      next(err)
    }
  }
}
