# TL:DR

Generator for Node + Express + MySQL routes with consistent route, controller, service and data layers. Supports GET, POST, PUT and DELETE methods. Also generates jest tests and API documentation.

# Generator

Express does not lay down suggested project structures or conventions when building an API. There are lots of opinions. This generator follows the suggestions of Corey Cleary. [https://www.coreycleary.me/project-structure-for-an-express-rest-api-when-there-is-no-standard-way](https://www.coreycleary.me/project-structure-for-an-express-rest-api-when-there-is-no-standard-way)

Getting routes, controllers, services and db working across the layers can be prone to error. The _generator_ project generates the necessary scaffold code for routes, controllers, services, db access and tests.

The code is verbose with some repeating code block. This is deliberate putting ability to quickly understand the code above elegance.

Two parts:

- The generator code script that generates the js code in for the target app
- Target app (the directory where all the target code gets written)

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
    "test": "jest --detectOpenHandles -i tests/api-tests.test"
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
    "verbose": true,
    "maxWorkers": 1
  }
}
```

The target directory is now ready for the generator to create the route, controllers etc

## gen

The gen app uses an `.env` set up. Here is an example:

```bash
# path to root of target directory
APPPATH="C:/Users/rcollins/code/"
# target directory for generation
APPDIR="gen-test2"
# origin - the web client that will access this server - Used in CORS setup
ORIGIN="https://redmug.dev"

# port to listen on
PORT=3005

# Database provider, user and database name (add password using editor)
DATABASEPROVIDER=MYSQL
DATABASEHOST=localhost
DATABASEUSER=root
DATABASENAME=redmugapi
DATABASEWAITFORCONNECTIONS=true,
DATABASECONNECTIONLIMIT=10,
DATABASEQUEUELIMIT=0

# Overwrite the route if exists
OVERWRITEROUTE=YES

# create a routes config by copying the routes-config-sample.json file
CREATEROUTESCONFIGFROMSAMPLE=YES
```

The workflow might be:

1. Delete any existing directories or files in the target e.g. `gen-test` by running `node app.js --purge`
2. Create the required directories and file scaffolds by running `node app.js --scaffold`
3. Edit the `/configs/routes-config.json` to match the route/routes needed
4. Check the `/configs/routes-config.json` by running `node app.js --validate`
5. Generate a single route by running `node app.js --route 1` where 1 is the id. To run multiple routes e.g. `node app.js 1,2,3 6-9` use a mix off comma listed ids and/or ranges. To run all routes uses `node app.js --route all`
6. Set the database password in `/configs/dbconfig.js`
7. Test the server and first route (e.g. users in above .env example) using the URL `loacalhost:3005/api/users` The browser should display whatever was set in the `thisRoute.requestresponse`. For example:

```json
{
  "status": "success",
  "data": {
    "users": [
      { "id": 1, "email": "someone@redmug.dev", "role": "superuser" },
      { "id": 2, "email": "support@redmug.dev", "role": "user" }
    ]
  }
}
```

## tests

The scaffold generation code creates a `/tests` directory and a file, `api.tests.test.js` is populated with and outline that individual test are then be added to:

```jsx
const request = require('supertest')
const app = require('../app')
const pool = require('../db/db-pool')

beforeEach(() => {})

//@insert1

afterEach(() => {
  pool.end()
})
```

For each route generated, tests are added. Here is the completed test snippet generated for `/users`

```jsx
const request = require('supertest')
const app = require('../app')
const pool = require('../db/db-pool')

beforeAll(() => {})

describe('Test the users route', () => {
  test('Test /api/users emails include ??', async () => {
    const response = await request(app).get('/api/users')
    // change these assertions to match API return
    expect(response.body.data.users[0].email).toEqual('someone@redmug.dev')
    expect(response.body.data.users[1].email).toEqual('support@redmug.dev')
    expect(response.body.data.users[0].role).toEqual('superuser')
    expect(response.body.data.users[1].role).toEqual('user')

    expect(response.statusCode).toBe(200)
  })
})

//@insert1

afterAll(() => {
  pool.end()
})
```

The detailed matches in the middle of this code snippet come from the `routes-config.json`.
The `expect(response.statusCode).toBe(200)` is added for all GET method APIs with `expect(response.statusCode).toBe(201)` being returned for POST method APIs.

The testmatches` entry for the example above is:

```jsx
"testmatches": "users[0].email|users[1].email|users[0].role|users[1].role",
```

To run the tests uses `npm test` - if you get `"Error: no test specified"` this is probably caused by executing `npm test` from the generator directory rather than the target directory e.g. `gen-test`. The database password should also be set before running `npm test` in `/configs/dbconfigs.js`

A sample `npm test` output:

```bash
$ npm test

> gen-test2@1.0.0 test
> jest --detectOpenHandles -i tests/api-tests.test.js

  console.log
    Successfully connected to the database (connection pool): redmugapi

      at db/db-pool.js:23:12

 PASS  tests/api-tests.test.js
  Test the users route
    ??? Test /api/users emails include ?? (107 ms)
  Test the user/:id route
    ??? Test /api/user emails include ?? (14 ms)
  Test the usersearch?name=wil&country=uk route
    ??? Test /api/usersearch emails include ?? (16 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.084 s, estimated 2 s
Ran all test suites matching /tests\\api-tests.test.js/i.
```

As the SQL is added to the `/db` directory route file, the assertion test need changing to match.
The code generated from `testmatches` supports type of number, string and boolean with `toEqual` assertions. For other types (array, object and null) edit the `api-tests.test.js` file manually.

## debug

I wasted time on setting up debug configurations. Here are the working debug configs for VS Code:

```JSON
{
    "version": "0.2.0",
    "configurations": [

        {
            "type": "node",
            "request": "launch",
            "name": "Launch Program with --route option",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "app.js",
            "cwd": "C:\\Users\\rcollins\\code\\gen",
            "args": [
                "--route", "1,100"
            ]
        }, {
            "type": "node",
            "request": "launch",
            "name": "Launch Program with --purge option",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "app.js",
            "cwd": "C:\\Users\\rcollins\\code\\gen",
            "args": [
                "--purge", ""
            ]
        },{
            "type": "node",
            "request": "launch",
            "name": "Launch Program with --scaffold option",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "app.js",
            "cwd": "C:\\Users\\rcollins\\code\\gen",
            "args": [
                "--scaffold", ""
            ]
        }
    ]
}
```

## API documentation

Summary documentation for each route is output to `/docs/API.docs.md`. The documentation includes `curl` commands for manually running the API calls.

## Post route generation editing

As a minimum, once a route is generated, the data access code will be modified to access your database rather than the route returning a mock response.

The API documenation should be modified to match the working code.

The test assertions should be modified to match the working code.

For example, if the route was had `POST` method with data passed in the request body with the route name of `/api/createuser`, the following files would be modified:

```
/gen-test2/db/createuser-post.db.js
/gen-test2/docs/API.docs.md
/gen-test2/api-tests.test.js
```

There is a full working sample at https://github.com/HamptonNorth/gen-test2. This include a SQL script to create and populate a `users` table for testing.

### Use pool or connections

As a general rule, use a pool connection except fot transactions based SQL. Here is an example of the generated code being changed to working code using a pooled connection.

As generated:

```javascript
// const pool = require('./db-pool.js')
// const sql = require('./db.js')
const userDb = (id) => {
  // let q = 'SELECT users.id, users.email, users.role FROM users WHERE id =  ?'
  // return sql
  // return pool
  //  .promise()
  //  .query(q, [id])
  //  .then(([rows]) => {
  //   return rows
  //  })
  let test = '{"status":"success","data":{"users":[{"id":7,"email":"jwilson@redmug.dev","role":"user"}]}}'
  return JSON.parse(test)
}
```

Working MySQL code with a pool connection:

```javascript
const pool = require('./db-pool.js')
const userDb = (id) => {
  let q = 'SELECT users.id, users.email, users.role FROM users WHERE id =  ?'
  return pool
    .promise()
    .query(q, [id])
    .then(([rows]) => {
      return rows
    })
}
```

### Layout of JSON responses

JSON server response follow the JSEND guidelines https://github.com/omniti-labs/jsend

<hr>

### To do

<small>

1.  Add middleware for user authentication as option
2.  Add logging of of API calls as option (use Cabin?)

</small>

<small>Working code is better than perfect code, and readable code is better than clever code.</small>
