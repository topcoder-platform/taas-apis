### DEMO PAYMENT SCRIPT

This demo script tests the functionality of PaymentService.

Parameters for creating payments are hardcoded in the script. There are severel groups of parameters, each of them tests a certain functionality of the demo service. You can always insert new group of parameters to run in the script.

Before start set the following environment variables:
AUTH0_URL=
AUTH0_AUDIENCE=
AUTH0_AUDIENCE_UBAHN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

To run the script use the following commands:

```
npm install
npm run lint
npm run demo-payment
```

Read the logger to see results.