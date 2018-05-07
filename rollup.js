
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
  description :'debug build',
  example: "'script --debug=true'"
});
const args = argv.run();
const isDebugBuild = args.options.debug;

const distDir = 'dist';
const buildDir = '_build';

// Bundle setting
const bundles = [
  {name: 'datagrid', module: 'kw-datagrid', dist: true}, // debug: no build, deploy: uglify
  {name: 'network', module: 'kw-network', dist: true},
  {name: 'dashboardApp', ejs: 'dashboard'},  // debug: build, deploy: uglify
  {name: 'datagridApp', ejs: 'datagrid'},
  {name: 'networkApp', ejs: 'network'},
  {name: 'profileApp', ejs: 'profile'},
  {name: 'testAPI', ejs: 'testAPI', deploy: false},  // debug: build, deploy: delete
  {name: 'main', source: 'main.js', deploy: false}   // debug: build, deploy: delete
];


// External JS libraries
const external = {
  d3: 'd3',
  Dexie: 'Dexie',
  jLouvain: 'jLouvain',
  pako: 'pako',
  vega: 'vega',
  lodash: '_'
};


// JS build
const jsBundled = bundles
  .filter(bundle => !(isDebugBuild && bundle.hasOwnProperty('dist') && bundle.dist))
  .map(bundle => {
    const plugins = [resolve({jsnext: true})];
    if (!isDebugBuild) {
      plugins.push(uglify({output: {beautify: false, preamble: preamble}}, minify));
    }
    const module = bundle.hasOwnProperty('module') ? bundle.module : bundle.name;
    return rollup.rollup({
      input: bundle.hasOwnProperty('source') ? bundle.source : `src/${bundle.name}.js`,
      plugins: plugins,
      external: Object.keys(external)
    }).then(b => {
      b.write({
        file: `${bundle.dist ? distDir : buildDir}/${module}.js`,
        format: 'umd',
        sourcemap: true,
        name: module,
        banner: preamble,
        globals: external
      });
    });
  });


// EJS build
const htmlRendered = bundles
  .filter(bundle => isDebugBuild || !bundle.hasOwnProperty('deploy') || bundle.deploy)
  .filter(bundle => bundle.hasOwnProperty('ejs'))
  .map(bundle => {
    return new Promise((resolve, reject) => {
      ejs.renderFile(
        `./ejs/${bundle.ejs}.ejs`, {}, {},
        (err, str) => {
          if (err) {
            console.error(err);
            reject();
          }
          fs.writeFile(`${buildDir}/${bundle.ejs}.html`, str, () => {
            resolve();
          });
        }
      );
    });
  });


// LESS build
const cssRendered = new Promise(resolve => {
  fs.readFile('less/default.less', 'utf8', (err, input) => {
    less.render(input).then(output => {
      fs.writeFile(`${buildDir}/default.css`, output.css, () => {
        resolve();
      });
    });
  });
});


// Generate service worker file
Promise.all(
  jsBundled.concat(htmlRendered, cssRendered)
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
