const fs = require('fs');
const { globSync } = require('glob');

/**
 * @typedef { Object } PathConfig
 * @property { string } path - the source directory of files to be indexed
 * and destination of the generated index.js file
 * @property { boolean } includeSubfolders - whether to recursively include subfolders
 * @property { boolean } includeExtension - whether to include the extension in the module imports
 * @property { array | string } ignore - a pattern or array of patterns to ignore when indexing
 */

/**
 *
 * Automatically creates an index.js file in each of the specified paths when starting in dev mode
 * and when a hot update occurs
 * The specified directory is parsed for all matching files which are exported in the index file
 * @param { PathConfig[] } pathsConfig
 * @return {{name: string, configureServer(server): void}}
 */
module.exports = function autoIndexPlugin(pathsConfig) {
  return {
    name: 'auto-index',
    configureServer(server) {
      pathsConfig.forEach(processPath);

      function handleWatcherUpdate(filepath) {
        const sanitizedFilepath = sanitizeFilePath(filepath);

        pathsConfig.forEach(pathConfig => {
          const isMatch = new RegExp(pathConfig.path).test(sanitizedFilepath);
          if (isMatch) processPath(pathConfig);
        });
      }

      server.watcher.on('add', handleWatcherUpdate);
      server.watcher.on('unlink', handleWatcherUpdate);
    }
  };
}

/**
 * Replace all backslashes (windows) with forward slashes in a given filepath
 * @param filepath
 * @return { string }
 */
function sanitizeFilePath(filepath) {
  return filepath.replace(/\\/g, '/');
}

/**
 * Create the index.js file respective of the specified path config
 * @param { PathConfig } pathConfig
 */
function processPath({
  path: srcPath,
  includeExtension = false,
  includeSubfolders = false,
  ignore = []
}) {
  const ignorePaths = typeof ignore === 'string' ? [ignore] : ignore;
  const pattern = includeSubfolders ? `${srcPath}/**/*` : `${srcPath}/*`;
  const files = globSync(pattern, { ignore: ['**/index.js', ...ignorePaths] });

  let imports = '';
  let exports = 'export default {\n';

  files.sort().forEach(filepath => {
    const relPath = sanitizeFilePath(filepath)
      .replace(/\/$/, '') // remove trailing slash if present
      .replace(srcPath, './') // replace absolute with relative path
      .replace(/\/\//g, '/') // replace any double slashes
      .split('/')
      .slice(0, -1)// remove the file name and extension
      .join('/');
    const moduleFullname = filepath.match(/[\w.]+$/)[0];
    const [moduleName, ext] = moduleFullname.split('.');
    const moduleStr = includeExtension ? moduleFullname : moduleName;
    imports += `import ${moduleName} from '${relPath}/${moduleStr}';\n`;
    exports += `  ${moduleName},\n`;
  });

  exports += '};';

  const indexPath = `${srcPath}/index.js`;
  const content = [imports, exports].join('\n\n');
  fs.writeFileSync(indexPath, content);
}