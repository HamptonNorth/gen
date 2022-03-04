const dotenv = require('dotenv').config()
const fs = require('node:fs')

const skeletonGeneration = require('./src/skeletonGeneration')
const getRoutesGeneration = require('./src/getRoutesGeneration')
const postRoutesGeneration = require('./src/postRoutesGeneration')

const port = process.env.PORT

const targetDir = process.env.APPDIR

let targetRoot = process.env.APPPATH + process.env.APPDIR

if (process.env.GENERATESKELETON === 'YES') {
  console.log('Generating skeleton files for app: /' + targetDir)
  skeletonGeneration.generateSkeleton(targetDir, targetRoot, port)
} else {
  console.log('No skeleton generation - using existing skeleton for app: /' + targetDir)
}

let routeName = process.env.ROUTENAME
let routeMethod = process.env.ROUTEMETHOD
let routeRequestBody = process.env.ROUTEREQUESTBODY
let overwriteRoute = process.env.OVERWRITEROUTE

if (process.env.GENERATEROUTES === 'YES') {
  if (routeName === '') {
    console.log('ERROR - Route is empty! - check the .env file settings')
    process.exit(1)
  }
  if (routeMethod === 'GET') {
    getRoutesGeneration.generateGet(routeName, routeRequestBody, overwriteRoute)
  } else if (routeMethod === 'POST') {
    postRoutesGeneration.generatePost(routeName, routeRequestBody, overwriteRoute)
  } else if (routeMethod === 'PUT') {
  } else if (routeMethod === 'DELETE') {
  } else {
    console.log('ERROR - Route method not valid - check the .env file settings')
    process.exit(1)
  }
} else {
  console.log('No route generation set in .env')
}
