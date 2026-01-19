const axios = require('axios');
const querystring = require('querystring');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');
const process = require('process');
const crypto = require('crypto');

async function getAccessToken(clientId, clientSecret) {
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';
  const requestBody = {
    grant_type: 'client_credentials',
  };

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
  };

  try {
    const response = await axios.post(tokenEndpoint, querystring.stringify(requestBody), config);
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token', error);
    return null;
  }
}

async function searchTrack(accessToken, query) {
  const searchEndpoint = 'https://api.spotify.com/v1/search';
  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    params: {
      q: query,
      type: 'track',
      limit: 1,
    },
  };

  try {
    const response = await axios.get(searchEndpoint, config);
    const tracks = response.data.tracks.items;
    return tracks.length > 0 ? tracks[0].id : null;
  } catch (error) {
    console.error('Error searching track', error);
    return null;
  }
}

async function createPlaylist(accessToken, userId, playlistName) {
  const createPlaylistEndpoint = `https://api.spotify.com/v1/users/${userId}/playlists`;
  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  const data = {
    name: playlistName,
    description: 'Created with ChatGPT.',
  };

  try {
    const response = await axios.post(createPlaylistEndpoint, data, config);
    return response.data.id;
  } catch (error) {
    console.error('Error creating playlist', error);
    return null;
  }
}

async function addTracksToPlaylist(accessToken, playlistId, trackIds) {
  const addTracksEndpoint = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  const data = {
    uris: trackIds.map((id) => `spotify:track:${id}`),
  };

  try {
    await axios.post(addTracksEndpoint, data, config);
  } catch (error) {
    throw error;
  }
}

async function getUserId(accessToken) {
  const getUserEndpoint = 'https://api.spotify.com/v1/me';
  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await axios.get(getUserEndpoint, config);
    return response.data.id;
  } catch (error) {
    console.error('Error getting user ID', error);
    return null;
  }
}

function openSpotifyAuthorizationUrl(clientId, redirectUri, scopes, state) {
  const authUrl = url.format({
    protocol: 'https',
    hostname: 'accounts.spotify.com',
    pathname: 'authorize',
    query: {
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: state
    }
  });

  console.log('Please open the following URL in your browser:');
  console.log(authUrl);

  // ブラウザでURLを開く（プラットフォームに依存する）
  const openUrlCommand = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${openUrlCommand} "${authUrl}"`);
}

async function waitForAuthorizationCode(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const query = url.parse(req.url, true).query;
        const authCode = query.code;

        if (authCode) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.write('<html><body><h1>認証に成功しました。このページを閉じて、アプリケーションに戻ってください。</h1></body></html>');
          res.end();

          server.close();
          resolve(authCode);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.write('<html><body><h1>認証コードがありません。再度お試しください。</h1></body></html>');
          res.end();
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><body><h1>サーバーエラーが発生しました。再度お試しください。</h1></body></html>');
        res.end();

        reject(error);
      }
    });

    server.listen(port, '0.0.0.0', () => {
      console.log(`Listening for authorization code on http://0.0.0.0:${port}`);
    });
  });
}

async function requestAccessToken(authorizationCode, clientId, clientSecret, redirectUri) {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token
    };
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('Failed to request access token:', error.response.data);
    } else {
      console.error('Failed to request access token:', error.message);
    }
    throw error;
  }
}

async function getUserPlaylists(accessToken, userId) {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    return response.data.items;
  } catch (error) {
    console.error('Failed to get user playlists:', error.response.data);
    return null;
  }
}

async function findPlayList(playlists, name) {
  if (playlists) {
    return playlists.find(playlist => playlist.name === name);
  }
  return false;
}

(async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const redirectUri = 'http://localhost:8080/callback';
  const scopes = ['playlist-read-private', 'playlist-modify-private', 'playlist-modify-public'];
  const state = crypto.randomBytes(16).toString('hex');

  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node main.js <playlist_name> "<artist_name> - <track_name>"');
    return;
  }

  const playlistName = args[0];
  const query = args[1];

  openSpotifyAuthorizationUrl(clientId, redirectUri, scopes, state);

  const authorizationCode = await waitForAuthorizationCode(8080);
  if (!authorizationCode) {
    console.error('Error getting authorization code');
    return;
  }

  const tokens = await requestAccessToken(authorizationCode, clientId, clientSecret, redirectUri);
  const accessToken = tokens.accessToken;
  const refreshToken = tokens.refreshToken;
  console.log('Access Token: ', accessToken);
  console.log('Refresh Token: ', refreshToken);

  const userId = await getUserId(accessToken);
  if (!userId) {
    console.error('Error getting user ID');
    return;
  }

  console.log('User ID: ', userId);

  const trackId = await searchTrack(accessToken, query);

  if (trackId) {
    console.log('Track ID:', trackId);
  } else {
    console.error('Track not found');
  }

  const trackIds = [trackId];
  const playLists = await getUserPlaylists(accessToken, userId);
  const playlistId = await (async (accessToken, userId, lists, name) => {
    const list = await findPlayList(lists, playlistName);
    if (list && list.id) {
      return list.id;
    } else {
      return await createPlaylist(accessToken, userId, name);
    }
  })(accessToken, userId, playLists, playlistName);

  console.log('Playlist ID:', playlistId);

  try {
    await addTracksToPlaylist(accessToken, playlistId, trackIds);
    console.log('Tracks added to playlist');
  } catch (error) {
    console.error('Failed to add to playlist:', error.message);
  }
})();
