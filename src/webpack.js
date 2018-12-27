'use strict';
const fs = require('fs');
const path = require('path');

function buildManifest(compilation) {
  let manifest = {};
  let publicPath = compilation.chunkTemplate.outputOptions.publicPath;

  [...compilation.chunkGroups].forEach(group => {
    if (group.origins[0].request) {
      manifest[group.origins[0].request] = [];
      group.chunks.forEach(chunk => {
        chunk.files.forEach((file, index) => {
          manifest[group.origins[0].request].push({ id: chunk.ids[index], file: publicPath + file });
        });
      });
    }
  });

  return manifest;
}

class ReactLoadablePlugin {
  constructor(opts = {}) {
    this.filename = opts.filename;
  }

  apply(compiler) {
    compiler.hooks.emit.tap('ReactLoadablePlugin', function (compilation) {
      const manifest = buildManifest(compilation);
      var json = JSON.stringify(manifest, null, 2);
      const outputDirectory = path.dirname(this.filename);
      try {
        fs.mkdirSync(outputDirectory);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
      fs.writeFileSync(this.filename, json);
    });
  }
}

function getBundles(manifest, moduleIds) {
  return moduleIds.reduce((bundles, moduleId) => {
    return bundles.concat(manifest[moduleId]);
  }, []);
}

exports.ReactLoadablePlugin = ReactLoadablePlugin;
exports.getBundles = getBundles;
