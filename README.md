# jslogo - Logo interpreter with headless execution support

The nodejs version of jslogo allows you to execute Logo source files in a shell
environment without needing to run a browser. The output image and text are
stored in the location specified by the command line arguments.

This is especially convenient for doing automation with Logo programs.

## Credits

This is a forked project based on Joshua Bell's JS Logo:

https://github.com/inexorabletash/jslogo/

He's done a tremendous job at developing the interpreter and definitely deserves
the credit. My small contribution is just enabling this to run server side.


## Installation

Requires nodejs >= 8.

```bash
# for canvas
sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev \
  build-essential g++

# For using jslogo in a shell environment
npm install -g jslogo

# For development
git clone https://github.com/kburnik/jslogo.git && \
  cd jslogo && \
  npm update
```

## Usage

```bash
mkdir out
jslogo -f examples/example.lgo -o out/example
```

This will execute the code from `example.lgo` and store the image and text
along with other outputs with the specified prefix.
