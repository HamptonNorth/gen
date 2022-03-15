const dotenv = require('dotenv').config()
const fs = require('node:fs')

// for (let z = 0; z < 6; z++) {
//   console.log('args ', z, process.argv[z], typeof process.argv[z])
// }

const setup = require('./src/setup')
const skeletonGeneration = require('./src/skeletonGeneration')
const getRoutesGeneration = require('./src/getRoutesGeneration')
const postRoutesGeneration = require('./src/postRoutesGeneration')
const { exit } = require('node:process')

// process command line options

const skeleton = process.argv.indexOf('--skeleton') > -1 ? true : false
const route = process.argv.indexOf('--route') > -1 ? true : false
const docs = process.argv.indexOf('--docs') > -1 ? true : false
const help = process.argv.indexOf('--help') > -1 ? true : false
const version = process.argv.indexOf('--version') > -1 ? true : false
const purge = process.argv.indexOf('--purge') > -1 ? true : false

// must be one of skeleton, route, docs, help or version
if (!skeleton && !route && !docs && !help && !version && !purge) {
  commandLineHelp('no option set or option is invalid')
}

let gen = {}

gen.port = process.env.PORT
gen.targetDir = process.env.APPDIR
gen.targetRoot = process.env.APPPATH + process.env.APPDIR
gen.dirs = ['configs', 'controllers', 'db', 'docs', 'routes', 'services', 'tests']

if (purge) {
  console.log('Deleting all existing directories and content: ')
  setup.purge(gen)
  exit(1)
}

if (skeleton) {
  console.log('Generating skeleton files for app: /' + gen.targetDir)
  skeletonGeneration.generateSkeleton(gen)
}

if (docs) {
  console.log('Generating API documentation - stub')
}

if (help) {
  commandLineHelp('')
}

if (version) {
  const package_json = require('./package.json')
  console.log('gen version =', package_json.version)
  console.log('node version =', process.versions.node)
  process.exit(1)
}

// Checks for --route and if it has a routeID [string] and routeID is valid
// --route 2            valid & gets single route definition with id = 1
// --route 1,2,3,5-8    valid and expands to 1,2,3,4,5,6,7,8
// -- route all         get all ids from the routes-config to auto build the routeID string
if (route) {
  const routeIndex = process.argv.indexOf('--route')
  let routeArg
  let commaListRouteArg

  if (routeIndex > -1) {
    // Retrieve the value after --route
    routeArg = process.argv[3]
    // console.log('--route arg passed:', routeArg)
    if (typeof routeArg === 'undefined') {
      commandLineHelp('route option set but no route id provided')
    }
    if (typeof process.argv[4] === 'string') {
      commandLineHelp('route option set but too many arguements (hint: check for spaces e.g --route 1, 3)')
    }
    if (routeArg.slice(-1) === ',') {
      commandLineHelp('route option set but arguement string has trailing comma or an embedded space')
    }

    if (routeArg.toLowerCase() === 'all') {
      // if routeArg contains range(s) expand to comma seprated list
      console.log('all routes set')
      idsFromFile().then((commaListRouteArg) => {
        // console.log('commaListRouteArg', commaListRouteArg)
        genRoutes(commaListRouteArg)
        if (typeof commaListRouteArg.length == 0) {
          commandLineHelp('getting array of ids from config file failed')
        }
      })
    } else {
      // if routeArg contains range(s) expand to comma seprated list
      commaListRouteArg = expandRange(routeArg)
      genRoutes(commaListRouteArg)
      // console.log(
      //   'commaListRouteArg:',
      //   commaListRouteArg,
      //   'typeof:',
      //   typeof commaListRouteArg,
      //   'length:',
      //   commaListRouteArg.length,
      //   'is array?:',
      //   Array.isArray(commaListRouteArg)
      // )
    }
  }
}

async function idsFromFile() {
  let path = 'C:/Users/rcollins/code/gen-test2/configs/routes-config.json'
  if (fs.existsSync(path)) {
    let allIds = []
    const r = await JSON.parse(
      fs.readFileSync(path, {
        encoding: 'utf8',
        flag: 'r',
      })
    )
    r.forEach(function (thisRoute) {
      // console.log('this id: ', thisRoute.id)
      allIds.push(thisRoute.id)
    })
    return allIds
  } else {
    console.log('ERROR - failed to read ', path)
  }
}

function genRoutes(commaListRouteArg) {
  console.log('Generating routes for configuration(s):', commaListRouteArg.toString())
  // check for duplicates
  let t = Array.from(new Set(commaListRouteArg))
  if (commaListRouteArg.length !== t.length) {
    commandLineHelp('resulting array of routes contained duplicates')
  }
  for (let i = 0; i < commaListRouteArg.length; i++) {
    getRouteDef(commaListRouteArg[i]).then((thisRoute) => {
      // Generate this route
      if (thisRoute[0].method === 'GET') {
        genGetRoutes(thisRoute[0], gen)
      }
      if (thisRoute[0].method === 'POST') {
        postRoutesGeneration.generatePost(thisRoute[0], gen)
      }
    })
  }
}

async function genGetRoutes(thisRoute, gen) {
  await getRoutesGeneration.generateGet(thisRoute, gen).then(() => {
    return
  })
}

function expandRange(routeArg) {
  let argArray = routeArg.split(',')
  let res = []
  for (let i = 0; i < argArray.length; i++) {
    if (argArray[i].indexOf('-') === -1) {
      res.push(parseInt(argArray[i]))
    } else {
      let range = argArray[i].split('-')
      let x = 0
      for (let n = parseInt(range[0]); n < parseInt(range[1]) + 1; n++) {
        res.push(parseInt(n))
        x++
      }
      if (x === 0) {
        commandLineHelp("range expansion error (hint: check for 'to' > 'from' e.g. 5-3)")
      }
    }
  }
  // returns array of ints
  return res
}

async function getRouteDef(id) {
  // console.log('path:', process.env.APPPATH + process.env.APPDIR)
  const r = await JSON.parse(
    fs.readFileSync(process.env.APPPATH + 'async-test/configs/routes-config.json', {
      encoding: 'utf8',
      flag: 'r',
    })
  )
  return await r.filter((element) => element.id == id)
}

function commandLineHelp(e) {
  if (e !== '') {
    console.error('\n\033[91m*** ERROR *** -', e, '\033[0m\n')
  }
  console.log('Provide one from the following command line options : \n')
  console.log('\t  --purge \t\t deletes all generated directories and content')
  console.log('\t  --skeleton \t\t generate directories and new boilerplate code')
  console.log(
    '\t  --route 1  \t\t add route to an existing skeleton. Route defined in configs/routes-config.json id = 1'
  )
  console.log('\t  --route 1,5-7  \t add multiple routes id = 1,5,6,7')
  console.log('\t  --docs     \t\t generate the API documentation in markdown and HTML')
  console.log('\t  --help     \t\t print this help')
  console.log('\t  --version  \t\t print version')
  // console.log('\n')
  process.exit(1)
}
