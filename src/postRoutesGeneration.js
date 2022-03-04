const fs = require('node:fs')
const generatePost = async (routeName) => {
  let targetRootDir = process.env.APPPATH + process.env.APPDIR
  let route = routeName.toLowerCase()
  let routeLowerCase = route.toLowerCase()
  let routeWithCapital = route[0].toUpperCase() + route.substring(1)
  let expressRoute = routeName
  // the express route in /routes.index.js should include
  let expressRouteLowerCase = expressRoute.toLowerCase()
  // parameter pass type - body
  let parameterType = 'body'
  let method = 'POST'
  let message = ''

  let passedObjectKeys = parseObjectKeys(process.env.ROUTEREQUESTBODY, method)

  if (Object.keys(passedObjectKeys).length === 0) {
    console.log('ERROR - POST has empty body! Check the .env file setting')
    process.exit(1)
  }

  console.info(
    '\n----------------------------------------------\ntargetRootDir:',
    targetRootDir,
    '\n  route:',
    route,
    '\n  routeLowerCase:',
    routeLowerCase,
    '\n  routeWithCapital:',
    routeWithCapital,
    '\n  expressRoute:',
    expressRoute,
    '\n  expressRouteLowerCase:',
    expressRouteLowerCase,
    '\n  parameterType:',
    parameterType,
    '\n  passedObjectKeys:',
    passedObjectKeys,
    '\n----------------------------------------------\n'
  )
  console.log('Route generation - method: ', method, '  route: ', route, ' object keys : ', passedObjectKeys)

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
    let replace2 = `router.post('/${expressRouteLowerCase}', ${route}.post${routeWithCapital})
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

    let replace1 = `const ${route} = require('./${route}-post.controller') 
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
  //  Step 3 - controllers/route-post.controller.js file
  // ***
  let controllerConst = ` const { ${passedObjectKeys} } = req.body `

  let controllerJSCode =
    `const { ${route}Service } = require('../services')
  const { ${route}Post } = ${route}Service  
  //   calls other imported services here  
  const post${routeWithCapital} = async (req, res, next) => {
    
    try {
      // req.body used for POST
      ` +
    controllerConst +
    `    
     console.log("req.body:", req.body, "req.params:", req.params, "req.query:", req.query)
      const r = await ${route}Post(${passedObjectKeys})      
      res.send(r)  
      next()
    } catch (e) {
      console.log(e.message)
      res.sendStatus(500) && next(e)
    }
  }  
  module.exports = {
    post${routeWithCapital},
  }`
  let controllerFileName = targetRootDir + `/controllers/${route}-post.controller.js`

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

    let replace1 = `const ${route}Service = require('./${route}-post.service') 
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
  //  Step 5 - services/route-post.service.js file
  // ***

  let serviceJSCode = `const { ${route}Db } = require('../db')
  // any additional call to datastore here
  const ${route}Post = async (${passedObjectKeys}) => {
    try {
      return ${route}Db(${passedObjectKeys})
    } catch (e) {
      throw new Error(e.message)
    }
  }
  
  module.exports = {
    ${route}Post,
  }`
  let serviceFileName = targetRootDir + `/services/${route}-post.service.js`

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

    let replace1 = `const { ${route}Db } = require('./${route}-post.db') 
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
  let testResponse = '[{"result": "Okay"}]'
  if (process.env.ROUTETESTRESPONSE !== '') {
    testResponse = process.env.ROUTETESTRESPONSE
  }

  let dbPoolJSCode = `const pool = require('./db-pool.js')
  // const sql = require('./db.js')
  const ${route}Db = (${passedObjectKeys}) => {
    // MySQL example with passedObjectKey of id
    // use sql = require db.js and return sql for new connection (use with transaction)
    // let q = 'SELECT users.id, users.email, users.role FROM users WHERE id =  ?'
    // return sql
    // return pool
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
  let dbFileName = targetRootDir + `/db/${route}-post.db.js`

  fs.writeFile(dbFileName, dbPoolJSCode, (err) => {
    if (err) {
      console.log('error writing ' + dbFileName, err)
      return
    }
    // console.log('Generation step - ' + targetRootDir + '/db/index.js and ' + dbFileName + ' written successfully')
  })
  // **********************************************************
  //  Step 8 - tests/api-tests.test.js file
  // ***
  let testsJSCode = `
  
  describe('Test the ${expressRouteLowerCase} route', () => {
    test('Test /api/${routeLowerCase} emails include ??', async () => {
      const response = await request(app).get('/api/${expressRouteLowerCase}')
      // change these assertions to match API return
      expect(response.body[0].email).toEqual('someone@redmug.dev')
      expect(response.body[1].email).toEqual('support@redmug.dev')
      expect(response.statusCode).toBe(200)
    })
  })
  
  `

  fs.readFile(targetRootDir + `/tests/api-tests.test.js`, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `${testsJSCode} 
//@insert1`

    let result = data.replace(/\/\/@insert1/g, replace1)

    fs.writeFile(targetRootDir + `/tests/api-tests.test.js`, result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
}

function parseObjectKeys(s, method) {
  if (method === 'POST') {
    let body = JSON.parse(s)
    if (Object.keys(body).length === 0) {
      // use default if non provided
      body = JSON.parse(
        "[{display_name: 'Robert xxx Collins', email: 'rcollins@redmug.dev', client_id: 1, user_status: 0, last_login: '2022-02-02 00:00:00',role: 'superuser'}]"
      )
    }
    console.log('body: ', body, ' method: ', method, 'typeof body', typeof body)
    return Object.keys(body[0]).toString()
  } else {
    return ''
  }
}

module.exports = {
  generatePost,
}
