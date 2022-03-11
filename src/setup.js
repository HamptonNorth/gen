const fs = require('node:fs')

const purge = async (gen) => {
  for (let i = 0; i < gen.dirs.length; i++) {
    let path = gen.targetRoot + '/' + gen.dirs[i]
    try {
      //   if (fs.existsSync(path)) {
      fs.rmSync(path, { recursive: true, force: true })
      //   }
    } catch (err) {
      console.error(err)
    }
    console.log(`  ${gen.targetDir}/${gen.dirs[i]} deleted`)
  }

  try {
    fs.rmSync(`${gen.targetRoot}/app.js`, { recursive: true, force: true })
    fs.rmSync(`${gen.targetRoot}/server.js`, { recursive: true, force: true })
  } catch {
    if (err) {
      console.error(err)
    }
  }

  console.log(`  ${gen.targetDir}/app.js and ${gen.targetDir}/server.js deleted`)
}

module.exports = {
  purge,
}
