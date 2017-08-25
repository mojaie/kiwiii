
const argv = require('argv');
const ejs = require("ejs");
const fs = require("fs");
const less = require('less');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const uglify = require('rollup-plugin-uglify');
const minify = require('uglify-es').minify;
const precache = require('sw-precache');

// Preamble
const json = JSON.parse(fs.readFileSync("package.json", "utf8"));
const preamble = `// ${json.homepage} Version ${json.version}. Copyright ${(new Date).getFullYear()} ${json.author}.`;

// Commandline option
argv.option({
  name: 'debug',
  type : 'boolean',
  description :'debug mode',
  example: "'script --debug=true'"
});
const args = argv.run();
const buildDir = args.targets[0];
const isDebugMode = args.options.debug;

const apps = ['control', 'datatable', 'profile', 'graph', 'report'];
const bundles = apps.concat('customMethods');

if (isDebugMode) {
	apps.push('testAPI');
  bundles.push('main');
}


// JS build

const jsBundled = bundles.map(e => {
  let path;
  if (e === 'main') {
    path = 'main.js';
  } else {
    path = `src/${e}.js`;
  }
  const pgs = [
    resolve({jsnext: true})
  ];
  if (!isDebugMode) {
    pgs.push(uglify({
      output: {
        beautify: false,
        preamble: preamble
      }
    }, minify));
  }
  return rollup.rollup({
    entry: path,
    plugins: pgs,
    external: ['d3', 'Dexie', 'jLouvain', 'pako', 'vega']
  }).then(b => {
    b.write({
      dest: `${buildDir}/kw${e}.js`,
      format: 'umd',
      sourceMap: true,
      moduleName: `kw${e}`,
      banner: preamble,
      intro: `const debug = ${isDebugMode};`,
      globals: {
        d3: 'd3',
        Dexie: 'Dexie',
        jLouvain: 'jLouvain',
        pako: 'pako',
        vega: 'vega'
      }
    });
  });
});


// EJS build

const htmlRendered = apps.forEach(e => {
  return new Promise(resolve => {
    ejs.renderFile(
      `./ejs/${e}.ejs`, {}, {}, (err, str) => {
        if (err) {
          console.error(err);
          return;
        }
        fs.writeFile(`./${buildDir}/${e}.html`, str, () => {
          resolve();
        });
      }
    );
  });
});


// LESS build

const cssRendered = new Promise(resolve => {
  fs.readFile('./less/default.less', 'utf8', (err, input) => {
    less.render(input).then(output => {
      fs.writeFile(`./${buildDir}/default.css`, output.css, () => {
        resolve();
      });
    });
  });
});


// Generate service worker file

Promise.all(
  jsBundled.concat([htmlRendered, cssRendered])
).then(() => {
  precache.write(`${buildDir}/sw.js`, {
      staticFileGlobs: [
        `${buildDir}/*.{js,html,css}`
      ],
      stripPrefix: `${buildDir}/`,
      ignoreUrlParametersMatching: [/(id|compound)/],
      runtimeCaching: [
        {urlPattern: /^https:\/\/maxcdn\.bootstrapcdn\.com/, handler: 'cacheFirst'},
        {urlPattern: /^https:\/\/code\.jquery\.com/, handler: 'cacheFirst'},
        {urlPattern: /^https:\/\/cdnjs\.cloudflare\.com/, handler: 'cacheFirst'},
        {urlPattern: /^https:\/\/unpkg\.com/, handler: 'cacheFirst'},
        {urlPattern: /^https:\/\/d3js\.org/, handler: 'cacheFirst'},
        {urlPattern: /^https:\/\/vega\.github\.io/, handler: 'cacheFirst'}
      ]
    }, () => {});
});
