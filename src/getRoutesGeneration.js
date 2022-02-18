const fs = require('node:fs')
const generateGet = async (routeName, routeRequestBody, overwriteRoute) => {
  let route = routeName.toLowerCase()
  let expressRoute = routeName

  let message = ''
  // check for route parameter - anything after '/:'
  if (routeName.indexOf('/:') !== -1) {
    route = routeName.substring(0, routeName.indexOf('/:'))
    expressRoute = routeName
    // the express route in /routes.index.js should include /: URL query parameter e.g /user/:id
    message = ' with route parameter of ' + routeName.substring(routeName.indexOf('/:'))
  }
  // check for URL query paraneters
  if (routeName.indexOf('?') !== -1) {
    route = routeName.substring(0, routeName.indexOf('?'))
    expressRoute = routeName.substring(0, routeName.indexOf('?'))
    message = ' with URL query parameter of ' + routeName.substring(routeName.indexOf('?'))
  }
  if (routeName.indexOf('/:') === -1 && routeName.indexOf('?') === -1) {
    message = ' with no route parameter or URL query parameter'
  }

  if (routeName.indexOf('/:') !== -1 && routeName.indexOf('?') !== -1) {
    console.log(
      'ERROR - route has both route parameter and URL query parameter - not supported! Check the .env file setting'
    )
    process.exit(1)
  }
  console.log('Route generation - method is GET and route is ', route, message)

  // **********************************************************
  //  Step 1 - insert express route into routes/index.js
  // ***
  let targetRoot = process.env.APPPATH + process.env.APPDIR
  // the express route in /routes.index.js should include /: URL query parameter e.g /user/:id
  let expressRouteLowerCase = expressRoute.toLowerCase()
  let routeLowerCase = route.toLowerCase()
  let routeWithCapital = route[0].toUpperCase() + route.substring(1)
  // console.log('routeLowerCase', routeLowerCase, '  routeWithCapital ', routeWithCapital)
  fs.readFile(targetRoot + '/routes/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `const {  ${routeLowerCase}  } = require('../controllers') 
//@insert1`
    let replace2 = `router.get('/${expressRouteLowerCase}', ${route}.get${routeWithCapital})
//@insert2`

    let result = data.replace(/\/\/@insert1/g, replace1)
    result = result.replace(/\/\/@insert2/g, replace2)

    fs.writeFileSync(targetRoot + '/routes/index.js', result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })

  // **********************************************************
  //  Step 2 - insert route into controllers/index.js
  // ***

  fs.readFile(targetRoot + '/controllers/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `const ${route} = require('./${route}-get.controller') 
//@insert1`
    let replace2 = `${route}, 
//@insert2`

    let result = data.replace(/\/\/@insert1/g, replace1)
    result = result.replace(/\/\/@insert2/g, replace2)

    fs.writeFile(targetRoot + '/controllers/index.js', result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
  // **********************************************************
  //  Step 3 - controllers/route-get.controller.js file
  // ***

  let controllerJSCode = `const { ${route}Service } = require('../services')
  const { ${route}Get } = ${route}Service  
  //   calls other imported services here  
  const get${routeWithCapital} = async (req, res, next) => {
    const {  } = req.body
    try {
      const r = await ${route}Get()      
      res.send(r)  
      next()
    } catch (e) {
      console.log(e.message)
      res.sendStatus(500) && next(e)
    }
  }  
  module.exports = {
    get${routeWithCapital},
  }`
  let controllerFileName = targetRoot + `/controllers/${route}-get.controller.js`

  fs.writeFile(controllerFileName, controllerJSCode, (err) => {
    if (err) {
      console.log('error writing ' + controllerFileName, err)
      return
    }
    // console.log(
    //   'Generation step - ' + targetRoot + '/controller/index.js and ' + controllerFileName + ' written successfully'
    // )
  })

  // **********************************************************
  //  Step 4 - insert route into services/index.js
  // ***

  fs.readFile(targetRoot + '/services/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `const ${route}Service = require('./${route}-get.service') 
//@insert1`
    let replace2 = `${route}Service, 
//@insert2`

    let result = data.replace(/\/\/@insert1/g, replace1)
    result = result.replace(/\/\/@insert2/g, replace2)

    fs.writeFile(targetRoot + '/services/index.js', result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
  // **********************************************************
  //  Step 5 - services/route-get.service.js file
  // ***

  let serviceJSCode = `const { ${route}Db } = require('../db')
  // any additional call to datastore here
  const ${route}Get = async (user, content) => {
    try {
      return ${route}Db(user, content)
    } catch (e) {
      throw new Error(e.message)
    }
  }
  
  module.exports = {
    ${route}Get,
  }`
  let serviceFileName = targetRoot + `/services/${route}-get.service.js`

  fs.writeFile(serviceFileName, serviceJSCode, (err) => {
    if (err) {
      console.log('error writing ' + serviceFileName, err)
      return
    }
    // console.log(
    //   'Generation step - ' + targetRoot + '/services/index.js and ' + serviceFileName + ' written successfully'
    // )
  })
  // **********************************************************
  //  Step 6 - insert route into db/index.js
  // ***

  fs.readFile(targetRoot + '/db/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `const { ${route}Db } = require('./${route}-get.db') 
//@insert1`
    let replace2 = `${route}Db, 
//@insert2`

    let result = data.replace(/\/\/@insert1/g, replace1)
    result = result.replace(/\/\/@insert2/g, replace2)

    fs.writeFile(targetRoot + '/db/index.js', result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
  // **********************************************************
  //  Step 7 - db/route-get.db.js file
  // ***

  let dbJSCode = `const sql = require('./db.js')
  const ${route}Db = () => {
    // sample working sql example
    // let q = 'SELECT users.id, users.email, users.role FROM users '
    // return sql
    //  .promise()
    //  .query(q)
    //  .then(([rows]) => {
    //    return rows
    //  }) 
    let test = '[{"id": 1,"email": "rcollins@redmug.co.uk","role": "superuser"}, {"id": 2,"email": "support@redmug.dev","role": "user"}]'
    return JSON.parse(test) 
  }  
  module.exports = {
    ${route}Db,
  }`
  let dbFileName = targetRoot + `/db/${route}-get.db.js`

  fs.writeFile(dbFileName, dbJSCode, (err) => {
    if (err) {
      console.log('error writing ' + dbFileName, err)
      return
    }
    // console.log('Generation step - ' + targetRoot + '/db/index.js and ' + dbFileName + ' written successfully')
  })
  // **********************************************************
  //  Step 8 - db connection /db/db.js file
  // ***
  let dbConnectJSCode = `const mysql = require('mysql2')
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
  let dbConnectFileName = targetRoot + `/db/db.js`

  fs.writeFile(dbConnectFileName, dbConnectJSCode, (err) => {
    if (err) {
      console.log('error writing ' + dbConnectFileName, err)
      return
    }
    // console.log('Generation step - ' + targetRoot + '/db/db.js  written successfully')
  })
  console.log('Route generation completed successfully')
}

module.exports = {
  generateGet,
}
