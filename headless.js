const ArgumentParser = require('argparse').ArgumentParser;
const autotrace = require('autotrace');
const BoundingBox = require('./boundingbox.js');
const Canvas = require('canvas');
const floodFill = require('./floodfill.js')
const fs = require('fs');
const LogoInterpreter = require("./logo.js");
const LogoStream = require("./stream.js");
const Turtle = require("./turtle.js");
const util = require('util');
const Jimp = require('jimp');


fs.readFileAsync = util.promisify(fs.readFile);
fs.writeFileAsync = util.promisify(fs.writeFile);

function buildEnvironment(canvasWidth, canvasHeight, maxCycles, wstream) {
  var canvas = new Canvas(canvasWidth, canvasHeight, 'png');
  var turtle_canvas = new Canvas(10, 10);
  var canvas_ctx = canvas.getContext('2d');
  var turtle_ctx = turtle_canvas.getContext('2d');

  var stream = LogoStream(wstream);

  var boundingBox = new BoundingBox(canvasWidth, canvasHeight, /*clamp=*/true);
  // Set up the default size for empty images.
  boundingBox.update(0, 0);

  // Attach the filling extension.
  canvas_ctx.floodFill = floodFill;

  var turtle = new Turtle(
      canvas_ctx,
      turtle_ctx,
      canvasWidth,
      canvasHeight,
      /*events=*/null,
      /*moveCallback=*/function(x, y) {
        if (turtle.pendown) {
          boundingBox.update(x, y);
        }
      });

  var logo = new LogoInterpreter(
      turtle,
      stream,
      /*savehook=*/false,
      maxCycles);

  return {logo: logo, canvas: canvas, stream: stream, box: boundingBox};
}


process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(2);
});


function main(args) {
  var out = {
    text: args.out + ".txt",
    html: args.out + ".html",
    image: args.out + ".png",
    details: args.out + ".json"
  }
  var wstream = fs.createWriteStream(out.text);

  var env = buildEnvironment(args.width, args.height, args.max_cycles, wstream);
  var startTime = null;
  var executionTime = null;
  var box = null;

  fs.readFileAsync(args.file, 'utf8')
  .then(function(sourceCode) {
    startTime = process.hrtime();
    console.log("Running");
    return env.logo.run(sourceCode);
  })
  .then(function() {
    console.log("Done.");
    executionTime = process.hrtime(startTime)[1] / 1000000;
    wstream.end();
    return fs.writeFileAsync(out.image, env.canvas.toBuffer());
  })
  .then(function() {
    return Jimp.read(out.image)
  })
  .then(function(image) {
    return new Promise(function(resolve, reject) {
      box = env.box.expand(args.margin).toImageCoordinates();
      image.crop(box.min.x, box.min.y, box.width, box.height)
        .write(out.image, function(err){
          if (err) reject();
          resolve();
        });
    });
  })
  .then(function() {
    return fs.writeFileAsync(
        out.html,
        '<body style="background: black; width:100%; height:100%;">' +
        '<img src="' + out.image.split('/').pop() + '" /></body>');
  })
  .then(function() {
    return fs.writeFileAsync(
        out.details,
        JSON.stringify({
          'execution': {time: executionTime, cycles: env.logo.cycles},
          'bounding_box': [box.min.x, box.min.y, box.max.x, box.max.y],
        }, null, 2));
  })
  .catch(function(err) {
    console.error("Error", err);
    process.exit(1);
  })
  .then(function(){
    console.info('Execution took', executionTime, 'ms');
    process.exit(0);
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
    ['-o', '--out'],
    {defaultValue: 'out',
     help: 'Filename prefix for outputs'});
parser.addArgument(
    ['-cw', '--width'],
    {defaultValue: 1000,
     type: 'int',
     help: 'Canvas width in pixels'});
parser.addArgument(
    ['-ch', '--height'],
    {defaultValue: 1000,
     help: 'Canvas height in pixels'});
parser.addArgument(
    ['-m', '--margin'],
    {defaultValue: 5,
     type: 'int',
     help: 'Bounding box margin (pixels)'});
parser.addArgument(
    ['-x', '--max_cycles'],
    {defaultValue: 50000,
     type: 'int',
     help: 'Maximum number of execution cycles'});

main(parser.parseArgs());
