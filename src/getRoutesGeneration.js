const fs = require('node:fs')
const generateGet = async (routeName) => {
  let targetRootDir = process.env.APPPATH + process.env.APPDIR
  let route = routeName.toLowerCase()
  let routeLowerCase = route.toLowerCase()
  let routeWithCapital = route[0].toUpperCase() + route.substring(1)
  let expressRoute = routeName
  // the express route in /routes.index.js should include /: URL query parameter e.g /user/:id
  let expressRouteLowerCase = expressRoute.toLowerCase()
  // parameter pass type - none | url | querystring
  let parameterType = 'none'
  let method = 'GET'
  let message = ''

  let passedObjectKeys = ''

  // check for URL route parameter - anything after '/:'
  if (routeName.indexOf('/:') !== -1) {
    route = routeName.substring(0, routeName.indexOf('/:'))
    routeLowerCase = route.toLowerCase()
    routeWithCapital = route[0].toUpperCase() + route.substring(1)
    expressRoute = routeName
    expressRouteLowerCase = expressRoute.toLowerCase()
    parameterType = 'url'
    // the express route in /routes.index.js should include /: URL query parameter e.g /user/:id
    message = ' route parameter: ' + routeName.substring(routeName.indexOf('/:'))
    // build object keys to pass from controller layer to service and database layers
    // e.g route of /item/:branch/:bin gives object keys: branch, bin
    passedObjectKeys = parseObjectKeys(routeName.substring(routeName.indexOf('/:')), parameterType)
  }
  // check for URL query string paraneters
  if (routeName.indexOf('?') !== -1) {
    route = routeName.substring(0, routeName.indexOf('?'))
    routeLowerCase = route.toLowerCase()
    routeWithCapital = route[0].toUpperCase() + route.substring(1)
    expressRoute = route
    expressRouteLowerCase = expressRoute.toLowerCase()
    parameterType = 'queryString'
    message = ' URL query parameter: ' + routeName.substring(routeName.indexOf('?'))
    // build object keys to pass from controller layer to service and database layers
    // e.g route of /search?name=Jones&postcode=CH1 gives object keys: name, postcode
    passedObjectKeys = parseObjectKeys(routeName.substring(routeName.indexOf('?')), parameterType)
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

  // console.info(
  //   '\n----------------------------------------------\ntargetRootDir:',
  //   targetRootDir,
  //   '\n  route:',
  //   route,
  //   '\n  routeLowerCase:',
  //   routeLowerCase,
  //   '\n  routeWithCapital:',
  //   routeWithCapital,
  //   '\n  expressRoute:',
  //   expressRoute,
  //   '\n  expressRouteLowerCase:',
  //   expressRouteLowerCase,
  //   '\n  parameterType:',
  //   parameterType,
  //   '\n  passedObjectKeys:',
  //   passedObjectKeys,
  //   '\n----------------------------------------------\n'
  // )
  console.log('Route generation - method: ', method, '  route: ', route, message, ' object keys : ', passedObjectKeys)

  //  Step 1 - insert express route into routes/index.js

  fs.readFile(targetRootDir + '/routes/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    // check if route already exists

    if (data.indexOf('/' + expressRouteLowerCase) !== -1) {
      if (process.env.OVERWRITEROUTE !== 'YES') {
        console.log('ERROR - route exists and OVERWRITEROUTE not set to YES! Check the .env file setting')
        process.exit(1)
      }
    }

    let replace1 = `const {  ${routeLowerCase}  } = require('../controllers') 
//@insert1`
    let replace2 = `router.get('/${expressRouteLowerCase}', ${route}.get${routeWithCapital})
//@insert2`

    let result = data.replace(/\/\/@insert1/g, replace1)
    result = result.replace(/\/\/@insert2/g, replace2)

    fs.writeFileSync(targetRootDir + '/routes/index.js', result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })

  // **********************************************************
  //  Step 2 - insert route into controllers/index.js
  // ***

  fs.readFile(targetRootDir + '/controllers/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `const ${route} = require('./${route}-get.controller') 
//@insert1`
    let replace2 = `${route}, 
//@insert2`

    let result = data.replace(/\/\/@insert1/g, replace1)
    result = result.replace(/\/\/@insert2/g, replace2)

    fs.writeFile(targetRootDir + '/controllers/index.js', result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
  // **********************************************************
  //  Step 3 - controllers/route-get.controller.js file
  // ***
  let controllerConst = ''
  if (parameterType === 'url') {
    controllerConst = ` const { ${passedObjectKeys} } = req.params `
  } else if (parameterType === 'queryString') {
    controllerConst = ` const { ${passedObjectKeys} } = req.query `
  } else {
    controllerConst = ` const { ${passedObjectKeys} } = req.body `
  }

  let controllerJSCode =
    `const { ${route}Service } = require('../services')
  const { ${route}Get } = ${route}Service  
  //   calls other imported services here  
  const get${routeWithCapital} = async (req, res, next) => {
    
    try {
      // req.body ignored for GET
      ` +
    controllerConst +
    `    
    console.log("req.params:", req.params, "req.query:", req.query)
      const r = await ${route}Get(${passedObjectKeys})      
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
  let controllerFileName = targetRootDir + `/controllers/${route}-get.controller.js`

  fs.writeFile(controllerFileName, controllerJSCode, (err) => {
    if (err) {
      console.log('error writing ' + controllerFileName, err)
      return
    }
    // console.log(
    //   'Generation step - ' + targetRootDir + '/controller/index.js and ' + controllerFileName + ' written successfully'
    // )
  })

  // **********************************************************
  //  Step 4 - insert route into services/index.js
  // ***

  fs.readFile(targetRootDir + '/services/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `const ${route}Service = require('./${route}-get.service') 
//@insert1`
    let replace2 = `${route}Service, 
//@insert2`

    let result = data.replace(/\/\/@insert1/g, replace1)
    result = result.replace(/\/\/@insert2/g, replace2)

    fs.writeFile(targetRootDir + '/services/index.js', result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
  // **********************************************************
  //  Step 5 - services/route-get.service.js file
  // ***

  let serviceJSCode = `const { ${route}Db } = require('../db')
  // any additional call to datastore here
  const ${route}Get = async (${passedObjectKeys}) => {
    try {
      return ${route}Db(${passedObjectKeys})
    } catch (e) {
      throw new Error(e.message)
    }
  }
  
  module.exports = {
    ${route}Get,
  }`
  let serviceFileName = targetRootDir + `/services/${route}-get.service.js`

  fs.writeFile(serviceFileName, serviceJSCode, (err) => {
    if (err) {
      console.log('error writing ' + serviceFileName, err)
      return
    }
    // console.log(
    //   'Generation step - ' + targetRootDir + '/services/index.js and ' + serviceFileName + ' written successfully'
    // )
  })
  // **********************************************************
  //  Step 6 - insert route into db/index.js
  // ***

  fs.readFile(targetRootDir + '/db/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `const { ${route}Db } = require('./${route}-get.db') 
//@insert1`
    let replace2 = `${route}Db, 
//@insert2`

    let result = data.replace(/\/\/@insert1/g, replace1)
    result = result.replace(/\/\/@insert2/g, replace2)

    fs.writeFile(targetRootDir + '/db/index.js', result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
  // **********************************************************
  //  Step 7 - db/route-get.db.js file
  // ***
  let testResponse =
    '[{"id": 1,"email": "rcollins@redmug.co.uk","role": "superuser"}, {"id": 2,"email": "support@redmug.dev","role": "user"}]'
  if (process.env.ROUTETESTRESPONSE !== '') {
    testResponse = process.env.ROUTETESTRESPONSE
  }

  let dbJSCode = `const sql = require('./db.js')
  const ${route}Db = (${passedObjectKeys}) => {
    // MySQL example with passedObjectKey of id
    // let q = 'SELECT users.id, users.email, users.role FROM users WHERE id =  ?'
    // return sql
    //  .promise()
    //  .query(q [id])
    //  .then(([rows]) => {
    //    return rows
    //  }) 
    let test = '${testResponse}'
    return JSON.parse(test) 
  }  
  module.exports = {
    ${route}Db,
  }`
  let dbFileName = targetRootDir + `/db/${route}-get.db.js`

  fs.writeFile(dbFileName, dbJSCode, (err) => {
    if (err) {
      console.log('error writing ' + dbFileName, err)
      return
    }
    // console.log('Generation step - ' + targetRootDir + '/db/index.js and ' + dbFileName + ' written successfully')
    console.log('Route generation completed successfully')
  })
}

function parseObjectKeys(s, parameterType) {
  if (parameterType === 'url') {
    return s.substring(2).split('/:').join()
  } else if (parameterType === 'queryString') {
    let a = s.substring(1).split('&')
    for (let i = 0; i < a.length; i++) {
      a[i] = a[i].substring(0, a[i].indexOf('='))
    }
    return a.join()
  } else {
    return ''
  }
}

module.exports = {
  generateGet,
}
