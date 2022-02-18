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

  // *************************************************
  // Step 1 - generate server.js skeleton code
  // ******

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

  fs.writeFile(targetRoot + '/server.js', serverJSCode, (err) => {
    if (err) {
      console.log('error writing ' + targetRoot + '/server.js', err)
      return
    }
    console.log('Generation step - ' + targetRoot + '/server.js' + ' written successfully')
  })

  // *************************************************
  // Step 2 - create routes directory and skeleton code for index.js
  // ******

  let routesIndexJSCode = `const express = require('express')
//@insert1
const router = express.Router()
//@insert2

module.exports = router`
  // create routes dir
  let folderNameRoutes = targetRoot + '/routes'
  try {
    if (!fs.existsSync(folderNameRoutes)) {
      fs.mkdirSync(folderNameRoutes)
    }
  } catch (err) {
    console.error(err)
  }
  //   write skeleton index.js
  fs.writeFile(folderNameRoutes + '/index.js', routesIndexJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameRoutes + '/index.js', err)
      return
    }
    console.log('Generation step - ' + folderNameRoutes + '/index.js' + ' written successfully')
  })

  // *************************************************
  // Step 3 - create controllers directory and skeleton code for index.js
  // ******

  let controllersIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`
  // create controllers dir
  let folderNameControllers = targetRoot + '/controllers'
  try {
    if (!fs.existsSync(folderNameControllers)) {
      fs.mkdirSync(folderNameControllers)
    }
  } catch (err) {
    console.error(err)
  }
  //   write skeleton index.js
  fs.writeFile(folderNameControllers + '/index.js', controllersIndexJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameControllers + '/index.js', err)
      return
    }
    console.log('Generation step - ' + folderNameControllers + '/index.js' + ' written successfully')
  })

  // *************************************************
  // Step 4 - create services directory and skeleton code for index.js
  // ******

  let servicesIndexJSCode = `
//@insert1

module.exports = {
    //@insert2    
  }`
  // create routes dir
  let folderNameSevices = targetRoot + '/services'
  try {
    if (!fs.existsSync(folderNameSevices)) {
      fs.mkdirSync(folderNameSevices)
    }
  } catch (err) {
    console.error(err)
  }
  //   write skeleton index.js
  fs.writeFile(folderNameSevices + '/index.js', servicesIndexJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameSevices + '/index.js', err)
      return
    }
    console.log('Generation step - ' + folderNameSevices + '/index.js' + ' written successfully')
  })

  // *************************************************
  // Step 5 - create db directory and skeleton code for index.js
  // ******

  let dbIndexJSCode = `
//@insert1

module.exports = {
    //@insert2
  }`
  // create routes dir
  let folderNameDb = targetRoot + '/db'
  try {
    if (!fs.existsSync(folderNameDb)) {
      fs.mkdirSync(folderNameDb)
    }
  } catch (err) {
    console.error(err)
  }
  //   write skeleton index.js
  fs.writeFile(folderNameDb + '/index.js', dbIndexJSCode, (err) => {
    if (err) {
      console.log('error writing ' + folderNameDb + '/index.js', err)
      return
    }
    console.log('Generation step - ' + folderNameDb + '/index.js' + ' written successfully')
  })

  // **********************************************************
  //  Step 6 - db config /configs/dbconfigs.js file
  // ***
  let dbConfigJSCode = `module.exports = {
    HOST: 'localhost',
    USER: 'root',
    PASSWORD: 'borland$$77',
    DB: 'redmugapi',
  }`
  let dbConfigFileName = targetRoot + `/configs/dbconfig.js`

  fs.writeFile(dbConfigFileName, dbConfigJSCode, (err) => {
    if (err) {
      console.log('error writing ' + dbConfigFileName, err)
      return
    }
    console.log('Generation step - ' + targetRoot + '/configs/dbconfigs.js  written successfully')
  })

  // *************************************************
  // Step 7 - create db connection /db/db.js
  // ******

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
  fs.writeFile(folderNameDb + '/db.js', dbDbJSCode, (err) => {
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
