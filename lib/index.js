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

var log = require('./log')

var root = process.cwd()

function createFile(fpath) {
  fs.outputFileSync(fpath, '')
}

var logGreen = chalk.bold.green
var logYellow = chalk.bold.yellow

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
function outputTips(tips) {
  for (var key in tips) {
    console.log('pack ' + key + ':')
    var ts = tips[key]
    console.log(logYellow('     name\t\tpath'))
    ts.forEach(function (tip) {
      var p = tip.path
      p.indexOf('../') === -1 && p.indexOf('./') === -1 && (p = './' + p)
      console.log(logGreen('     ' + tip.name), '  (' + p + ')')
    })
  }
}

module.exports = {
  pack: function (options) {
    log = log(options.debug).log
    var components = options.components || []
    var apis = options.apis || []
    var tips = {}

    // resolve the paths.
    var packerPath = options.packer
    var cmpPath = options.componentsPath
    log('cmpPath: ', cmpPath)
    if (!fs.statSync(cmpPath).isDirectory()) {
      return console.error('cmpPath ' + cmpPath + 'is not a valid directory.')
    }
    var apisPath = options.apisPath
    log('apisPath: ', apisPath)
    if (!fs.statSync(apisPath).isDirectory()) {
      return console.error('apisPath ' + cmpPath + 'is not a valid directory.')
    }

    try {
      fs.accessAsync(packerPath, fs.W_OK)
    } catch (err) {
      createFile(packerPath)
    }

    var stats = fs.statSync(packerPath)
    stats.isDirectory() && (packerPath = path.resolve(packerPath, 'packer.js'))
    log('packerPath: ', packerPath)

    var content = ''
    var exportLine = ''
    // process components' imports
    content += '// import components.' + eol
    log('components-->', JSON.stringify(components, null, 2))

    tips.components = []
    components.forEach(function (comp) {
      var name = comp[0].toUpperCase() + comp.substr(1)
      var thePath = path.resolve(cmpPath, comp)
      var p = path.relative(path.parse(packerPath).dir, path.resolve(cmpPath, comp))
      p.indexOf('../') === -1 && p.indexOf('./') === -1 && (p = './' + p)
      content += 'import ' + name + ' from \'' + p + '\'' + eol
      exportLine += name + ', '
      tips.components.push({
        name: comp,
        path: path.relative(root, thePath)
      })
    })

    // process apis' imports
    content += eol + '// import apis.' + eol
    log('apis-->', JSON.stringify(apis, null, 2))

    tips.apis = []
    apis.forEach(function (api) {
      var name = api[0].toUpperCase() + api.substr(1)
      var thePath = path.resolve(apisPath, api)
      var p = path.relative(path.parse(packerPath).dir, thePath)
      p.indexOf('../') === -1 && p.indexOf('./') === -1 && (p = './' + p)
      content += 'import ' + name + ' from \'' + p + '\'' + eol
      exportLine += name + ', '
      tips.apis.push({
        name: api,
        path: path.relative(root, thePath)
      })
    })
    log('exportLine-->', exportLine.slice(0, -2))
    content += eol + 'module.exports = [' + exportLine.slice(0, -2) + ']' + eol

    outputTips(tips)

    // write file
    fs.writeFileSync(packerPath, content)
  }
}
