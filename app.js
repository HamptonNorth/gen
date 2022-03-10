const dotenv = require('dotenv').config()
const fs = require('node:fs')

// process command line options

const skeleton = process.argv.indexOf('--skeleton') > -1 ? true : false
const route = process.argv.indexOf('--route') > -1 ? true : false
const docs = process.argv.indexOf('--docs') > -1 ? true : false
const help = process.argv.indexOf('--help') > -1 ? true : false
const version = process.argv.indexOf('--version') > -1 ? true : false

// must be one of skeleton, route, docs (flag set
if (!skeleton && !route && !docs && !help && !version) {
  console.log('ERROR - No valid command line options set.')
  commandLineHelp()
}

// Checks for --route and if it has a routeID [string] and routeID is valid
if (route) {
  const routeIndex = process.argv.indexOf('--route')
  let routeID

  if (routeIndex > -1) {
    // Retrieve the value after --custom
    routeID = process.argv[routeIndex + 1]
    if (typeof routeID === 'undefined') {
      console.log('ERROR - route option set but no route id provided', typeof routeID)
      process.exit(1)
    }

    let routeDetail
    getRouteDetail(routeID).then((r) => {
      console.log('route detail promise resolved')
    })
    // console.log('routeID', routeID, ' typeof:', typeof routeID, 'routeDetail', routeDetail)
  }
}

if (version) {
  const package_json = require('./package.json')
  console.log('version =', package_json.version)
  process.exit(1)
}
if (help) {
  commandLineHelp()
}

// const yargs = require('yargs/yargs')
// const { hideBin } = require('yargs/helpers')
// const argv = yargs(hideBin(process.argv))
//   .usage('Usage: $0 <command> [options]')
//   .option('skeleton', {
//     type: 'boolean',
//     description: 'Generate new skeleton:',
//   })
//   .parse()

//   if (
//         (argv.skeleton && argv.route) ||
//         (argv.skeleton && argv.docs) ||
//         (argv.route && argv.docs) ||
//         (argv.skeleton && argv.route && argv.docs)
//       ) {
//         console.log('argv:', argv)
//         return 'Only set one of --skeleton, --route, --docs'
//       }

// // .option('route', {
//   type: 'boolean',

//   description: 'Generate new route:',
// })
// .option('docs', {
//   type: 'boolean',

//   description: 'Generate API documenatation:',
// })

// .check((argv) => {
//   if (
//     (argv.skeleton && argv.route) ||
//     (argv.skeleton && argv.docs) ||
//     (argv.route && argv.docs) ||
//     (argv.skeleton && argv.route && argv.docs)
//   ) {
//     console.log('argv:', argv)
//     return 'Only set one of --skeleton, --route, --docs'
//   }
// })
// .parse()

const skeletonGeneration = require('./src/skeletonGeneration')
const getRoutesGeneration = require('./src/getRoutesGeneration')
const postRoutesGeneration = require('./src/postRoutesGeneration')
const { listeners } = require('node:process')

const port = process.env.PORT

const targetDir = process.env.APPDIR

let targetRoute = process.env.APPPATH + process.env.APPDIR

// console.log('targetRoute', targetRoute)

process.exit()

// if neither skeleton, routes or docs are set in command line then exit
// console.log('argv:', process.argv)
if (process.env.GENERATESKELETON) {
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


}
function commandLineHelp() {
  console.log('Select one from the following line options : \n')
  console.log('\t  --skeleton \t\t to generate directories and new boilerplate code')
  console.log(
    '\t  --route n  \t\t to add a route to an existing skeleton. The route is defined in configs/routes-config.json and n matches the route id'
  )
  console.log('\t  --docs     \t\t to generate the API documentation in markdown and HTML')
  console.log('\t  --help     \t\t to print this help')
  console.log('\t  --version  \t\t to print version')
  // console.log('\n')
  process.exit(1)
}
