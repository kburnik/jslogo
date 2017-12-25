#!/usr/bin/env node

const ArgumentParser = require('argparse').ArgumentParser;
const BoundingBox = require('./boundingbox.js');
const Canvas = require('canvas');
const floodFill = require('./floodfill.js')
const fs = require('fs');
const LogoInterpreter = require('./logo.js');
const LogoStream = require('./stream.js');
const Turtle = require('./turtle.js');
const util = require('util');
const Jimp = require('jimp');


fs.readFileAsync = util.promisify(fs.readFile);
fs.writeFileAsync = util.promisify(fs.writeFile);


function buildEnvironment(
    canvasWidth, canvasHeight, maxCycles, maxStack, tag, wstream) {
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

  var env;

  var turtle = new Turtle(
      canvas_ctx,
      turtle_ctx,
      canvasWidth,
      canvasHeight,
      /*events=*/null,
      /*moveCallback=*/function(x, y) {
        env.executionDetails.moveCount++;
        if (turtle.pendown) {
          boundingBox.update(x, y);
        }
      });

  var logo = new LogoInterpreter(
      turtle,
      stream,
      /*savehook=*/false,
      maxCycles,
      maxStack);

  env = {
      logo: logo,
      canvas: canvas,
      stream: stream,
      wstream: wstream,
      executionDetails: {
        tag: tag,
        startTime: 0,
        runTime: 0,
        cycles: 0,
        stackPeak: 0,
        moveCount: 0,
        boundingBox: boundingBox,
        error: null
      },
      startTimer :function() {
        this.executionDetails.startTime = new Date();
      },
      updateExecutionDetails: function() {
        this.executionDetails.runTime =
            new Date() - this.executionDetails.startTime;
        this.executionDetails.cycles = this.logo.cycles;
        this.executionDetails.stackPeak = this.logo.stackPeak;
      }};

  return env;
}


function executeSourceFile(sourceFilename, env) {
  return fs.readFileAsync(sourceFilename, 'utf8')
    .then(function(sourceCode) {
      env.startTimer();
      return env.logo.run(sourceCode);
    }).then(function() {
      env.updateExecutionDetails();
    });
}

function saveExecutionState(args, env, out, err) {
  // Close the text output stream.
  env.wstream.end();
  env.executionDetails.error = err;
  var boundingBox = env.executionDetails.boundingBox;
  var box = boundingBox.expand(args.margin).toImageCoordinates();

  if (args.combined) {
    return saveCombined(env, out.text, box, args.out);
  } else {
    return Promise.all([
      saveImage(env.canvas.toBuffer(), box, out.image),
      saveExecutionDetails(env.executionDetails, out.details)
    ]);
  }
}

function saveCombined(env, textFilename, box, combinedFilename) {
  return fs.readFileAsync(textFilename, 'utf8')
  .then(function(text) {
    var combinedOutput = {
       'image': env.canvas.toDataURL(),
       'text': text,
       'details': env.executionDetails};
    var serialized = JSON.stringify(combinedOutput, null, 2);
    return fs.writeFileAsync(combinedFilename, serialized);
  }).then(function() {
    return fs.unlink(textFilename, function() {});
  });
}

function saveImage(bufferedImage, box, filename) {
  return Jimp.read(bufferedImage).then(function(image) {
    return new Promise(function(resolve, reject) {
      image.crop(box.min.x, box.min.y, box.width, box.height)
        .write(filename, function(err) {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  })
}

function saveError(err, filename) {
  return fs.writeFileAsync(filename, err);
}

function saveExecutionDetails(executionDetails, detailsFilename) {
  var serializedExecutionDetails = JSON.stringify(executionDetails, null, 2);
  console.info(serializedExecutionDetails);
  return fs.writeFileAsync(detailsFilename, serializedExecutionDetails);
}

function main(args) {
  var out = {
    text: args.out + '.txt',
    image: args.out + '.png',
    details: args.out + '.json',
    error: args.out + ".err"
  }

  // Create stream for text output.
  var wstream = fs.createWriteStream(out.text);

  var env = buildEnvironment(
      args.width,
      args.height,
      args.max_cycles,
      args.max_stack,
      args.tag,
      wstream);

  var handlingError = false;
  process.on('unhandledRejection', (err) => {
    // Prevent recursive failure.
    if (handlingError) {
      console.error(err);
      process.exit(2);
    }
    handlingError = true;

    env.updateExecutionDetails();
    saveError(util.format(err), out.error)
    .then(function() {
      return saveExecutionState(args, env, out, err);
    })
    .then(function(){
      console.error(err);
      process.exit(1);
    })
  });

  executeSourceFile(args.file, env)
  .then(function() {
    return saveExecutionState(args, env, out, null);
  })
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
    {defaultValue: 80000,
     type: 'int',
     help: 'Maximum number of execution cycles'});
parser.addArgument(
    ['-s', '--max_stack'],
    {defaultValue: 10000,
     type: 'int',
     help: 'Maximum size of stack'});
parser.addArgument(
    ['-t', '--tag'],
    {defaultValue: null,
     type: 'string',
     help: 'Tag for this execution'});
parser.addArgument(
    ['-c', '--combined'],
    {defaultValue: false,
     action: 'storeTrue',
     help: 'Store combined output, a single JSON encoded file'});

main(parser.parseArgs());
