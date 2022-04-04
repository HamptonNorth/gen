import { singleReplace1, singleReplace2, readFile, writeFile } from '../utils/index.js'
export const doGenerateDocs = async (step, thisRoute, message, passedObjectKeys, targetRootDir) => {
  //   console.log('thisRoute:', thisRoute)
  let curlBody = ``
  if (thisRoute.method === 'POST') {
    curlBody = `-H "Content-Type: application/json" -d '${JSON.stringify(thisRoute.requestbody[0])}'`
  }
  //   let fails = thisRoute.failmessages.split('|')
  let failsText = ''
  //   for (let i = 0; i < fails.length; i++) {
  //     failsText += `
  //   {
  //     "status": "fail",
  //     "data": {
  //       "message": "${fails[i]}"
  //     }
  //   }`
  //   }
  let docsMDCode = `
## /api/${thisRoute.name}

>Description:  ${thisRoute.description}
\`\`\`Text
# thisRoute.method            ${thisRoute.method}
# authentication              Y
# example                     ${thisRoute.name.toLowerCase()}
# parameters                  ${message.substring(1)}
# objectKeys                  ${passedObjectKeys}
\`\`\`
\`\`\`Text
# body                        \n${JSON.stringify(thisRoute.requestbody, null, '/t')}
\`\`\`
\`\`\`Text
# success response            \n${JSON.stringify(thisRoute.requestresponse, null, '\t')}

\`\`\`
\`\`\`Text
# fail response examples(s)
${failsText}
\`\`\`
\`\`\`Text
# curl
curl  -X ${thisRoute.method} http://localhost:${process.env.PORT}/api/${thisRoute.name.toLowerCase()} ${curlBody}
\`\`\`
> Notes:  ${thisRoute.notes}
<hr><style="page-break-after: always;"></style>

`
  let routeReplacement1 = `${docsMDCode} 
//@insert1`
  let content = await readFile(targetRootDir + '/docs/API.docs.md')
  let result1 = await singleReplace1(routeReplacement1, content)

  await writeFile(9, targetRootDir + '/docs/API.docs.md', result1)
}
