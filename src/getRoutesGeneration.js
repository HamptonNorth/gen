// import * as fs from 'fs/promises'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
export const doGenerateGet = async (thisRoute, gen) => {
  // console.log('In generateGet() ', thisRoute)
  let routeName = thisRoute.name
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
    passedObjectKeys = parseObjectKeys(routeName.substring(routeName.indexOf('/:')), parameterType)
  }

  // check for URL query string paraneters
  if (routeName.indexOf('?') !== -1) {
    route = routeName.substring(0, routeName.indexOf('?'))
    expressRoute = route
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
  let routeWithCapital = route[0].toUpperCase() + route.substring(1)

  console.log(
    'Route generation - id: ',
    thisRoute.id,
    ' method:',
    thisRoute.method,
    ', route:',
    route,
    ', routewithCapital:',
    routeWithCapital,
    ', message:',
    message
  )

  // **********************************************************
  //  Step 1 - insert express route into routes/index.js
  // ***
  let routeReplacement1 = `const {  ${route}  } = require('../controllers')
//@insert1`
  let routeReplacement2 = `router.get('/${expressRoute.toLowerCase()}', ${route}.get${routeWithCapital})
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

  // await writeFile(1, targetRootDir + '/routes/index.js', content.replace(/\/\/@insert/g, replace))

  // **********************************************************
  //  Step 2 - insert route into controllers/index.js
  // ***
  routeReplacement1 = `const ${route} = require('./${route}-get.controller') 
//@insert1`
  routeReplacement2 = `${route}, 
//@insert2`

  content = await readFile(targetRootDir + '/controllers/index.js')
  result1 = await singleReplace1(routeReplacement1, content)
  result2 = await singleReplace2(routeReplacement2, result1)
  await writeFile(2, targetRootDir + '/controllers/index.js', result2)

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
  let controllerJSCode = `const { ${route}Service } = require('../services')
  const { ${route}Get } = ${route}Service  
  //   calls other imported services here  
  const get${routeWithCapital} = async (req, res, next) => {    
    try {
      // req.body ignored for GET
    ${controllerConst}    
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
  await writeFile(3, controllerFileName, controllerJSCode)

  // **********************************************************
  //  Step 4 - insert route into services/index.js
  // ***
  routeReplacement1 = `const ${route}Service = require('./${route}-get.service') 
  //@insert1`
  routeReplacement2 = `${route}Service, 
  //@insert2`

  content = await readFile(targetRootDir + '/services/index.js')
  result1 = await singleReplace1(routeReplacement1, content)
  result2 = await singleReplace2(routeReplacement2, result1)
  await writeFile(4, targetRootDir + '/services/index.js', result2)

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
  await writeFile(5, serviceFileName, serviceJSCode)

  // **********************************************************
  //  Step 6 - insert route into db/index.js
  // ***
  routeReplacement1 = `const { ${route}Db } = require('./${route}-get.db') 
  //@insert1`
  routeReplacement2 = `${route}Db, 
  //@insert2`
  content = await readFile(targetRootDir + '/db/index.js')
  result1 = await singleReplace1(routeReplacement1, content)
  result2 = await singleReplace2(routeReplacement2, result1)
  await writeFile(6, targetRootDir + '/db/index.js', result2)

  // **********************************************************
  //  Step 7 - db/route-get.db.js file
  // ***
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
  let dbFileName = targetRootDir + `/db/${route}-get.db.js`
  await writeFile(7, dbFileName, dbPoolJSCode)

  // **********************************************************
  //  Step 8 - tests/api-tests.test.js file
  // ***
  // assumes testmatches string of format users[0].email (array/offset/field)
  // build array of match tests for this route from config

  let arr = thisRoute.testmatches.substring(0, thisRoute.testmatches.indexOf('['))
  let tests = thisRoute.testmatches.split('|')
  let matchStr = ''

  for (let i = 0; i < tests.length; i++) {
    let arrIndex = 0
    // if (tests.length > 1) {
    arrIndex = parseInt(tests[i].substring(tests[i].indexOf('[') + 1, tests[i].indexOf(']')))
    // }
    let objKey = tests[i].substring(tests[i].lastIndexOf('.') + 1)
    let obj = thisRoute.requestresponse.data[arr]
    let innerObj = obj[arrIndex]
    // if (tests.length > 1) {
    //   innerObj = obj[arrIndex]
    // }
    // let innerObj = obj[arrIndex]
    let match = innerObj[objKey]

    matchStr += `expect(response.body.data.${arr}[${arrIndex}].${objKey}).toEqual('${match}')\n`
  }

  let testsJSCode = `
  
  describe('Test the ${thisRoute.name.toLowerCase()} route', () => {
    test('Test /api/${route} emails include ??', async () => {
      const response = await request(app).get('/api/${thisRoute.name.toLowerCase()}')
      // change these assertions to match API return
      ${matchStr}
      expect(response.statusCode).toBe(200)
    })
  })
  
  `
  routeReplacement1 = `${testsJSCode} 
//@insert1`
  content = await readFile(targetRootDir + '/tests/api-tests.test.js')
  result1 = await singleReplace1(routeReplacement1, content)

  await writeFile(8, targetRootDir + '/tests/api-tests.test.js', result1)

  // **********************************************************
  //  Step 9 - docss/API.docs.md file
  // ***

  let fails = thisRoute.failmessages.split('|')
  let failsText = ''
  for (let i = 0; i < fails.length; i++) {
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

>Description:  ${thisRoute.description}
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

\`\`\`
\`\`\`Text
# fail response examples(s)
${failsText}
\`\`\`
\`\`\`Text
# curl
curl  -X POST http://localhost:${process.env.PORT}/api/${thisRoute.name.toLowerCase()}
\`\`\`
> Notes:  ${thisRoute.notes}
<hr><style="page-break-after: always;"></style>
  
  `
  routeReplacement1 = `${docsMDCode} 
//@insert1`
  content = await readFile(targetRootDir + '/docs/API.docs.md')
  result1 = await singleReplace1(routeReplacement1, content)

  await writeFile(8, targetRootDir + '/docs/API.docs.md', result1)
}
let singleReplace1 = async (routeReplacement1, content) => {
  try {
    return content.replace(/\/\/@insert1/, routeReplacement1)
  } catch (err) {
    console.log('Error in singleReplace1()', err)
  }
}
let singleReplace2 = async (routeReplacement2, res) => {
  try {
    return res.replace(/\/\/@insert2/, routeReplacement2)
  } catch (err) {
    console.log('Error in singleReplace2()', err)
  }
}
let readFile = async (fullPath) => {
  try {
    const data = await fs.readFile(fullPath, 'utf8')
    return data
  } catch (err) {
    console.log(`error reading ' + ${fullPath}`, err)
  }
}

let writeFile = async (step, fullPath, content) => {
  try {
    await fs.writeFile(fullPath, content)
    return
    // console.log(`Generation step ${step} -  ${fullPath} written successfully`)
  } catch (err) {
    console.log(`error writing ' + ${fullPath}`, err)
  }
}

// async function replaceAsync(str, regex, asyncFn) {
//   const promises = []
//   str.replace(regex, (match, ...args) => {
//     const promise = asyncFn(match, ...args)
//     promises.push(promise)
//   })
//   const data = await Promise.all(promises)
//   return str.replace(regex, () => data.shift())
// }

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

// module.exports = {
//   doGenerateGet,
// }
