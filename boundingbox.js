function clamp(val, min, max) {
  return Math.max(Math.min(val, max), min);
}

function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.toImageCoordinates = function(w, h) {
  return new Point(w / 2 + this.x, h / 2 - this.y);
}

Point.prototype.toJson = function() {
  return {x: this.x, y: this.y};
}


function BoundingBox(maxWidth, maxHeight, clamp) {
  this.clamp = clamp;
  this.maxWidth = maxWidth;
  this.maxHeight = maxHeight;
  this.width = maxWidth;
  this.height = maxHeight;
  this.min = new Point(maxWidth / 2, maxHeight / 2);
  this.max = new Point(-maxWidth / 2, -maxHeight / 2);
}

BoundingBox.prototype.update = function(x, y) {
  if (this.clamp) {
    x = clamp(x, -this.maxWidth / 2, this.maxWidth / 2);
    y = clamp(y, -this.maxHeight / 2, this.maxHeight / 2);
  }
  this.min.x = Math.round(Math.min(this.min.x, x));
  this.min.y = Math.round(Math.min(this.min.y, y));
  this.max.x = Math.round(Math.max(this.max.x, x));
  this.max.y = Math.round(Math.max(this.max.y, y));
  this.width = Math.round(this.max.x - this.min.x + 1);
  this.height = Math.round(this.max.y - this.min.y + 1);
}

BoundingBox.prototype.toJson = function() {
  return {
    min: this.min.toJson(),
    max: this.max.toJson(),
    width: this.width,
    height: this.height
  }
}

BoundingBox.prototype.toImageCoordinates = function() {
  var min = this.min.toImageCoordinates(this.maxWidth, this.maxHeight);
  var max = this.max.toImageCoordinates(this.maxWidth, this.maxHeight);
  var box = new BoundingBox(this.maxWidth, this.maxHeight, /*clamp=*/false);
  box.update(min.x, min.y);
  box.update(max.x, max.y);
  return box;
}

BoundingBox.prototype.expand = function(margin) {
  this.update(this.min.x - margin, this.min.y - margin);
  this.update(this.max.x + margin, this.max.y + margin);
  return this;
}

module.exports = BoundingBox;
