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
const AccountHandler = require('./accounthandler');

class AdminHandler extends AccountHandler {
  constructor(userID, username, salt, hashedPassword, userType, isPrivate) {
    super(userID, username, salt, hashedPassword, userType, isPrivate);
    this.isPrivate = 'private';
  }

  // Method to get all users
  async getAllUsers() {
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM users';
      const result = await client.query(queryText);
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Method to get a user
  async getUser(userID) {
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM users WHERE userID = $1';
      const values = [userID];
      const result = await client.query(queryText, values);
      client.release();
      return result.rows[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Method to delete a user
  async deleteUser(userID) {
    /*
      * delete a user from the database
      * param: userID - the ID of the user to be deleted
    */
    try {
      const client = await pool.connect();
      const queryText = 'DELETE FROM users WHERE userID = $1';
      const values = [userID];
      await client.query(queryText, values);
      client.release();
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }

  // Method to get all posts
  async getAllPosts() {
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM posts';
      const result = await client.query(queryText);
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error getting all posts:', error);
      return [];
    }
  }

  // Method to delete a post
  async deletePost(postID) {
    try {
      const client = await pool.connect();
      const queryText = 'DELETE FROM posts WHERE postid = $1';
      const values = [postID];
      await client.query(queryText, values);
      client.release();
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  // Method to delete a comment
  async deleteComment(commentID) {
    try {
      const client = await pool.connect();
      const queryText = 'DELETE FROM comments WHERE comment_id = $1';
      const values = [commentID];
      await client.query(queryText, values);
      client.release();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Method to get all messages
  async getAllMessages() {
    /*
      * get all messages from the database
      * This function is only for testing purposes
      * We should not expose all messages to the admin in a real application
    */
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM messages';
      const result = await client.query(queryText);
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error getting all messages:', error);
      return [];
    }
  }

  async getAllLikes() {
    /*
      * get all likes from the database
      * This function is only for testing purposes
      * We should not expose all likes to the admin in a real application
    */
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM likes';
      const result = await client.query(queryText);
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error getting all likes:', error);
      return [];
    }
  }

  async getAllComments() {
    /*
      * get all comments from the database
      * This function is only for testing purposes
      * We should not expose all comments to the admin in a real application
    */
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM comments';
      const result = await client.query(queryText);
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error getting all comments:', error);
      return [];
    }
  }

}

module.exports = AdminHandler;