# jslogo - nodejs enabled headless execution.

Forked from: https://github.com/inexorabletash/jslogo/


## Installation

Requires nodejs >= 8.

```
# for canvas
sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev \
  build-essential g++

npm update
```


## Usage

```
mkdir out
node headless.js \
  --file examples/example.lgo \
  --out out/example
```

This will execute the code from `example.lgo` and store the image and text
along with other outputs with the specified prefix.
