# Mock Project Service API

## Dependencies

- nodejs https://nodejs.org/en/ (v12+)

## Configuration

Configuration for the application is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- `PORT`: the server port, default is 4000
- `AUTH_SECRET`: The authorization secret used during token verification.
- `VALID_ISSUERS`: The valid issuer of tokens, a json array contains valid issuer.


## Local Deployment

- Install dependencies `npm install`
- Start app `npm start`
- App is running at `http://localhost:4000`
