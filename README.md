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
  --out_image out/out.png \
  --out_text out/out.txt
```

This will execute the code from `example.lgo` and store the image and text
outputs.
