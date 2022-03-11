const fs = require('node:fs')
const generateSkeleton = async (gen) => {
  // console.log('gen:', gen)
  // check target dir does not contain already server.js
  try {
    if (fs.existsSync(gen.targetRoot + '/server.js')) {
      if (process.env.OVERWRITESKELETON !== 'YES' || !fs.existsSync(gen.targetRoot + '/routes')) {
        console.log(
          gen.targetRoot +
            ' - files already exist - set overwrite in .env and delete existing routes directory to generate new skeleton!'
        )
        process.exit(1)
      }
    }
  } catch (err) {
    console.error(err)
  }

  // Create all directories ----------------------------------------------------------

  for (let i = 0; i < gen.dirs.length; i++) {
    let path = gen.targetRoot + '/' + gen.dirs[i]
    try {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
      }
    } catch (err) {
      console.error(err)
    }
    console.log('   ' + gen.targetDir + '/' + gen.dirs[i] + ' created')
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
  fs.writeFileSync(gen.targetRoot + '/app.js', appJSCode, (err) => {
    if (err) {
      console.log('error writing ' + gen.targetRoot + '/app.js', err)
      return
    }
    console.log('Generation step - ' + gen.targetRoot + '/app.js' + ' written successfully')
  })

  // Step 2 - generate server.js skeleton code ----------------------------------------------------------

  let serverJSCode = `const app = require('./app')

app.listen(${gen.port}, () => {
  console.log('Generated REST API server app listening on port ${gen.port}')
})
`
  fs.writeFileSync(gen.targetRoot + '/server.js', serverJSCode, (err) => {
    if (err) {
      console.log('error writing ' + gen.targetRoot + '/server.js', err)
      return
    }
    console.log('Generation step - ' + gen.targetRoot + '/server.js' + ' written successfully')
  })

  // Step 3 - create skeleton code for routes/index.js ----------------------------------------------------------

  let routesIndexJSCode = `const express = require('express')
//@insert1
const router = express.Router()
//@insert2

module.exports = router`
  fs.writeFileSync(`${gen.targetRoot}/routes/index.js`, routesIndexJSCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/routes/index.js`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/routes/index.js written successfully`)
  })

  // Step 4 - create skeleton code for contollers/index.js ----------------------------------------------------------

  let controllersIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`

  fs.writeFileSync(`${gen.targetRoot}/controllers/index.js`, controllersIndexJSCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/controllers/index.js`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/controllers/index.js written successfully`)
  })

  // Step 5 - create skeleton code for services/index.js ----------------------------------------------------------

  let servicesIndexJSCode = `
//@insert1

module.exports = {
    //@insert2    
  }`

  //   write skeleton index.js
  fs.writeFileSync(`${gen.targetRoot}/services/index.js`, servicesIndexJSCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/services/index.js`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/services/index.js written successfully`)
  })

  // Step 6 - create skeleton code for db/index.js ----------------------------------------------------------

  let dbIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`

  fs.writeFileSync(`${gen.targetRoot}/db/index.js`, dbIndexJSCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/db/index.js`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/db/index.js written successfully`)
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

  fs.writeFileSync(`${gen.targetRoot}/configs/dbconfig.js`, dbConfigJSCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/configs/dbconfig.js`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/configs/dbconfig.js  written successfully`)
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
  fs.writeFileSync(`${gen.targetRoot}/db/db.js`, dbDbJSCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/db/db.js`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/db/db.js written successfully`)
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
  // console.log('folderNameDb', folderNameDb)
  //   write db.js
  fs.writeFileSync(`${gen.targetRoot}/db/db-pool.js`, dbPoolDbJSCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/db/db-pool.js`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/db/db-pool.js written successfully`)
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
  fs.writeFileSync(`${gen.targetRoot}/tests/api-tests.test.js`, testSkeletonJSCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/tests/api-tests.test.js`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/tests/api-tests.test.js written successfully`)
  })

  // Step 11 - create skeleton code for docs/api.docs.md ----------------------------------------------------------

  let docsMDCode = `# ${process.env.APPDIR} server.js API docs
  //TODO insert general description of server, API & database
  <br><br>
  //@insert1
  `
  fs.writeFileSync(`${gen.targetRoot}/docs/API.docs.md`, docsMDCode, (err) => {
    if (err) {
      console.log(`error writing ${gen.targetRoot}/docs/API.docs.md`, err)
      return
    }
    console.log(`Generation step - ${gen.targetRoot}/docs/API.docs.md written successfully`)
  })

  // Step 12 - Copy  routes-config-sample.json to routes-config.js
  if (process.env.CREATEROUTESCONFIGFROMSAMPLE === 'YES') {
    let routesConfigPath = `../${process.env.APPDIR}/configs/routes-config.json`

    fs.copyFile('./configs/routes-config-sample.json', routesConfigPath, (err) => {
      if (err) throw err
      console.log(`sample config file copied to /${process.env.APPDIR}/configs/routes-config.json`)
    })
  }

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
