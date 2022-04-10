import { singleReplace1, singleReplace2, readFile, writeFile } from '../utils/index.js'

export const doValidateRouteConfigs = async () => {
  // Validate:
  // is valid JSON
  // contains at least one route
  // no duplicate id's
  // no duplicate route names
  // if testmatch, check key exists in request.response - TODO
  // if method is GET check request body is empty
  // if method = POST check request.body is valid
  // method = GET | POST | PUT | DELETE

  // read route-configs.json
  let message = ''
  let fullPath = process.env.APPPATH + process.env.APPDIR + '/configs/routes-config.json'
  let s = await readFile(fullPath)
  let a
  try {
    a = JSON.parse(s)
  } catch {
    return 'Invalid JSON!'
  }

  let redOn = '\x1B[91m'
  let redOff = '\x1B[0m'
  //   console.log('In validateRouteConfigs -  route-configs.json: \n', s, a)

  if (a.length === 0) {
    message += `${redOn}No routes present in routes-config.json${redOff}\n`
  }

  let ids = []
  let names = []

  for (let i = 0; i < a.length; i++) {
    if (a[i].method !== 'GET' && a[i].method !== 'POST' && a[i].method !== 'PUT' && a[i].method !== 'DELETE') {
      message += `${redOn}id: ${a[i].id} - invalid method ${a[i].method}${redOff}\n`
    }
    if (
      (a[i].method === 'POST' || a[i].method === 'PUT' || a[i].method === 'DELETE') &&
      (a[i].requestbody === '' || !('requestbody' in a[i]))
    ) {
      message += `${redOn}id: ${a[i].id} -  method set to ${a[i].method} but empty request body or missing "requestbody" key${redOff}\n`
    }
    if (a[i].method === 'GET' && (a[i].requestbody !== '' || !('requestbody' in a[i]))) {
      message += `${redOn}id: ${a[i].id} -  method set to ${a[i].method} but requestbody not empty or missing "requestbody" key${redOff}\n`
    }

    ids.push(a[i].id)

    let route = a[i].name
    if (a[i].name.indexOf('/:') !== -1) {
      route = a[i].name.substring(0, a[i].name.indexOf('/:'))
    }
    if (a[i].name.indexOf('?') !== -1) {
      route = a[i].name.substring(0, a[i].name.indexOf('?'))
    }
    names.push(route)
  }

  let noDuplicateIds = [...new Set(ids)]
  let noDuplicateNames = [...new Set(names)]

  if (ids.length > noDuplicateIds.length) {
    message += `${redOn}Duplicate id values in routes-config.json${redOff}\n\tids: ${ids}\n`
  }

  if (names.length > noDuplicateNames.length) {
    message += `${redOn}Duplicate route names in routes-config.json${redOff}\n\tnames: ${names}\n`
  }
  if (message == '') {
    return 'Valid route-configs.json file'
  } else {
    return message
  }
}
