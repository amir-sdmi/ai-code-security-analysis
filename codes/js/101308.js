/*
 * Group members:
 * Tam King Man 1155160072
 * Tsang Ho Yin 1155159307
 * Ng Yuk Fung 1155176966
 * Leung Ka Lun 1155157403
 * O Ching Lam 1155159131
 */

// The fllowing codes are assisted by Copilot

const pool = require('./database');
const { generateSalt, hashPassword } = require('./utils');

class AccountHandler {
    constructor(userID, username, salt, hashedPassword, userType, isPrivate) {
      // Initialize any necessary properties or connections
      this.userID = userID;
      this.username = username;
      this.salt = salt;
      this.hashedPassword = hashedPassword;
      this.userType = userType;
      this.isPrivate = isPrivate;
    }

    async createUser(username, password, securityAnswer = '123', role = 'user') {
      try {
        const client = await pool.connect();
    
        // Check the uniqueness of the username
        // Find if the given username is already in the database
        const queryText = 'SELECT userID FROM users WHERE username = $1';
        const values = [username];
        const result = await client.query(queryText, values);
    
        // if the username is already taken, return an error
        if (result.rows.length > 0) {
          console.log(result.rows)
          client.release();
          return { success: false, message: 'Username already taken' };
        }
    
        // Generate salt and hashed password
        const salt = generateSalt();
        const hashedPassword = hashPassword(password, salt);
    
        // Insert new user into the database
        const queryText2 = 'INSERT INTO users (username, password, salt, secureqAns, privacy, usertype) VALUES ($1, $2, $3, $4, $5, $6)';
        const values2 = [username, hashedPassword, salt, securityAnswer, 'public', role];
        await client.query(queryText2, values2);

        // assign the user ID to the object
        const queryText3 = 'SELECT userID FROM users WHERE username = $1';
        const values3 = [username];
        const result3 = await client.query(queryText3, values3);
        this.userID = result3.rows[0].userid;

        client.release();
        return { success: true, message: 'User created successfully' };
    
      } catch (error) {
        console.error('Error creating a user:', error);
        return { success: false, message: 'Failed to create user' };
      }
    }

    async authenticateAccount(username, account_input_password) {
      /*
        * Authenticate the account with the given username and password
        * param {string} username - The username of the account
        * param {string} password - The password of the account
      */
      try {
          const client = await pool.connect();
  
          // Check if the username exists in the users table
          const userQueryText = 'SELECT userID FROM users WHERE username = $1';
          const userValues = [username];
          const userResult = await client.query(userQueryText, userValues);
  
          // If the username does not exist, return failure message
          if (userResult.rows.length === 0) {
              client.release();
              return { success: false, message: 'Account not found' };
          }

          // Get the userID, salt and hashed password of the user
          const queryText = 'SELECT userid, salt, password, usertype FROM users WHERE username = $1';
          const values = [username];
          const result = await client.query(queryText, values);
          this.userID = result.rows[0].userid;
          this.salt = result.rows[0].salt;
          this.hashedPassword = result.rows[0].password;
          this.role = result.rows[0].usertype;
  
          // Check if the password is correct
          const account_input_hashedPassword = hashPassword(account_input_password, this.salt);
          client.release();
          if (account_input_hashedPassword === this.hashedPassword) {
              // Return authentication successful message along with account type
              return { success: true, message: 'Authentication successful', userID: this.userID, usertype: this.role};
          } else {
              return { success: false, message: 'Incorrect password' };
          }
      } catch (error) {
          console.error('Error authenticating account:', error);
          return { success: false, message: 'Failed to authenticate account' };
      }
    }

  }
  
  module.exports = AccountHandler;