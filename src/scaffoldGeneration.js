import * as fs from 'fs/promises'
import { existsSync } from 'fs'
export const doGenerateScaffold = async (gen) => {
  // console.log('gen:', gen)

  if (existsSync(gen.targetRoot + '/app.js')) {
    console.log('app.js exists. Use --purge first before scaffolding new project')
    process.exit(1)
  }

  // Create all directories ----------------------------------------------------------
  for (let i = 0; i < gen.dirs.length; i++) {
    let path = gen.targetRoot + '/' + gen.dirs[i]

    await fs.mkdir(path),
      (err) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
      }
    console.log(' ' + gen.targetDir + '/' + gen.dirs[i] + ' directory created')
  }

  // Step 1 - generate app.js skeleton code ----------------------------------------------------------
  let appJSCode = `const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const routes = require('./routes')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.get('/', (req, res) => res.status(200).send('Generated REST API app is working'))
app.use('/api', routes)

module.exports =  app
`
  await scaffoldWriteFile(1, gen.targetRoot + '/app.js', appJSCode)

  // Step 2 - generate server.js skeleton code ----------------------------------------------------------
  process.exitCode = 1
  let serverJSCode = `const app = require('./app')

app.listen(${gen.port}, () => {
  console.log('Generated REST API server app listening on port ${gen.port}')
})
`
  await scaffoldWriteFile(2, gen.targetRoot + '/server.js', serverJSCode)

  // Step 3 - create skeleton code for routes/index.js ----------------------------------------------------------
  let routesIndexJSCode = `const express = require('express')
//@insert1
const router = express.Router()
//@insert2

module.exports = router`
  scaffoldWriteFile(3, gen.targetRoot + '/routes/index.js', routesIndexJSCode)

  // Step 4 - create skeleton code for contollers/index.js ----------------------------------------------------------
  let controllersIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`
  await scaffoldWriteFile(4, gen.targetRoot + '/controllers.index.js', controllersIndexJSCode)

  // Step 5 - create skeleton code for services/index.js ----------------------------------------------------------
  let servicesIndexJSCode = `
//@insert1

module.exports = {
    //@insert2    
  }`
  await scaffoldWriteFile(5, gen.targetRoot + '/services/index.js', servicesIndexJSCode)

  // Step 6 - create skeleton code for db/index.js ----------------------------------------------------------
  let dbIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`
  scaffoldWriteFile(6, gen.targetRoot + '/db/index.js', dbIndexJSCode)

  //  Step 7 - db config /configs/dbconfigs.js file ----------------------------------------------------------
  let dbConfigJSCode = ''
  if (process.env.DATABASEPROVIDER === 'MYSQL') {
    dbConfigJSCode = `module.exports = {
        HOST: '${process.env.DATABASEHOST}',
        USER: '${process.env.DATABASEUSER}',
        PASSWORD: 'set_password_here',
        DB: '${process.env.DATABASENAME}',
        WAITFORCONNECTIONS: '${process.env.DATABASEWAITFORCONNECTIONS}',
        CONNECTIONLIMIT: '${process.env.DATABASECONNECTIONLIMIT}',
        QUEUELIMIT:'${process.env.DATABASEQUEUELIMIT}',
        
      }
      `
  } else {
    console.log('ERROR - invalid DB provider! - Check the .env file setting ')
  }
  await scaffoldWriteFile(7, gen.targetRoot + '/configs/dbconfig.js', dbConfigJSCode)

  // Step 8 - create individual db connection /db/db.js ----------------------------------------------------------
  let dbDbJSCode = `
const mysql = require('mysql2')
const dbConfig = require('../configs/dbconfig.js')

// Create a connection to the database
const connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
})

// open the MySQL connection
connection.connect((error) => {
  if (error) {
    console.log('******** Error connecting to MySQL single connection ', error.sqlMessage, ' ********')
    console.log('    **** Reminder - MySQL setting in file /configs/db.js')
  } else {
  console.log('Successfully connected to the database (new connection):', dbConfig.DB)
  }
})

module.exports = connection
`
  await scaffoldWriteFile(8, gen.targetRoot + '/db/db.js', dbDbJSCode)

  // Step 9 - create pooled db connection /db/db-pool.js ----------------------------------------------------------
  let dbPoolDbJSCode = `
 const mysql = require('mysql2')
 const dbConfig = require('../configs/dbconfig.js')
 
 // Create a connection to the database
 const pool = mysql.createPool({
   host: dbConfig.HOST,
   user: dbConfig.USER,
   password: dbConfig.PASSWORD,
   database: dbConfig.DB,
   waitForConnections: dbConfig.WAITFORCONNECTIONS,
  connectionLimit: dbConfig.CONNECTIONLIMIT,
  queueLimit: dbConfig.QUEUELIMIT,
 })
 
 // open the MySQL pool 
 pool.getConnection((error, connection) => {
   if (error) {
     console.log('******** Error connecting to MySQL ', error.sqlMessage, ' ********')
     console.log('    **** Reminder - MySQL setting in file /configs/db.js')
   } else {
    pool.releaseConnection(connection)
   console.log('Successfully connected to the database (connection pool):', dbConfig.DB)
   }
 })
 
 module.exports = pool
 `
  await scaffoldWriteFile(9, gen.targetRoot + '/db/db-pool.js', dbPoolDbJSCode)

  // Step 10 - create skeleton code for api-tests.test.js ----------------------------------------------------------
  let testScaffoldJSCode = `
  const request = require('supertest')
  const app = require('../app')
  const pool = require('../db/db-pool')

    beforeAll(() => {})

    //@insert1

  afterAll(() => {
  pool.end()
  })
`
  scaffoldWriteFile(10, gen.targetRoot + '/tests/api-tests.test.js', testScaffoldJSCode)

  // Step 11 - create skeleton code for docs/api.docs.md ----------------------------------------------------------
  let docsMDCode = `# ${process.env.APPDIR} server.js API docs
  //TODO insert general description of server, API & database
  <br><br>
  //@insert1
  `
  await scaffoldWriteFile(11, gen.targetRoot + '/docs/API.docs.md', docsMDCode)

  // Step 12 - Copy  routes-config-sample.json to routes-config.js (in both /gen and /APPDIR)
  if (process.env.CREATEROUTESCONFIGFROMSAMPLE === 'YES') {
    let routesConfigPath = `../${process.env.APPDIR}/configs/routes-config.json`
    await fs.copyFile('./configs/routes-config-sample.json', routesConfigPath, 0)
    routesConfigPath = `../gen/configs/routes-config.json`
    await fs.copyFile('./configs/routes-config-sample.json', routesConfigPath, 0)
    console.log('Generation step 12 - ' + gen.targetRoot + '/configs/routes-config.json' + ' written successfully')
  }
  setTimeout(function () {
    console.log(
      '\nGenerating skeleton files for app: /' +
        gen.targetDir +
        ' completed successfully ------------------------------------'
    )
  }, 200)
}

let scaffoldWriteFile = async (step, fullPath, content) => {
  try {
    await fs.writeFile(fullPath, content)
    console.log(`Generation step ${step} -  ${fullPath} written successfully`)
  } catch (err) {
    console.log(`error writing ' + ${fullPath}`, err)
  }
}
