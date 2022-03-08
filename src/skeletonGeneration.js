const { Console } = require('node:console')
const fs = require('node:fs')
const generateSkeleton = async (targetDir, targetRoot, port) => {
  // check target dir does not contain already server.js
  try {
    if (fs.existsSync(targetRoot + '/server.js')) {
      if (process.env.OVERWRITESKELETON !== 'YES' || !fs.existsSync(folderNameRoutes)) {
        console.log(
          targetRoot +
            ' - files already exist - set overwrite in .env and delete existing routes directory to generate new skeleton!'
        )
        process.exit(1)
      }
    }
  } catch (err) {
    console.error(err)
  }

  // Create all directories ----------------------------------------------------------

  // create tests dir
  let folderNameTests = targetRoot + '/tests'
  try {
    if (!fs.existsSync(folderNameTests)) {
      fs.mkdirSync(folderNameTests)
    }
  } catch (err) {
    console.error(err)
  }

  // create docs dir
  let folderNameDocs = targetRoot + '/docs'
  try {
    if (!fs.existsSync(folderNameDocs)) {
      fs.mkdirSync(folderNameDocs)
    }
  } catch (err) {
    console.error(err)
  }

  // create routes dir
  let folderNameRoutes = targetRoot + '/routes'
  try {
    if (!fs.existsSync(folderNameRoutes)) {
      fs.mkdirSync(folderNameRoutes)
    }
  } catch (err) {
    console.error(err)
  }
  // create controllers dir
  let folderNameControllers = targetRoot + '/controllers'
  try {
    if (!fs.existsSync(folderNameControllers)) {
      fs.mkdirSync(folderNameControllers)
    }
  } catch (err) {
    console.error(err)
  }

  // create services dir
  let folderNameSevices = targetRoot + '/services'
  try {
    if (!fs.existsSync(folderNameSevices)) {
      fs.mkdirSync(folderNameSevices)
    }
  } catch (err) {
    console.error(err)
  }
  // create db dir
  let folderNameDb = targetRoot + '/db'
  try {
    if (!fs.existsSync(folderNameDb)) {
      fs.mkdirSync(folderNameDb)
    }
  } catch (err) {
    console.error(err)
  }

  // create configs directory
  let folderNameConfigs = targetRoot + '/configs'
  try {
    if (!fs.existsSync(folderNameConfigs)) {
      fs.mkdirSync(folderNameConfigs)
    }
  } catch (err) {
    console.error(err)
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

  fs.writeFileSync(targetRoot + '/app.js', appJSCode, (err) => {
    if (err) {
      console.log('error writing ' + targetRoot + '/app.js', err)
      return
    }
    console.log('Generation step - ' + targetRoot + '/app.js' + ' written successfully')
  })

  // Step 2 - generate server.js skeleton code ----------------------------------------------------------

  let serverJSCode = `const app = require('./app')

app.listen(${port}, () => {
  console.log('Generated REST API server app listening on port ${port}')
})
`
  fs.writeFileSync(targetRoot + '/server.js', serverJSCode, (err) => {
    if (err) {
      console.log('error writing ' + targetRoot + '/server.js', err)
      return
    }
    console.log('Generation step - ' + targetRoot + '/server.js' + ' written successfully')
  })

  // Step 3 - create skeleton code for routes/index.js ----------------------------------------------------------

  let routesIndexJSCode = `const express = require('express')
//@insert1
const router = express.Router()
//@insert2

module.exports = router`
  fs.writeFileSync(folderNameRoutes + '/index.js', routesIndexJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameRoutes + '/index.js', err)
      return
    }
    console.log('Generation step - ' + folderNameRoutes + '/index.js' + ' written successfully')
  })

  // Step 4 - create skeleton code for contollers/index.js ----------------------------------------------------------

  let controllersIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`

  fs.writeFileSync(folderNameControllers + '/index.js', controllersIndexJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameControllers + '/index.js', err)
      return
    }
    console.log('Generation step - ' + folderNameControllers + '/index.js' + ' written successfully')
  })

  // Step 5 - create skeleton code for services/index.js ----------------------------------------------------------

  let servicesIndexJSCode = `
//@insert1

module.exports = {
    //@insert2    
  }`

  //   write skeleton index.js
  fs.writeFileSync(folderNameSevices + '/index.js', servicesIndexJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameSevices + '/index.js', err)
      return
    }
    console.log('Generation step - ' + folderNameSevices + '/index.js' + ' written successfully')
  })

  // Step 6 - create skeleton code for db/index.js ----------------------------------------------------------

  let dbIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`

  fs.writeFileSync(folderNameDb + '/index.js', dbIndexJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameDb + '/index.js', err)
      return
    }
    console.log('Generation step - ' + folderNameDb + '/index.js' + ' written successfully')
  })

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
  let dbConfigFileName = targetRoot + `/configs/dbconfig.js`

  fs.writeFileSync(dbConfigFileName, dbConfigJSCode, (err) => {
    if (err) {
      console.log('error writing ' + dbConfigFileName, err)
      return
    }
    console.log('Generation step - ' + targetRoot + '/configs/dbconfigs.js  written successfully')
  })

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

  //   write db.js
  fs.writeFileSync(folderNameDb + '/db.js', dbDbJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameDb + '/Db.js', err)
      return
    }
    console.log('Generation step - ' + folderNameDb + '/Db.js' + ' written successfully')
  })

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
  console.log('folderNameDb', folderNameDb)
  //   write db.js
  fs.writeFileSync(folderNameDb + '/db-pool.js', dbPoolDbJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameDb + '/Db-pool.js', err)
      return
    }
    console.log('Generation step - ' + folderNameDb + '/Db-pool.js' + ' written successfully')
  })

  // Step 10 - create skeleton code for api-tests.test.js ----------------------------------------------------------

  let testSkeletonJSCode = `
  const request = require('supertest')
  const app = require('../app')
  const pool = require('../db/db-pool')

    beforeAll(() => {})

    //@insert1

  afterAll(() => {
  pool.end()
  })
`
  fs.writeFileSync(folderNameTests + '/api-tests.test.js', testSkeletonJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameTests + '/api-tests.test.js', err)
      return
    }
    console.log('Generation step - ' + folderNameTests + '/api-tests.test.js' + ' written successfully')
  })

  // Step 11 - create skeleton code for docs/api.docs.md ----------------------------------------------------------

  let docsMDCode = `# ${process.env.APPDIR} server.js API docs
  //TODO insert general description of server, API & database
  <br><br>
  //@insert1
  `
  fs.writeFileSync(folderNameDocs + '/API.docs.md', docsMDCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameDocs + '/API.docs.md', err)
      return
    }
    console.log('Generation step - ' + folderNameDocs + '/API.docs.md' + ' written successfully')
  })

  setTimeout(function () {
    console.log(
      'Generating skeleton files for app: /' +
        targetDir +
        ' completed successfully ------------------------------------'
    )
  }, 2000)
}

module.exports = {
  generateSkeleton,
}
