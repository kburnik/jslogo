const Canvas = require('canvas');
const fs = require('fs');
const LogoInterpreter = require("./logo.js");
const stream = require("./stream.js");
const Turtle = require("./turtle.js");
const util = require('util');
const ArgumentParser = require('argparse').ArgumentParser;
const autotrace = require('autotrace');

fs.readFileAsync = util.promisify(fs.readFile);
fs.writeFileAsync = util.promisify(fs.writeFile);

function buildEnvironment(canvasWidth, canvasHeight) {
  var canvas = new Canvas(canvasWidth, canvasHeight, 'png');
  var turtle_canvas = new Canvas(10, 10);
  var canvas_ctx = canvas.getContext('2d');
  var turtle_ctx = turtle_canvas.getContext('2d');

  var turtle = new Turtle(
      canvas_ctx,
      turtle_ctx,
      canvasWidth,
      canvasHeight,
      /*events=*/null);

  var logo = new LogoInterpreter(
    turtle, stream,
    function (name, def) {

    });

  return {logo: logo, canvas: canvas, stream: stream};
}

function main(args) {
  var env = buildEnvironment(args.width, args.height);

  fs.readFileAsync(args.file, 'utf8')
  .then(function(data) {
    return env.logo.run(data);
  })
  .then(function() {
    // console.log(env.canvas.toBuffer().toString('utf8'));
    return fs.writeFileAsync('sample.png', env.canvas.toBuffer());
  })
  .then(function() {
    autotrace('sample.png', {outputFile: 'sample.svg'},
      function(err, buffer) {
        if (!err) {
          console.log('Done converting to SVG.');
        } else {
          console.error("Failed autotrace.");
          process.exit(1);
        }
      });
  })
  .then(function() {
    return fs.writeFileAsync('sample.html', '<img src="sample.svg" />');
  })
  .then(function(){
    console.info('Done with execution.');
  })
  .catch(function(err) {
    console.error(err);
    process.exit(1);
  });
}


var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Headless logo interpreter'
});

parser.addArgument(
    ['-f', '--file'],
    {defaultValue: '/dev/stdin',
     help: 'Logo file to execute'});
parser.addArgument(
    ['-cw', '--width'],
    {defaultValue: 1000,
     help: 'Canvas width in pixels'});
parser.addArgument(
    ['-ch', '--height'],
    {defaultValue: 1000,
     help: 'Canvas height in pixels'});

main(parser.parseArgs());
