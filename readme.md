# Generator

Express does not lay down suggested project structures or conventions when building an API. There are lots of opinions. This generator follows the suggestion laid out by Corey Cleary. [https://www.coreycleary.me/project-structure-for-an-express-rest-api-when-there-is-no-standard-way](https://www.coreycleary.me/project-structure-for-an-express-rest-api-when-there-is-no-standard-way)

Getting routes, controllers, services and db working across the layers can be prone to error. The _generator_ project generates the necessary skeleton code for routes, controllers, services, db access and tests.

The code is linear. This is deliberate putting ability to quickly understand the code above elegance.

Two parts:

- The generator code script that generates the js code in for the target app
- Target app (the directory where all the target code get written)

### Target app

To give a known starting point, from a given directory (in this example gen-target):

Run init and set the access point to `server.js`

```bash
npm init
```

Install latest version of following `npm` packages:

```bash
npm i express cors mysql2  --save
```

For running test, install the latest version of following `npm` packages:

```bash
npm install jest supertest  superagent --save-dev
```

To set up Jest allowing for config setting add a Jest config object to `package.json` and add Jest to the test script.

The resulting `package.json` file should resemble:

```json
{
  "name": "gen-test",
  "version": "0.1.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "test": "jest"
  },
  "author": "RNC",
  "license": "ISC",
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.17.3",
    "mysql2": "^2.3.3"
  },
  "devDependencies": {
    "jest": "^27.5.1",
    "superagent": "^7.1.1",
    "supertest": "^6.2.2"
  },
  "jest": {
    "verbose": true
  }
}
```

The target directory is now ready for the generator to create the route, controllers etc

## gen

The gen app depends on the `.env` set up. Here is an example:

```bash
# target directory for generation
APPDIR="gen-test"

# Generate a skeleton dirs/files ES or NO/no/anything
GENERATESKELETON=YES

# Overwrite existing skeleton dirs/files YES or NO/no/anything
# There is a different overwrite for routes
OVERWRITESKELETON=YES

# Database provider, user and database name (add password using editor)
DATABASEPROVIDER=MYSQL
DATABASEHOST=localhost
DATABASEUSER=root
DATABASENAME=redmugapi

# generate routes YES or NO/no/anything
# route details are passed as options
GENERATEROUTES=YES

# Overwrite the route if exists
OVERWRITEROUTE=YES

# route name may be for example
#  users              (no parameters)
#  user/:id           (data passed as part of url e.g.   /user/1)
#  search?name=       (data passed url query string parameter e.g search?name=wilson)
#
# route names are converted to lower case - N.B. omit leading 'slash'
ROUTENAME=users

# route method may be GET, POST, PUT or DELETE
# data for GET is passed as part of URL or as string parameter - request body ignored
# data for POST, PUT and DELETE always passed as part of request body
ROUTEMETHOD=GET

# request body - generator will add suitable code pass through listed fields
# Only used if method POST, PUT or DELETE
# e.g for a /creatuser url the object keys might be {display-name, email, role, status}
# dummy code will be created for these request body object keys
ROUTEREQUESTBODY={}

# the JSON object returned if no working SQL implemented - use for initial testing
# if empty defaults to:
# [{"id": 1,"email": "rcollins@redmug.co.uk","role": "superuser"}, {"id": 2,"email": "support@redmug.dev","role": "user"}]
ROUTETESTRESPONSE=[{"id": 1,"display-name": "Robert Collins","email": "rcollins@redmug.co.uk","last_login": "2022-02-17", "role": "superuser"}]

# port to listen on
PORT=3005
```

The workflow might be:

1. set `GENERATESKELETON=YES` and generate a working skeleton and first route by running `npm run app.js` from the root of the gen app
2. Set the database password in `/configs/dbconfig.js`
3. Test the server and first route (e.g. users in above .env example) using the URL `loacalhost:3005/api/users` The browser should display whatever was set in the `ROUTETESTRESPONSE` or if left empty:

```json
[
  {
    "id": 1,
    "email": "rcollins@redmug.co.uk",
    "role": "superuser"
  },
  {
    "id": 2,
    "email": "support@redmug.dev",
    "role": "user"
  }
]
```

1. To add further routes, change `GENERATESKELETON=YES` to `GENERATESKELETON=NO` in `.env`
2. Keep adding routes setting the following in `.env`

```bash
ROUTENAME=
ROUTEMETHOD=
ROUTEREQUESTBODY=
ROUTETESTRESPONSE=
```

1. Repeat adding routes as needed
