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

function buildEnvironment(canvasWidth, canvasHeight, wstream) {
  var canvas = new Canvas(canvasWidth, canvasHeight, 'png');
  var turtle_canvas = new Canvas(10, 10);
  var canvas_ctx = canvas.getContext('2d');
  var turtle_ctx = turtle_canvas.getContext('2d');

  var stream = LogoStream(wstream);

  var boundingBox = new BoundingBox(canvasWidth, canvasHeight, /*clamp=*/true);
  // Set up the default size for empty images.
  boundingBox.update(0, 0);

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
          console.log(boundingBox.min, boundingBox.max);
        }
      });

  var logo = new LogoInterpreter(
    turtle, stream,
    function (name, def) {

    });

  return {logo: logo, canvas: canvas, stream: stream, box: boundingBox};
}

function main(args) {
  var wstream = fs.createWriteStream(args.out_text);

  var env = buildEnvironment(args.width, args.height, wstream);
  var startTime = null;
  var executionTime = null;

  fs.readFileAsync(args.file, 'utf8')
  .then(function(sourceCode) {
    startTime = process.hrtime();
    return env.logo.run(sourceCode);
  })
  .then(function() {
    executionTime = process.hrtime(startTime)[1] / 1000000;
    wstream.end();
    return fs.writeFileAsync(args.out_image, env.canvas.toBuffer());
  })
  .then(function() {
    return Jimp.read(args.out_image)
  })
  .then(function(image) {
    return new Promise(function(resolve, reject) {
      var box = env.box.expand(args.margin).toImageCoordinates();
      console.log(box);
      image.crop(box.min.x, box.min.y, box.width, box.height)
        .write(args.out_image, function(err){
          if (err) reject();
          resolve();
        });
    });
  })
  .then(function() {
    return fs.writeFileAsync(
        args.out_image.replace(".png", ".html"),
        '<body style="background: black; width:100%; height:100%;">' +
        '<img src="' + args.out_image.split('/').pop() + '" /></body>');
  })
  .then(function(){
    console.info('Execution took', executionTime, 'ms');
    process.exit(0);
  })
  .catch(function(err) {
    console.error("Error", err);
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
    ['-oi', '--out_image'],
    {defaultValue: 'out.png',
     help: 'Filename for the output image'});
parser.addArgument(
    ['-ot', '--out_text'],
    {defaultValue: 'out.txt',
     help: 'Filename for the output text'});
parser.addArgument(
    ['-cw', '--width'],
    {defaultValue: 1000,
     type: 'int',
     help: 'Canvas width in pixels'});
parser.addArgument(
    ['-m', '--margin'],
    {defaultValue: 5,
     type: 'int',
     help: 'Bounding box margin (pixels)'});
parser.addArgument(
    ['-ch', '--height'],
    {defaultValue: 1000,
     help: 'Canvas height in pixels'});

main(parser.parseArgs());
