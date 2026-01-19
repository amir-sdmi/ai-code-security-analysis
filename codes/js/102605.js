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
const AccountHandler = require('./accounthandler');
const { user } = require('pg/lib/defaults');

class UserHandler extends AccountHandler {
  constructor(userID, username, salt, hashedPassword, userType, pendingFollowers, securityAnswer, description, isPrivate, isActive) {
    super(userID, username, salt, hashedPassword, userType);
    this.pendingFollowers = pendingFollowers;
    this.securityAnswer = securityAnswer;
    this.description = description;
    this.isPrivate = isPrivate;
    this.isActive = isActive;
  }

  // Method to get username by userID
  async getUsername(userID) {
    /*
      * Retrieve username from the database
      * @param {string} userID - The ID of the user to retrieve username
    */
    try {
      const client = await pool.connect();
      const queryText = 'SELECT username FROM users WHERE userID = $1';
      const values = [userID];
      const result = await client.query(queryText, values);
      client.release();
      return {success: true, message: "Retrieved username successfully", username: result.rows[0].username};

    } catch (error) {
      console.error('Error getting username:', error);
      return {success: false, message: "Error getting username", username: null};
    }
  }

  // Method to edit user own profile
  async editProfile(content) {
    /*
      * Edit user profile in the database
      * @param {list} content - The list of new content to be updated, ["username", "description", "privacy"]
    */
    try {
        // Update user profile accordingly in the database
        const client = await pool.connect();
        const username = content[0];
        const description = content[1];
        const privacy = content[2];

        // Check if the username is already taken
        const queryText = 'SELECT * FROM users WHERE username = $1';
        const values = [username];
        const result = await client.query(queryText, values);
    
        // if the username is already taken, return an error
        if (result.rows.length > 0 && result.rows[0].userid != this.userID) {
          client.release();
          return { success: false, message: 'Username already taken' };
        }

        // Update username
        const queryText1 = 'UPDATE users SET username = $1 WHERE userID = $2';
        const values1 = [username, this.userID];
        await client.query(queryText1, values1);

        // Update description
        const queryText2 = 'UPDATE users SET description = $1 WHERE userID = $2';
        const values2 = [description, this.userID];
        await client.query(queryText2, values2);

        // Update privacy
        const queryText3 = 'UPDATE users SET privacy = $1 WHERE userID = $2';
        const values3 = [privacy, this.userID];
        await client.query(queryText3, values3);

        client.release();
        return { success: true, message: 'User profile edited successfully' };
    } catch (error) {
        console.error('Error editing user profile:', error);
        return { success: false, message: 'Failed to edit user profile' };
    }
  }

  async viewOwnProfile() {
    /*
      * Retrieve user own profile from the database
      * return {list[]} - The user profile ["username", "description", "privacy",  "post"]
    */
    try {
        const client = await pool.connect();

        const queryText = 'SELECT username, description, privacy FROM users WHERE userID = $1';
        const values = [this.userID];
        const result = await client.query(queryText, values);
        const userProfile = result.rows[0];

        const queryText2 = 'SELECT * FROM posts WHERE authorID = $1';
        const values2 = [this.userID];
        const result2 = await client.query(queryText2, values2);
        const posts = result2.rows;

        client.release();

        return { success: true, message: 'User profile retrieved successfully', userProfile: userProfile };

    } catch (error) {
        console.error('Error retrieving user profile:', error);
        return { success: false, message: 'Failed to retrieve user profile' };
    }
  }


  // Method to view other users' profile
  async viewProfile(targetUserID) {
    /*
      * Retrieve other users' profile from the database
      * @param {string} userID - The ID of the user whose profile is to be retrieved
      * return {list[]} - The user profile ["username", "description", "privacy", "post"]
    */
    try {
        // Retrieve target user information from the database
        const client = await pool.connect();
        const queryText = 'SELECT * FROM users WHERE userID = $1';
        const values = [targetUserID];
        const result = await client.query(queryText, values);

        // Check if target user exists
        if (result.rows.length === 0) {
            client.release();
            return { success: false, message: 'Target user not found' };
        }

        // Check if target user is public
        const targetUser = result.rows[0];
        const isFollowing = await this.isFollowing(this.userID, targetUserID);
        if (targetUser.privacy === 'public') {
            client.release();
            return { success: true, message: 'Target user profile retrieved successfully', targetUser, isFollowing: isFollowing, };
        }

        // Retrieve username, description, and privacy from the database
        const queryText0 = 'SELECT username, description, privacy FROM users WHERE userID = $1';
        const values0 = [targetUserID];
        const userID = [targetUserID];
        const result0 = await client.query(queryText, values);
        const userProfile = result0.rows[0];
        const username = userProfile.username;
        const description = userProfile.description;
        const privacy = userProfile.privacy;

        // If target user is private, check if the user is following the target user
        if (isFollowing) {
          // Retrieve posts from the database
          const queryText2 = 'SELECT * FROM posts WHERE authorID = $1';
          const values2 = [targetUserID];
          const result2 = await client.query(queryText2, values2);
          const posts = result2.rows;
          const userID = [targetUserID];

          client.release();

          return {
            success: true,
            message: 'User profile retrieved successfully',
            targetUser: targetUser,
            isFollowing: true
          };

        } else {
          client.release();
          return { success: true, message: 'User is private', targetUser : targetUser, isFollowing: false};
        }
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        return { success: false, message: 'Failed to retrieve user profile'};
    }
  }

  // Method to create a new post
  async createPost(userID, postContent, mediaURI) {
    /*
      * Create a new post in the database
      * @param {string} postContent - The content of the post
      * @param {string[]} attachments - An array of attachment URLs
    */
    try {
        // Check if the user is private or public
        //console.log("this.userID value:" + this.userID)
        const client = await pool.connect();
        const queryPrivacy = 'SELECT privacy FROM users WHERE userID = $1';
        const valuesPri = [userID];
        const resultPri = await client.query(queryPrivacy, valuesPri);
        const userType = resultPri.rows[0].privacy;

        // Insert post information into the database
        const queryText = 'INSERT INTO posts (privacy, content, authorID, mediaURI) VALUES ($1, $2, $3, $4) RETURNING postID';
        const values = [userType, postContent, userID, mediaURI];
        const result = await client.query(queryText, values);

        // Get the postID of the newly created post
        const postID = result.rows[0].postid;
        client.release();
        return { success: true, message: 'Post created successfully', postID:postID };
    } catch (error) {
        console.error('Error creating post:', error);
        return { success: false, message: 'Failed to create post' };
    }
  }

  // Method to edit own post
  async editPost(postID, editedContent, removeRequest) {
    /*
      * Edit own post in the database
      * @param {string} postID - The ID of the post to be edited, assume the post belongs to the user and the post exists
      * @param {string} editedContent - The new content to be updated
      * @param {int[]} removeRequest - request to remove the attachment
    */
    try {

        // First check if isrepost is true, then return error
        const client = await pool.connect();
        const queryText1 = 'SELECT isrepost FROM posts WHERE postID = $1';
        const values1 = [postID];
        const result1 = await client.query(queryText1, values1);
        if (result1.rows[0].isrepost) {
            client.release();
            return { success: false, message: 'Cannot edit reposted post' };
        }

        // Then check if there are any attachments to remove
        const queryText2 = 'SELECT mediaURI FROM posts WHERE postID = $1';
        const values2 = [postID];
        const result2 = await client.query(queryText2, values2);
        if (result2.rows[0].mediauri !== null && removeRequest.length > 0) {
            // remove the mediaURI and update the editedContent
            const queryText3 = 'UPDATE posts SET mediaURI = $1 AND content = $2 WHERE postID = $3';
            const values3 = [null, editedContent, postID];
            await client.query(queryText3, values3);
        } else {
            // Update the content of the post
            const queryText4 = 'UPDATE posts SET content = $1 WHERE postID = $2';
            const values4 = [editedContent, postID];
            await client.query(queryText4, values4);
        }
        client.release();
        return { success: true, message: 'Post edited successfully' };
    } catch (error) {
        console.error('Error editing post:', error);
        return { success: false, message: 'Failed to edit post' };
    }
  }

  // Method to delete own post
  async deletePost(postId) {
    /*
      * Delete a post from the database
      * @param {string} postId - The ID of the post to be deleted
    */
    try {
        // Delete likes associated with the post
        const client = await pool.connect();
        const queryText2 = 'DELETE FROM likes WHERE contentType = $1 AND contentID = $2';
        const values2 = ['post', postId];
        await client.query(queryText2, values2);

        // Delete post from the database
        const queryText = 'DELETE FROM posts WHERE postID = $1';
        const values = [postId];
        await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Post deleted successfully' };
    } catch (error) {
        console.error('Error deleting post:', error);
        return { success: false, message: 'Failed to delete post' };
    }
}

  //Method to check if a particular user has liked a particualr post
  async hasLikedPost(postID) {
    /*
      * Check if a user has liked a post
      * @param {string} userID - The ID of the user
      * @param {string} postID - The ID of the post
    */
    try {
        const client = await pool.connect();
        const queryText = 'SELECT * FROM likes WHERE contentType = $1 AND contentID = $2 AND userID = $3';
        const values = ['post', postID, this.userID];
        const result = await client.query(queryText, values);
        client.release();

        if (result.rows.length === 0) {
            return { success: true, message: 'User has not liked the post', liked: false};
        } else {
            return { success: true, message: 'User has liked the post', liked: true};
        }

    } catch (error) {
        console.error('Error checking if user has liked post:', error);
        return { success: false, message: 'Error checking if user has liked post', liked: null};
    }
  }

  // Method to like a post
  async likePost(postID) {
    /*
      * Like a post in the database
      * @param {string} postID - The ID of the post to be liked
    */
    try {
      
      const client = await pool.connect();
      const queryText = 'SELECT * FROM likes WHERE contentType = $1 AND contentID = $2 AND userID = $3';
      const values = ['post', postID, this.userID];
      const result = await client.query(queryText, values);

      // If the user has already liked the post, return an error
      if (result.rows.length > 0) {
        client.release();
        return { success: true, message: 'User has already liked the post' };
      }

      // Like the post
      const likeQuery = 'INSERT INTO likes (contentType, contentID, userID) VALUES ($1, $2, $3)';
      const likeValues = ['post', postID, this.userID];
      await client.query(likeQuery, likeValues);

      // Update the number of likes in the post
      const updateQuery = 'UPDATE posts SET likes = likes + 1 WHERE postID = $1';
      const updateValues = [postID];
      await client.query(updateQuery, updateValues);

      client.release();

      return { success: true, message: 'Post liked successfully' };

    } catch (error) {
        console.error('Error liking post:', error);
        return { success: false, message: 'Failed to like post' };
    }
  }

  // Method to unlike a post
  async unlikePost(postID) {
    /*
      * Unlike a post in the database
      * @param {string} postID - The ID of the post to be unliked
    */

    try {

      const client = await pool.connect();

      // Check if the user has liked the post
      const queryText = 'SELECT * FROM likes WHERE contentType = $1 AND contentID = $2 AND userID = $3';
      const values = ['post', postID, this.userID];
      const result = await client.query(queryText, values);
      
      // If the user has not liked the post, return without doing anything
      if (result.rows.length === 0) {
          client.release();
          return { success: false, message: 'User has not liked the post' };
      }
      
      // Otherwise, remove the like from the database
      const deleteQuery = 'DELETE FROM likes WHERE contentType = $1 AND contentID = $2 AND userID = $3';
      const deleteValues = ['post', postID, this.userID];
      await client.query(deleteQuery, deleteValues);

      // Update the number of likes in the post
      const updateQuery = 'UPDATE posts SET likes = likes - 1 WHERE postID = $1';
      const updateValues = [postID];
      await client.query(updateQuery, updateValues);
      
      client.release();

      return { success: true, message: 'Post unliked successfully' };

    } catch (error) {
        console.error('Error unliking post:', error);
        return { success: false, message: 'Failed to unlike post' };
    }
  }
  async checkRepost(postID) {
    try {
      // Delete likes associated with the post
      const client = await pool.connect();
      const queryText = 'SELECT isrepost FROM posts WHERE postid = $1';
      const values = [postID];
      const result = await client.query(queryText, values);
      client.release();
      return { success: true, isRepost: result.rows[0].isrepost, message: 'Check is repost request success'};
    } catch (error) {
      console.error('Error check repost:', error);
      return { success: false, isRepost: null, message: "Failed to check is repost request" };
    }
  }
  // Method to repost a post
  async repostPost(postID) {
    /*
      * Repost a post in the database
      * @param {string} postID - The ID of the post to be reposted
    */
    try {
      
      // Retrive the userID of the post from post database
      const client = await pool.connect();
      // Selete authorID and postID
      const queryText = 'SELECT authorID FROM posts WHERE postID = $1';
      const values = [postID];
      const result = await client.query(queryText, values);
      client.release();

      const authorID = result.rows[0].authorid;
      console.log(authorID,this.userID)
      // Check if the user is private, unless they repost their own posts
      if ((await this.isprivate(authorID)) && authorID != this.userID) {
          return { success: false, message: 'User is private' };
      }

      const privacy = 'public';

      if (result.rows[0].userID === this.userID) {
        privacy = 'private';
      }

      // Repost the post
      const client2 = await pool.connect();
      const queryText2 = 'INSERT INTO posts (authorID, content, mediaURI, privacy, isrepost) VALUES ($1, $2, $3, $4, $5) RETURNING postID';
      const values2 = [this.userID, postID, null, privacy, true];
      const result2 = await client2.query(queryText2, values2);
      const postID2 = result2.rows[0].postid;
      client2.release();

      return { success: true, message: 'Post reposted successfully', postID: postID2 };
        
    } catch (error) {
        console.error('Error reposting post:', error);
        return { success: false, message: 'Failed to repost post' };
    }
  }

  // Method to get comment for a particular postID
  async getComment(postID) {
    /*
      * Retrieve comments of a post from the database
      * @param {string} postID - The ID of the post to retrieve comments
    */
    try {
        // Retrieve comments of the post from the database
        const client = await pool.connect();
        const queryText = 'SELECT * FROM comments WHERE postID = $1';
        const values = [postID];
        const result = await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Comments retrieved successfully', comments: result.rows };
    } catch (error) {
        console.error('Error retrieving comments:', error);
        return { success: false, message: 'Failed to retrieve comments' };
    }
  }
  
  // Method to comment on a post
  async commentPost(postID, comment) {
    /*
      * Comment on a post in the database
      * @param {string} postID - The ID of the post to be commented on
      * @param {string} comment - The content of the comment
    */
    try {
        // Insert comment into the database
        const client = await pool.connect();
        const queryText = 'INSERT INTO comments (authorID, postID, content) VALUES ($1, $2, $3)';
        const values = [this.userID, postID, comment];
        await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Commented on post successfully' };
    } catch (error) {
        console.error('Error commenting on post:', error);
        return { success: false, message: 'Failed to comment on post' };
    }
  }

  // Method to like a comment
  async likeComment(commentID) {
    try {
      const client = await pool.connect();

      // Check if the user has liked the comment
      const queryText = 'SELECT * FROM likes WHERE contentType = $1 AND contentID = $2 AND userID = $3';
      const values = ['comment', commentID, this.userID];
      const result = await client.query(queryText, values);
      if (result.rows.length > 0) {
          client.release();
          return { success: false, message: 'User has already liked the comment' };
      }

      // Like the comment
      const likeQuery = 'INSERT INTO likes (contentType, contentID, userID) VALUES ($1, $2, $3)';
      const likeValues = ['comment', commentID, this.userID];
      await client.query(likeQuery, likeValues);

      // Update the number of likes in the comment
      console.log(commentID)
      const updateQuery = 'UPDATE comments SET likes = likes + 1 WHERE commentID = $1';
      const updateValues = [commentID];
      await client.query(updateQuery, updateValues);

      client.release();
      return { success: true, message: 'Comment liked successfully' };
    } catch (error) {
      console.error('Error liking comment:', error);
      return { success: false, message: 'Failed to like comment' };
    }
  }

  // Method to unlike a comment
  async unlikeComment(commentID) {
      try{
        // Check if the user has liked the comment
        const client = await pool.connect();
        const queryText = 'SELECT * FROM likes WHERE contentType = $1 AND contentID = $2 AND userID = $3';
        const values = ['comment', commentID, this.userID];
        const result = await client.query(queryText, values);
        if (result.rows.length === 0) {
            client.release();
            return { success: false, message: 'User has not liked the comment' };
        }
        
        // Otherwise, remove the like from the database
        const deleteQuery = 'DELETE FROM likes WHERE contentType = $1 AND contentID = $2 AND userID = $3';
        const deleteValues = ['comment', commentID, this.userID];
        await client.query(deleteQuery, deleteValues);

        // Update the number of likes in the comment
        const updateQuery = 'UPDATE comments SET likes = likes - 1 WHERE commentID = $1';
        const updateValues = [commentID];
        await client.query(updateQuery, updateValues);

        client.release();

        return { success: true, message: 'Comment unliked successfully' };

      } catch (error) {
        console.error('Error unliking comment:', error);
        return { success: false, message: 'Failed to unlike comment' };
      }
  }

  // Method to edit own comment
  async editComment(commentID, editedContent) {
    /*
      * Edit own comment in the database
      * @param {string} commentID - The ID of the comment to be edited, assume the comment belongs to the user and the comment exists
      * @param {string} editedContent - The new content to be updated
    */
    try {
        // Edit comment in the database
        const client = await pool.connect();
        const queryText = 'UPDATE comments SET content = $1 WHERE commentID = $2';
        const values = [editedContent, commentID];
        await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Comment edited successfully' };

    } catch (error) {
        console.error('Error editing comment:', error);
        return { success: false, message: 'Failed to edit comment' };
    }
  }

  // Method to delete own comment
  async deleteComment(commentID) {
    try{
      // Delete likes associated with the comment
      const client = await pool.connect();
      const queryText2 = 'DELETE FROM likes WHERE contentType = $1 AND contentID = $2';
      const values2 = ['comment', commentID];
      await client.query(queryText2, values2);

      // Delete comment from the database
      const queryText = 'DELETE FROM comments WHERE commentID = $1';
      const values = [commentID];
      await client.query(queryText, values);
      client.release();

      return { success: true, message: 'Comment deleted successfully' };

    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, message: 'Failed to delete comment' };
    }
  }

  // Method to get followers
  async getFollowers(userID) {
    /*
      * Retrieve the list of users that are following the user
    */
    try {
        const client = await pool.connect();
        const queryText = 'SELECT followerID FROM relationships WHERE followingID = $1';
        const values = [userID];
        const result = await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Followers retrieved successfully', followers: result.rows.length };
    } catch (error) {
        console.error('Error retrieving followers:', error);
        return { success: false, message: 'Failed to retrieve followers' };
    }
  }

  // Method to get followings
  async getFollowing(userID) {
    /*
      * Retrieve the list of users that the user is following
    */
    try {
        const client = await pool.connect();
        const queryText = 'SELECT followingID FROM relationships WHERE followerID = $1';
        const values = [userID];
        const result = await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Following retrieved successfully', following: result.rows.length };
    } catch (error) {
        console.error('Error retrieving following:', error);
        return { success: false, message: 'Failed to retrieve following' };
    }
  }

  // Method to follow other users
  async followUser(targetUserID) {
    /*
      * Follow another user in the database
      * @param {string} targetUserID - The ID of the user want to follow
    */
    try {

        // Handle the case if the user has sent pending follow request to the target user
        if ((await this.hasPendingFollowRequest(targetUserID)).isPending) { // Check if the user sent follow request to the target user
          // Remove the pending follow request
          return { success: false, message: 'User has already sent follow request to the user.' };
        }

        // Check if the user is already following the target user
        if (await this.isFollowing(this.userID, targetUserID)) {
            return { success: false, message: 'User is already following the target user' };
        }

        // Retrieve the privacy of the target user
        const client = await pool.connect();
        const queryText = 'SELECT privacy FROM users WHERE userID = $1';
        const values = [targetUserID];
        const result = await client.query(queryText, values);

        // Check if the target user is public
        if (result.rows[0].privacy == 'public') {
            // If the target user is public, append userID to target user's list of followers
            const queryText2 = 'INSERT INTO relationships (followerID, followingID) VALUES ($1, $2)';
            const values2 = [this.userID, targetUserID];
            await client.query(queryText2, values2);
            client.release();
            return { success: true, message: 'User followed successfully' };
        }

        // If not, send follow request to the target user
        // Append userID to target user's list of pending followers
        const queryText3 = 'INSERT INTO followRequests (followerID, followingID) VALUES ($1, $2)';
        const values3 = [this.userID, targetUserID];
        await client.query(queryText3, values3);

        client.release();

        return { success: true, message: 'Follow request sent successfully' };
    } catch (error) {
        console.error('Error following user:', error);
        return { success: false, message: 'Failed to follow user' };
    }
  }

  async acceptFollowRequest(awaitAcceptFollowerID) {
    /*
      * Accept follow request in the database
      * @param {string} awaitAcceptFollowerID - The ID of the user who want to follow the own user
    */

    try {
        const client = await pool.connect();
        const queryText = 'INSERT INTO relationships (followerID, followingID) VALUES ($1, $2)';
        const values = [awaitAcceptFollowerID, this.userID];
        await client.query(queryText, values);

        // Remove awaitAcceptFollowerID from the list of pending followers
        const deleteQuery = 'DELETE FROM followRequests WHERE followerID = $1 AND followingID = $2';
        const deleteValues = [awaitAcceptFollowerID, this.userID];
        await client.query(deleteQuery, deleteValues);

        client.release();

        return { success: true, message: 'User followed successfully' };
    } catch (error) {
        console.error('Error following user:', error);
        return { success: false, message: 'Failed to follow user' };
    }
  }

  // Method to reject follow request
  async rejectFollowRequest(rejectFollowerID) {
    /*
      * Reject follow request in the database
      * @param {string} rejectFollowerID - The ID of the user who want to follow the own user
    */
    try {
        const client = await pool.connect();
        const queryText = 'DELETE FROM followRequests WHERE followerID = $1 AND followingID = $2';
        const values = [rejectFollowerID, this.userID];
        await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Follow request rejected successfully' };
    } catch (error) {
        console.error('Error rejecting follow request:', error);
        return { success: false, message: 'Failed to reject follow request' };
    }
  }
  
  // Method to get if the user has pending follow request to target user
  async hasPendingFollowRequest(targetUserID) {
    /*
      * Check if the user has pending follow request to the target user
      * @param {string} targetUserID - The ID of the target user
    */
    try {
        // Check if the user has pending follow request to the target user
        const client = await pool.connect();
        const queryText = 'SELECT * FROM followRequests WHERE followerID = $1 AND followingID = $2';
        const values = [this.userID, targetUserID];
        const result = await client.query(queryText, values);
        client.release();
        console.log(result.rows.length);
        const isPending = result.rows.length > 0 ? true : false ;
        return {success: true, message: "check pending request successfully", isPending: isPending}
    } catch (error) {
        console.error('Error checking if user has pending follow request:', error);
        return { success: false, message: 'Error checking if user has pending follow request', isPending: null};
    }
  }

  // Method to unfollow other users
  async unfollowUser(targetUserID) {
    /*
      * Unfollow another user in the database
      * @param {string} targetUserID - The ID of the user to unfollow
    */
    try {

        // Handle the case if the user has sent pending follow request to the target user
        if ((await this.hasPendingFollowRequest(targetUserID)).isPending) { // Check if the user sent follow request to the target user
          // Remove the pending follow request
          const client = await pool.connect();
          const queryText = 'DELETE FROM followRequests WHERE followerID = $1 AND followingID = $2';
          const values = [this.userID, targetUserID];
          await client.query(queryText, values);
          client.release();
          return { success: true, message: 'User has removed pending follow request to target user' };
        }

        // Check if the user is following the target user
        if (!await this.isFollowing(this.userID, targetUserID)) {
            return { success: false, message: 'User is not following the target user' };
        }

        // Unfollow the target user
        const client = await pool.connect();
        const queryText = 'DELETE FROM relationships WHERE followerID = $1 AND followingID = $2';
        const values = [this.userID, targetUserID];
        await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Unfollowed user successfully' };
    } catch (error) {
        console.error('Error unfollowing user:', error);
        return { success: false, message: 'Failed to unfollow user' };
    }
  }

  // Method to get particular post
  async getPost(postID) {
    /*
      * Retrieve post information from the database
      * @param {string} postID - The ID of the post to be retrieved
    */
    try {
        // Retrieve post information from the database
        const client = await pool.connect();
        const queryText = 'SELECT * FROM posts WHERE postID = $1';
        const values = [postID];
        const result = await client.query(queryText, values);
        client.release();

        // Check if post exists
        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error retrieving post:', error);
        return null;
    }
  }

  // Method to get all own posts
  async getOwnPosts() {
    /*
      * Retrieve all posts of the user from the database
    */
    try{
      const client = await pool.connect();
      const queryText = 'SELECT * FROM posts WHERE authorID = $1';
      const values = [this.userID];
      const result = await client.query(queryText, values);
      client.release();

      return { success: true, message: 'Own posts retrieved successfully', posts: result.rows };

    } catch (error) {
    console.error('Error retrieving own posts:', error);
    return { success: false, message: 'Failed to retrieve own posts' };
    }
  }

  // Method to check if the user following the target user
  async isFollowing(userID, targetUserID) {
    /*
      * Check if the user is following the target user
      * @param {string} userID - The ID of the user to check
      * @param {string} targetUserID - The ID of the user to check if the user is following
    */
    try {
        // Check if the user is following the target user
        const client = await pool.connect();
        const queryText = 'SELECT * FROM relationships WHERE followerID = $1 AND followingID = $2';
        const values = [userID, targetUserID];
        const result = await client.query(queryText, values);
        client.release();

        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking if user is following:', error);
        return false;
    }
  }

  // Method to check if the target user is private
  async isprivate(targetUserID) {
    /*
      * Check if the target user is private
      * @param {string} targetUserID - The ID of the target user
    */
    
    try {
        // Check if the target user is private
        const client = await pool.connect();
        const queryText = 'SELECT privacy FROM users WHERE userID = $1';
        const values = [targetUserID];
        const result = await client.query(queryText, values);
        client.release();

        return result.rows.length > 0 && result.rows[0].privacy === 'private';
    } catch (error) {
        console.error('Error checking if user is private:', error);
        return false;
    }
  }
  
  // Method to check if security answers are correct
  //Parameter added: username, as forget password function is located outside the login process, thus this.userID will be undefined
  async checkSecurityAnswer(username, securityAnswer) {
    /*
      * Check if the security answers are correct
      * @param {string} securityAnswer - The security answer of the account to check
    */
    try {
        // Check if the security answers are correct

        /*old version
        const client = await pool.connect();
        const queryText = 'SELECT secureqAns FROM users WHERE userID = $1';
        console.log("accessing database")
        console.log(userID)
        const values = [userID];
        const result = await client.query(queryText, values);
        client.release();
        */
        console.log(`accessing database for user ${username}`)
        const client = await pool.connect();
        const queryText = 'SELECT secureqAns FROM users WHERE username = $1';
        const values = [username];
        const result = await client.query(queryText, values);
        client.release();

        // Retrieve the security answers from the result
        const retrievedSecurityAnswer = result.rows[0].secureqans;
        //console.log(retrievedSecurityAnswer)
        //console.log(securityAnswer)
        // Check if the provided security answers match the retrieved security answers
        return JSON.stringify(retrievedSecurityAnswer) === JSON.stringify(securityAnswer);
    } catch (error) {
        console.error('Error checking security answers:', error);
        return false;
    }
  }

  // Method to reset password
  async resetPassword(username, newPassword) {
    /*
      * Forget password and recover the account
      * @param {string} newPassword - The new password to be updated, assume we have checked the security answers
    */
    try {
        //console.log(username, newPassword);
        // Generate a new hashed password
        const salt = generateSalt();
        const newHashedPassword = hashPassword(newPassword, salt);

        const client = await pool.connect();

        // Update the password in the database
        const queryText2 = 'UPDATE users SET password = $1, salt = $2 WHERE username = $3';
        const values2 = [newHashedPassword, salt, username];
        await client.query(queryText2, values2);
        client.release();

        return { success: true, message: 'Password reset successfully', newPassword };
    } catch (error) {
        console.error('Error resetting password:', error);
        return { success: false, message: 'Failed to reset password' };
    }
  }

  // Method to return folloing user who also follow back
  async getMutualFollowing() {
    /*
      * Retrieve the list of users that the user is following and also follow back
    */
    try {
        const client = await pool.connect();
        const queryText = 'SELECT followingID FROM relationships WHERE followerID = $1';
        const values = [this.userID];
        const result = await client.query(queryText, values);

        const following = result.rows;
        const mutualFollowing = [];

        // Check if the users in the following list also follow back
        for (const user of following) {
            const queryText2 = 'SELECT * FROM relationships WHERE followerID = $1 AND followingID = $2';
            const values2 = [user.followingid, this.userID];
            const result2 = await client.query(queryText2, values2);

            if (result2.rows.length > 0) {
                mutualFollowing.push(user.followingid);
            }
        }

        client.release();

        return { success: true, message: 'Mutual following retrieved successfully', mutualFollowing };
    } catch (error) {
        console.error('Error retrieving mutual following:', error);
        return { success: false, message: 'Failed to retrieve mutual following' };
    }
  }

  // Method to get unread message
  async CheckUnreadMessages() {
    /*
      * Retrieve unread messages for the user
    */
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM messages WHERE receiverID = $1 AND read = false';
      const values = [this.userID];
      const result = await client.query(queryText, values);
      client.release();

      if(result.rows.length === 0){
        return { success: true, message: 'No unread messages', unread : false};
      } else {
        return { success: true, message: 'Unread messages exist', unread : true };
      }

    } catch (error) {
      console.error('Error retrieving unread messages:', error);
      return { success: false, message: 'Failed to retrieve unread messages' };
    }
  }

  async GetUnreadMessages() {
    /*
      * Retrieve unread messages sender id for the user
    */
    try {
      const client = await pool.connect();
      const queryText = 'SELECT DISTINCT senderID FROM messages WHERE receiverID = $1 AND read = false';
      const values = [this.userID];
      const result = await client.query(queryText, values);
      client.release();

      return { success: true, message: 'Unread messages retrieved successfully', unreadMessages: result.rows };

    } catch (error) {
      console.error('Error retrieving unread messages:', error);
      return { success: false, message: 'Failed to retrieve unread messages senderID' };
    }
  }
  // Method to send a message
  async sendMessage(receiverID, message) {
    /*
      * Send a message to another user
      * @param {string} receiverID - The ID of the user receiving the message
      * @param {string} message - The content of the message
    */
    try {
      const client = await pool.connect();
      const queryText = 'INSERT INTO messages (senderid, receiverid, content) VALUES ($1, $2, $3)';
      const values = [this.userID, receiverID, message];
      await client.query(queryText, values);
      client.release();
      
      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, message: 'Failed to send message' };
    }
  }
  
  // Method to receive messages with a specific user
  async getMessagesWithUser(targetUserID) {
    /*
      * Retrieve messages with a specific user
      * @param {string} userID - The ID of the user to get messages with
    */
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM messages WHERE (senderID = $1 AND receiverID = $2) OR (senderID = $2 AND receiverID = $1) ORDER BY time DESC';
      const values = [this.userID, targetUserID];
      const result = await client.query(queryText, values);
      
      // When we get the messages, we assume the user read the messages
      const updateQuery = 'UPDATE messages SET read = true WHERE senderID = $1 AND receiverID = $2';
      const updateValues = [targetUserID, this.userID];
      await client.query(updateQuery, updateValues);

      client.release();
      return { success: true, message: 'Messages retrieved successfully', messages: result.rows };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, message: 'Failed to get messages' };
    }
  }

  // Method to get notifications
  async getNotifications() {
    /*
      * Retrieve notifications (follow requests) for the user
    */
    try {
      const client = await pool.connect();
      const queryText = 'SELECT * FROM followRequests WHERE followingID = $1';
      const values = [this.userID];
      const result = await client.query(queryText, values);
      client.release();

      const followRequests = [];
      for (let i = 0; i < result.rows.length; i++) {
        const followerID = result.rows[i].followerid;
        followRequests.push(followerID);
      }

      return { success: true, message: 'Follow requests retrieved successfully', notifications: followRequests };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, message: 'Failed to get notifications' };
    }
  }

  // Method to search other users
  async searchUser(keyword) {
    /*
      Search for other users by keyword in the database
      @param {string} keyword - The keyword to search for
    */
    try {
  
        const client = await pool.connect();

        // Search for username by keyword in the database
        const queryText = 'SELECT * FROM users WHERE username ILIKE $1';
        const values = [`%${keyword}%`];
        const result = await client.query(queryText, values);
        client.release();

        return { success: true, message: 'Users retrieved successfully', users: result.rows };
    } catch (error) {
        console.error('Error searching for users:', error);
        return { success: false, message: 'Failed to search for users' };
    }
  }

  // Method to search by message tags
  async searchByMessageTags(tags) {
    /*
      * Search for posts by message tag in the database, note tag starts with #
      * @param {string[]} tags - A list of tags to search for
    */
    try {
      const client = await pool.connect();

      const resultSet = new Map(); // Initialize a Map to store postIDs and their tag counts

      // Iterate through each tag in the provided list
      for (const tag of tags) {
        // Search for posts with exact matching tag
        const queryResult = await client.query('SELECT postID FROM posts WHERE content ILIKE $1 AND isRepost = false', [`%${tag}%`]);
        const matchedPostIDs = queryResult.rows;

        // Loop through the query result
        for (const post of matchedPostIDs) {
          const matchedPostID = post.postid;

          // If postID is not yet in the resultSet, add it with count 1
          if (!resultSet.has(matchedPostID)) {
            resultSet.set(matchedPostID, 1);
          } else {
            // If postID already exists, increment the count
            const currentCount = resultSet.get(matchedPostID);
            resultSet.set(matchedPostID, currentCount + 1);
          }
        }
      }
  

      // Sort the resultSet by tag counts in descending order
      const sortedResult = [...resultSet.entries()].sort((a, b) => b[1] - a[1]);

      // Extract postIDs from sortedResult
      const postIDs = sortedResult.map(([postId, _]) => postId);

      client.release();
      return { success: true, message: 'Search successfully', postIDs: postIDs };

    } catch (error) {
      return { success: false, message: 'Failed to search by tags'}
    }
  }

  // Method to search posts by keywords
  async generalSearch(searchContent) {
    /*
      * Search posts by similarity, and return a list of post, sorted by similarity
    */
    try {
      const client = await pool.connect();
  
      // Enable pg_trgm extension for similarity search
      await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  
      // Search for posts with content similarity to searchContent
      const queryResult = await client.query(`
        SELECT postID 
        FROM posts 
        WHERE content % $1 AND isRepost = false
      `, [searchContent]);

      const postIDs = queryResult.rows.map(row => row.postid);
  
      client.release();
      return { success: true, message: 'Search successfully', postIDs: postIDs };
    } catch (error) {
      return { success: false, message: 'Failed to perform general search' };
    }
  }

    // Method to get recommended users to follow based on the following of the user with most common relationship (nearest neighbor recommendation)
    async getRecommendedUsers() {
      /*
        * Get recommended users to follow based on the following of the most user with most common relationship
      */
      try {
        const client = await pool.connect();
    
        // Get the user with the most overlap of following to the current user
        const queryResult = await client.query(`
          SELECT followerID, COUNT(*) AS count
          FROM relationships
          WHERE followerID != $1 AND followingID IN (SELECT followingID FROM relationships WHERE followerID = $1)
          GROUP BY followerID
          ORDER BY count DESC
          LIMIT 1
        `, [this.userID]);
        
        if (queryResult.rows.length === 0) {
          client.release();
          return { success: true, message: 'No recommended users' };
        }
        
        const nearestUserID = queryResult.rows[0].followerid;
    
        // Get the users that the most followed user is following and the current user is not following
        const queryResult2 = await client.query(`
          SELECT followingID
          FROM relationships
          WHERE followerID = $1 AND followingID != $1
          EXCEPT
          SELECT followingID
          FROM relationships
          WHERE followerID = $2
        `, [nearestUserID, this.userID]);
  
        const recommendedUserIDs = queryResult2.rows.map(row => row.followingid);
        
    
        client.release();
        return { success: true, message: 'Recommended users retrieved successfully', recommendedUserIDs };
      } catch (error) {
        return { success: false, message: 'Failed to get recommended users' };
      }
    }  
  
    // Method to get recent popular posts
    async getRecentPopularPosts() {
      /*
        * Get recent popular posts from the database
      */
      try {
        const client = await pool.connect();
    
        // Retrieve the most recent posts
        const queryResult = await client.query(`
          SELECT contentID, COUNT(*) AS count
          FROM likes
          WHERE contentType = 'post' AND time > NOW() - INTERVAL '1 day'
          GROUP BY contentID
          ORDER BY count DESC
          LIMIT 10
        `);
  
        // const postIDs = queryResult.rows.map(row => row.contentid);
        const posts = queryResult.rows;
        const modifiedPosts = posts.map(post => {
          return {
            postid: post.contentid,
            count: post.count
          }
        })
    
        client.release();
        return { success: true, message: 'Recent popular posts retrieved successfully', modifiedPosts };
      } catch (error) {
        return { success: false, message: 'Failed to get recent popular posts' };
      }
    }
  
    // Method to get recommended posts (nearby public posts)
    async getRecommendedPosts() {
      /*
        * Get recommended posts from the database
      */
      try {
        const client = await pool.connect();
    
        // Get the user's followers
        const queryResult = await client.query(`
          SELECT followerID
          FROM relationships
          WHERE followingID = $1
        `, [this.userID]);
  
        const followerIDs = queryResult.rows.map(row => row.followerid);
    
        // Get the public posts posted by related users
        const queryResult2 = await client.query(`
          SELECT postID
          FROM posts
          WHERE authorID NOT IN (SELECT followingID FROM relationships WHERE followerID = $1) AND privacy = 'public'
          AND authorID IN (SELECT followingID FROM relationships WHERE followerID = ANY($2))
          ORDER BY time DESC
          LIMIT 10
        `, [this.userID, followerIDs]);
        
        // const postIDs = queryResult2.rows.map(row => row.postid);
        const posts = queryResult2.rows
    
        client.release();
        return { success: true, message: 'Recommended posts retrieved successfully', posts };
      } catch (error) {
        return { success: false, message: 'Failed to get recommended posts' };
      }
    }
    
    // Method to get posts that are posted by the user's following
    async getFollowingPosts() {
      /*
        * Get posts that are posted by the user's following
      */
      try {
        const client = await pool.connect();
    
        // Get the posts that are posted by the user's following
        const queryResult = await client.query(`
          SELECT postID
          FROM posts
          WHERE authorID IN (SELECT followingID FROM relationships WHERE followerID = $1)
          ORDER BY time DESC
          LIMIT 10
        `, [this.userID]);
  
        // const postIDs = queryResult.rows.map(row => row.postid);
        const posts = queryResult.rows;
    
        client.release();
        return { success: true, message: 'Following posts retrieved successfully', posts };
      } catch (error) {
        return { success: false, message: 'Failed to get following posts' };
      }
    }
  
}

module.exports = UserHandler;