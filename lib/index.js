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

var fs = require('fs')
var path = require('path')
var eol = require('os').EOL

var log = require('./log')

module.exports = {
  pack: function (options) {
    log = log(options.debug).log
    var components = options.components || []
    var apis = options.apis || []

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

    var stats = fs.statSync(packerPath)
    stats.isDirectory() && (packerPath = path.resolve(packerPath, 'packer.js'))
    log('packerPath: ', packerPath)

    cmpPath = path.relative(packerPath, cmpPath)
    apisPath = path.relative(packerPath, apisPath)

    var content = ''
    var exportLine = ''
    // process components' imports
    content += '// import components.' + eol
    components.forEach(function (comp) {
      var name = comp[0].toUpperCase() + comp.substr(1)
      var p = path.relative(packerPath, path.resolve(cmpPath, comp))
      content += 'import ' + name + ' from \'' + p + '\'' + eol
      exportLine += name + ', '
    })

    // process apis' imports
    content += eol + '// import apis.' + eol
    log('apis-->', JSON.stringify(apis, null, 2))
    apis.forEach(function (api) {
      var name = api[0].toUpperCase() + api.substr(1)
      var p = path.relative(packerPath, path.resolve(apisPath, api))
      content += 'import ' + name + ' from \'' + p + '\'' + eol
      exportLine += name + ', '
    })
    log('exportLine-->', exportLine.slice(0, -2))
    content += eol + 'module.exports = [' + exportLine.slice(0, -2) + ']' + eol

    // write file
    fs.writeFileSync(packerPath, content)
  }
}
