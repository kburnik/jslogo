# jslogo - nodejs enabled headless execution.

Forked from: https://github.com/inexorabletash/jslogo/


## Installation

Requires nodejs >= 8.

```
# for canvas
sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev \
  build-essential g++

# For usage
npm install jslogo

# For development
git clone https://github.com/kburnik/jslogo.git
npm update
```

## Usage

```
mkdir out
./jslogo.js --file examples/example.lgo --out out/example
```

This will execute the code from `example.lgo` and store the image and text
along with other outputs with the specified prefix.
