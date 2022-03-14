const fs = require('node:fs')
const generateGet = async (thisRoute, gen) => {
  // console.log('In generateGet() ', thisRoute)
  let routeName = thisRoute.name
  let targetRootDir = gen.targetRoot
  let route = thisRoute.name.toLowerCase()
  let routeWithCapital = route[0].toUpperCase() + route.substring(1)

  // the express route in /routes.index.js should include /: URL query parameter e.g /user/:id
  // parameter pass type - none | url | querystring
  let parameterType = 'none'
  let message = ''
  let passedObjectKeys = ''

  // check for URL route parameter - anything after '/:'
  if (routeName.indexOf('/:') !== -1) {
    route = routeName.substring(0, routeName.indexOf('/:'))
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
  console.log('Route generation - id: ', thisRoute.id, 'method: ', thisRoute.method, 'route: ', route, message)

  // **********************************************************
  //  Step 1 - insert express route into routes/index.js
  // ***
  fs.readFile(targetRootDir + '/routes/index.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }
    // check if route already exists
    if (data.indexOf('/' + thisRoute.name.toLowerCase()) !== -1) {
      if (process.env.OVERWRITEROUTE !== 'YES') {
        console.log('ERROR - route exists and OVERWRITEROUTE not set to YES! Check the .env file setting')
        process.exit(1)
      }
    }

    let replace1 = `const {  ${route}  } = require('../controllers') 
//@insert1`
    let replace2 = `router.get('/${thisRoute.name.toLowerCase()}', ${route}.get${routeWithCapital})
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
    // console.log("req.body:", req.body, "req.params:", req.params, "req.query:", req.query)
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
    '{"status": "success",	"data": {"users": [{"id": 1,"email": "someone@redmug.dev", "role": "superuser"},{"id": 2,"email": "support@redmug.dev", "role": "user"}]}}'
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
  let dbFileName = targetRootDir + `/db/${route}-get.db.js`

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
  
  describe('Test the ${thisRoute.name.toLowerCase()} route', () => {
    test('Test /api/${route} emails include ??', async () => {
      const response = await request(app).get('/api/${thisRoute.name.toLowerCase()}')
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

  // **********************************************************
  //  Step 9 - docss/API.docs.md file
  // ***
  let fails = process.env.ROUTEFAILMESSAGES.split('|')
  let failsText = ''
  for (i = 0; i < fails.length; i++) {
    failsText += `
    {
      "status": "fail",
      "data": {
        "message": "${fails[i]}"
      }
    }`
  }
  let docsMDCode = `
  ## /api/adduser

>Description:  ${process.env.ROUTEDESCRIPTION}
\`\`\`Text
# thisRoute.method                      ${thisRoute.method}
# authentication              Y
# example                     ${thisRoute.name.toLowerCase()}
# parameters                  ${message.substring(1)}
# objectKeys                  ${passedObjectKeys}
\`\`\`
\`\`\`Text
# body                        none
\`\`\`
\`\`\`Text
# success response
${JSON.stringify(JSON.parse(testResponse), null, 4)}
\`\`\`
\`\`\`Text
# fail response examples(s)
${failsText}
\`\`\`
\`\`\`Text
# curl
curl  -X POST http://localhost:${process.env.PORT}/api/${thisRoute.name.toLowerCase()}
\`\`\`
> Notes:  ${process.env.ROUTENOTES}
<hr><style="page-break-after: always;"></style>
  
  `

  fs.readFile(targetRootDir + `/docs/API.docs.md`, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    let replace1 = `${docsMDCode} 
//@insert1`

    let result = data.replace(/\/\/@insert1/g, replace1)

    fs.writeFile(targetRootDir + `/docs/API.docs.md`, result, 'utf8', function (err) {
      if (err) return console.log(err)
    })
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
