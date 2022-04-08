import { singleReplace1, singleReplace2, readFile, writeFile } from '../utils/index.js'
import { doGenerateDocs } from './docsGeneration.js'
import { doGenerateTests } from './testsGeneration.js'

export const doGenerateRoute = async (thisRoute, gen) => {
  // console.log('In generateGet() ', thisRoute)
  let routeName = thisRoute.name
  let method = thisRoute.method
  let methodLowerCase = method.toLowerCase()
  let methodWithCapital = methodLowerCase[0].toUpperCase() + methodLowerCase.substring(1)
  let targetRootDir = gen.targetRoot
  let route = thisRoute.name.toLowerCase()
  let expressRoute = route

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
    passedObjectKeys = parseObjectKeys(method, routeName.substring(routeName.indexOf('/:')), parameterType)
  }

  // check for URL query string paraneters
  if (routeName.indexOf('?') !== -1) {
    route = routeName.substring(0, routeName.indexOf('?'))
    expressRoute = route
    parameterType = 'queryString'
    message = ' URL query parameter: ' + routeName.substring(routeName.indexOf('?'))
    // build object keys to pass from controller layer to service and database layers
    // e.g route of /search?name=Jones&postcode=CH1 gives object keys: name, postcode
    passedObjectKeys = parseObjectKeys(method, routeName.substring(routeName.indexOf('?')), parameterType)
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

  if (method === 'POST') {
    parameterType = 'postBody'
    // passedObjectKeys = parseObjectKeys(method, thisRoute.requestbody[0], parameterType)
    passedObjectKeys = Object.keys(thisRoute.requestbody[0]).join(', ')
    message = ' with POST body keys of: ' + passedObjectKeys
    console
      .log
      // 'thisRoute.requestbody[0]',
      // thisRoute.requestbody[0],
      // 'typeof: ',
      // typeof thisRoute.requestbody[0],
      // 'Object.keys(thisRoute.requestbody[0]): ',
      // Object.keys(thisRoute.requestbody[0]),

      // "Object.keys(thisRoute.requestbody[0]).join(', '): ",
      // Object.keys(thisRoute.requestbody[0]).join(', '),
      // 'passedObjectKeys:',
      // passedObjectKeys
      ()
  }
  let routeWithCapital = route[0].toUpperCase() + route.substring(1)

  console.log('Route - id: ', thisRoute.id, ' method:', thisRoute.method, ', route:', route, ', message:', message)
  // **************************************************************************************************

  // *** Step 1 - insert express route into routes/index.js *******************************************
  let routeReplacement1 = `const {  ${route}  } = require('../controllers')
//@insert1`
  let routeReplacement2 = `router.${methodLowerCase}('/${expressRoute.toLowerCase()}', ${route}.${methodLowerCase}${routeWithCapital})
//@insert2`

  let content = await readFile(targetRootDir + '/routes/index.js')
  // check if route already exists
  if (content.indexOf('/' + thisRoute.name.toLowerCase()) !== -1) {
    if (process.env.OVERWRITEROUTE !== 'YES') {
      console.log('ERROR - route exists and OVERWRITEROUTE not set to YES! Check the .env file setting')
      process.exit(1)
    }
  }
  let result1 = await singleReplace1(routeReplacement1, content)
  let result2 = await singleReplace2(routeReplacement2, result1)
  await writeFile(1, targetRootDir + '/routes/index.js', result2)

  // *** Step 2 - insert route into controllers/index.js***********************************************
  routeReplacement1 = `const ${route} = require('./${route}-${methodLowerCase}.controller') 
//@insert1`
  routeReplacement2 = `${route}, 
//@insert2`

  content = await readFile(targetRootDir + '/controllers/index.js')
  result1 = await singleReplace1(routeReplacement1, content)
  result2 = await singleReplace2(routeReplacement2, result1)
  await writeFile(2, targetRootDir + '/controllers/index.js', result2)

  // *** Step 3 - controllers/route-${methodLowerCase}.controller.js file *****************************
  let controllerConst = ''
  if (parameterType === 'url') {
    controllerConst = ` const { ${passedObjectKeys} } = req.params `
  } else if (parameterType === 'queryString') {
    controllerConst = ` const { ${passedObjectKeys} } = req.query `
  } else {
    controllerConst = ` const { ${passedObjectKeys} } = req.body `
  }
  // console.log('${passedObjectKeys}: ', controllerConst)
  let returnCode = 'res.status(200)'
  if (method === 'POST') {
    returnCode = 'res.status(201)'
  }
  let controllerJSCode = `const { ${route}Service } = require('../services')
  const { ${route}${methodWithCapital} } = ${route}Service  
  //   calls other imported services here  
  const ${methodLowerCase}${routeWithCapital} = async (req, res, next) => {    
    try {
      // req.body ignored for GET
    ${controllerConst}    
     console.log("In controller - req.body:", req.body, "req.params:", req.params, "req.query:", req.query)
      await ${route}${methodWithCapital}(${passedObjectKeys})  
      
      res.sendStatus(${returnCode})  
      next()
    } catch (e) {
      console.log(e.message)
      res.sendStatus(500) && next(e)
    }
  }  
  module.exports = {
    ${methodLowerCase}${routeWithCapital},
  }`
  let controllerFileName = targetRootDir + `/controllers/${route}-${methodLowerCase}.controller.js`
  await writeFile(3, controllerFileName, controllerJSCode)

  // *** Step 4 - insert route into services/index.js *************************************************
  routeReplacement1 = `const ${route}Service = require('./${route}-${methodLowerCase}.service') 
  //@insert1`
  routeReplacement2 = `${route}Service, 
  //@insert2`

  content = await readFile(targetRootDir + '/services/index.js')
  result1 = await singleReplace1(routeReplacement1, content)
  result2 = await singleReplace2(routeReplacement2, result1)
  await writeFile(4, targetRootDir + '/services/index.js', result2)

  // *** Step 5 - services/route-${methodLowerCase}.service.js file ***********************************
  let serviceJSCode = `const { ${route}Db } = require('../db')
  // any additional call to datastore here
  const ${route}${methodWithCapital} = async (${passedObjectKeys}) => {
    try {
      return await ${route}Db(${passedObjectKeys})
    } catch (e) {
      throw new Error(e.message)
    }
  }  
  module.exports = {
    ${route}${methodWithCapital},
  }`
  let serviceFileName = targetRootDir + `/services/${route}-${methodLowerCase}.service.js`
  await writeFile(5, serviceFileName, serviceJSCode)

  // *** Step 6 - insert route into db/index.js *******************************************************
  routeReplacement1 = `const { ${route}Db } = require('./${route}-${methodLowerCase}.db') 
  //@insert1`
  routeReplacement2 = `${route}Db, 
  //@insert2`
  content = await readFile(targetRootDir + '/db/index.js')
  result1 = await singleReplace1(routeReplacement1, content)
  result2 = await singleReplace2(routeReplacement2, result1)
  await writeFile(6, targetRootDir + '/db/index.js', result2)

  // *** Step 7 - db/route-${methodLowerCase}.db.js file **********************************************
  let testResponse =
    '{"status": "success",	"data": {"users": [{"id": 1,"email": "someone@redmug.dev", "role": "superuser"},{"id": 2,"email": "support@redmug.dev", "role": "user"}]}}'
  if (thisRoute.requestresponse !== '') {
    testResponse = JSON.stringify(thisRoute.requestresponse)
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
  let dbFileName = targetRootDir + `/db/${route}-${methodLowerCase}.db.js`
  await writeFile(7, dbFileName, dbPoolJSCode)

  // *** Step 8 - tests/api-tests.test.js file ********************************************************
  await doGenerateTests(8, thisRoute, targetRootDir)

  // *** Step 9 - docss/API.docs.md file **************************************************************
  await doGenerateDocs(9, thisRoute, message, passedObjectKeys, targetRootDir)

  function parseObjectKeys(method, s, parameterType) {
    console.log('in parseObjectKeys: ', method)
    if (parameterType === 'url') {
      return s.substring(2).split('/:').join()
    } else if (parameterType === 'queryString') {
      let a = s.substring(1).split('&')
      for (let i = 0; i < a.length; i++) {
        a[i] = a[i].substring(0, a[i].indexOf('='))
      }
      return a.join()
    } else if (parameterType === 'postBody') {
    } else {
      return ''
    }
  }
}
