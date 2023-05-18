# vite-plugin-auto-index

This Vite Plugin automatically generates an `index.js` file in each of the specified paths which exports all modules contained within the folder.

Index files are generated on initial build/dev and each time a file is added or removed from the specified paths.

## usage

```javascript
// vite.config.js
import autoIndex from 'vite-plugin-auto-index'

export default {
  plugins: [
    autoIndex([
      {
        path: 'path/to/modules',
        includeSubfolders: false, // optional
        includeExtension: false, // optional
        ignore: '/exclude/**' // optional
      }
    ])
  ],
}
```

## options

Each path config item can be configured with the following options:

### `path`

Required

Type: `string` 

The relative path in which to scan for files and the destination path for the generated `index.js` file

### `includeSubfolders`

Type `boolean`

Default: `false`

Whether to recurse subfolders for modules to add to the index file

### `includeExtension`

Type `boolean`

Default: `false`

Whether to include the file extension when importing files in the index file

### `ignore`

Type `string | array`

A glob pattern or array of patterns, which specifies the files to be excluded from the index file