module.exports = {
  read: function(s) {
    throw "Not supported";
  },
  write: function() {
    var args = Array.prototype.slice.call(arguments);
    console.log(args.join('').trim());
  },
  clear: function() {
    console.info("<Clear text>");
  },
  readback: function() {
    throw "Not supported";
  },
  get textsize() {
    throw "Not supported";
  },
  set textsize(height) {
    throw "Not supported";
  },
  get font() {
    throw "Not supported";
  },
  set font(name) {
    throw "Not supported";
  },
  get color() {
    throw "Not supported";
  },
  set color(color) {
    throw "Not supported";
  }
};
