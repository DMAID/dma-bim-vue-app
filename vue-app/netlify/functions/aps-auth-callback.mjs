// netlify/functions/aps-auth-callback.mjs
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const clientId = process.env.APS_CLIENT_ID;
  const clientSecret = process.env.APS_CLIENT_SECRET;
  const redirectUri = process.env.APS_REDIRECT_URI;
  const code = event.queryStringParameters.code;
  var basicHeader = String('\'Basic ', btoa(clientId,':',clientSecret),'\'');

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Authorization code not provided' }),
    };
  }

  // Exchange the authorization code for an access token
  const tokenResponse = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': basicHeader,
    },
    body: JSON.stringify({
      String: 'grant_type=authorization_code',
      code: String('code=', code),
      redirectUri: String('redirect_uri=', redirectUri),
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return {
      statusCode: 400,
      body: JSON.stringify(tokenData),
    };
  }

  const accessToken = tokenData.access_token;

  // Use the access token to access protected resources
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const userData = await userResponse.json();

  return {
    statusCode: 200,
    body: JSON.stringify({ user: userData }),
  };
};