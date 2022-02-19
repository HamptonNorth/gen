const { Console } = require('node:console')
const fs = require('node:fs')
const generateSkeleton = async (targetDir, targetRoot, port) => {
  // check target dir does not contain already server.js
  try {
    if (fs.existsSync(targetRoot + '/server.js')) {
      if (process.env.OVERWRITESKELETON !== 'YES') {
        console.log(targetRoot + ' - files already exist and overwrite not set! - script terminated')
        process.exit(1)
      }
    }
  } catch (err) {
    console.error(err)
  }

  // Create all directories ----------------------------------------------------------

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

  // Step 1 - generate server.js skeleton code ----------------------------------------------------------

  let serverJSCode = `const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const routes = require('./routes')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => res.send('Generated REST API app is working'))

app.use('/api', routes)

app.listen(${port}, () => console.log('Generated REST API server app listening on port ${port}'))

module.exports = {
  app,
}`

  fs.writeFileSync(targetRoot + '/server.js', serverJSCode, (err) => {
    if (err) {
      console.log('error writing ' + targetRoot + '/server.js', err)
      return
    }
    console.log('Generation step - ' + targetRoot + '/server.js' + ' written successfully')
  })

  // Step 2 - create skeleton code for routes/index.js ----------------------------------------------------------

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

  // Step 3 - create skeleton code for contollers/index.js ----------------------------------------------------------

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

  // Step 4 - create skeleton code for services/index.js ----------------------------------------------------------

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

  // Step 5 - create skeleton code for db/index.js ----------------------------------------------------------

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

  //  Step 6 - db config /configs/dbconfigs.js file ----------------------------------------------------------

  let dbConfigJSCode = ''
  if (process.env.DATABASEPROVIDER === 'MYSQL') {
    dbConfigJSCode = `module.exports = {
        HOST: '${process.env.DATABASEHOST}',
        USER: '${process.env.DATABASEUSER}',
        PASSWORD: 'set_password_here',
        DB: '${process.env.DATABASENAME}',
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

  // Step 7 - create db connection /db/db.js ----------------------------------------------------------

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
  if (error) throw error
  console.log('Successfully connected to the database:', dbConfig.DB)
})

module.exports = connection`

  //   write db.js
  fs.writeFileSync(folderNameDb + '/db.js', dbDbJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameDb + '/Db.js', err)
      return
    }
    console.log('Generation step - ' + folderNameDb + '/Db.js' + ' written successfully')
  })

  setTimeout(function () {
    console.log(
      'Generating skeleton files for app: /' +
        targetDir +
        ' completed successfully ------------------------------------'
    )
  }, 4000)
}

module.exports = {
  generateSkeleton,
}
