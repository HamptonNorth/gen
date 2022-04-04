import { singleReplace1, singleReplace2, readFile, writeFile } from '../utils/index.js'
export const doGenerateTests = async (step, thisRoute, targetRootDir) => {
  // assumes testmatches string of format  array/offset/field e.g. users[0].email
  let route = thisRoute.name.toLowerCase()
  let arr = thisRoute.testmatches.substring(0, thisRoute.testmatches.indexOf('['))
  let tests = thisRoute.testmatches.split('|')
  let matchStr = ''

  for (let i = 0; i < tests.length; i++) {
    let arrIndex = 0
    arrIndex = parseInt(tests[i].substring(tests[i].indexOf('[') + 1, tests[i].indexOf(']')))
    let objKey = tests[i].substring(tests[i].lastIndexOf('.') + 1)
    let obj = thisRoute.requestresponse.data[arr]
    let innerObj = obj[arrIndex]
    let match = innerObj[objKey]
    matchStr += `expect(response.body.data.${arr}[${arrIndex}].${objKey}).toEqual('${match}')\n`
  }

  let testsJSCode = `
  describe('Test the ${thisRoute.name.toLowerCase()} route', () => {
    test('Test /api/${route} emails include ??', async () => {
      const response = await request(app).${thisRoute.method.toLowerCase()}('/api/${thisRoute.name.toLowerCase()}')
      // change these assertions to match API return
      ${matchStr}
      expect(response.statusCode).toBe(200)
    })
  })  
  `
  let routeReplacement1 = `${testsJSCode} 
//@insert1`
  let content = await readFile(targetRootDir + '/tests/api-tests.test.js')
  let result1 = await singleReplace1(routeReplacement1, content)

  await writeFile(8, targetRootDir + '/tests/api-tests.test.js', result1)
}
