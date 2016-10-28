/**
 * # Weex Web Packer
 * 
 * This package plugin just works for the versions after(including) weex-html5 0.3.0. A `.wwprc` file
 * for configuration is always needed.
 *
 * @author MrRaindrop
 * @github https://github.com/MrRaindrop
 *
 * @usage: pack(options)
 *
 * @options
 *   - components: specify the components to pack in.
 *   - apis: specify the apis to pack in.
 *   - debug: show logs if true.
 *   - packer: file path of the 'packer' to generate.
 *   - componentsPath: file path of the components.
 *   - apisPath: file path of the APIs.
 */

var path = require('path')
var eol = require('os').EOL
var fs = require('fs-extra')
var chalk = require('chalk')
var os = require('os')

var log = require('./log')

var root = process.cwd()

function createFile(fpath) {
  fs.outputFileSync(fpath, '')
}

var logGreen = chalk.bold.green
var logYellow = chalk.bold.yellow

var packerPath = ''
var tips = {}
var content = ''
var exportLine = ''

/**
 * for examples, tips is like:
 * tips: {
 *   components: [{
 *     name: 'div',
 *     size: '100',
 *     path: './comp/div'
 *   }, {
 *     name: 'text',
 *     size: '20',
 *     path: './comp/text'
 *   }],
 *   apis: [{
 *     name: 'dom',
 *     size: '200',
 *     path: './apis/dom'
 *   }]
 * }
 */
function outputTips() {
  for (var key in tips) {
    console.log('pack ' + key + ':')
    var ts = tips[key]
    console.log(logYellow('     name\t\tpath'))
    ts.forEach(function (tip) {
      console.log(logGreen('     ' + tip.name), '  (' + tip.path + ')')
    })
  }
}

// originPath [String] relative path
// 1. replace \ to / in Windows
// 2. insert './' at head if needed
function convertPathForImport(originPath) {
  var result = originPath
  if (os.platform() === 'win32') {
    result = result.replace(/\\/g, '/')
  }
  if (result.indexOf('../') === -1 && result.indexOf('./') === -1) {
    result = './' + result
  }
  return result
}

function initPacker (options) {
  packerPath = options.packer
  try {
    fs.accessAsync(packerPath, fs.W_OK)
  } catch (err) {
    createFile(packerPath)
  }
  var stats = fs.statSync(packerPath)
  stats.isDirectory() && (packerPath = path.resolve(packerPath, 'packer.js'))
  log('packerPath: ', packerPath)
}

// import components
function processComponents (options) {
  var components = options.components || []
  if (components.length <= 0) {
    return
  }
  var cmpPath = options.componentsPath
  log('cmpPath: ', cmpPath)
  if (!fs.statSync(cmpPath).isDirectory()) {
    return console.error('cmpPath ' + cmpPath + 'is not a valid directory.')
  }

  // process components' imports
  content += '// import components.' + eol
  log('components-->', JSON.stringify(components, null, 2))

  tips.components = []
  components.forEach(function (comp) {
    var name = comp[0].toUpperCase() + comp.substr(1)
    var thePath = path.resolve(cmpPath, comp)
    var p = path.relative(path.parse(packerPath).dir, path.resolve(cmpPath, comp))
    p = convertPathForImport(p)
    content += 'import ' + name + ' from \'' + p + '\'' + eol
    exportLine += name + ', '
    tips.components.push({
      name: comp,
      path: convertPathForImport(path.relative(root, thePath))
    })
  })
}

// import APIs
function processApis (options) {
  var apis = options.apis || []
  if (apis.length <= 0) {
    return
  }
  var apisPath = options.apisPath
  log('apisPath: ', apisPath)
  if (!fs.statSync(apisPath).isDirectory()) {
    return console.error('apisPath ' + apisPath + 'is not a valid directory.')
  }

  // process apis' imports
  content += eol + '// import apis.' + eol
  log('apis-->', JSON.stringify(apis, null, 2))

  tips.apis = []
  apis.forEach(function (api) {
    var name = api[0].toUpperCase() + api.substr(1)
    var thePath = path.resolve(apisPath, api)
    var p = path.relative(path.parse(packerPath).dir, thePath)
    p = convertPathForImport(p)
    content += 'import ' + name + ' from \'' + p + '\'' + eol
    exportLine += name + ', '
    tips.apis.push({
      name: api,
      path: convertPathForImport(path.relative(root, thePath))
    })
  })
}

// import loaders
function processLoaders (options) {
  var loaders = options.loaders || []
  if (loaders.length <= 0) {
    return
  }
  var loadersPath = options.loadersPath
  log('loadersPath: ', loadersPath)
  if (!fs.statSync(loadersPath).isDirectory()) {
    return console.error('loadersPath ' + loadersPath + 'is not a valid directory.')
  }

  // process apis' imports
  content += eol + '// import loaders.' + eol
  log('loaders-->', JSON.stringify(loaders, null, 2))

  tips.loaders = []
  loaders.forEach(function (loader) {
    var name = loader[0].toUpperCase() + loader.substr(1)
    var thePath = path.resolve(loadersPath, loader)
    var p = convertPathForImport(path.relative(path.parse(packerPath).dir, thePath))
    content += 'import ' + name + ' from \'' + p + '\'' + eol
    exportLine += name + ', '
    tips.loaders.push({
      name: loader,
      path: convertPathForImport(path.relative(root, thePath))
    })
  })
}

module.exports = {
  pack: function (options) {
    log = log(options.debug).log

    initPacker(options)

    processComponents(options)
    processApis(options)
    processLoaders(options)

    log('exportLine-->', exportLine.slice(0, -2))
    // content += eol + 'module.exports = [' + exportLine.slice(0, -2) + ']' + eol
    content += eol + 'export default { ' + exportLine.slice(0, -2) + ' }' + eol

    outputTips()

    // write file
    fs.writeFileSync(packerPath, content)
  }
}
