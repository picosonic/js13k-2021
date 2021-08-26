// JS 13k 2021 entry

// Game state
var gs={
  // Canvas object
  canvas:null,
  ctx:null,

  static_canvas:null,
  static_ctx:null,
  dynamic_canvas:null,
  dynamic_ctx:null,
  knots:480, // speed
  altitude:12500, // feet
  roll:0, // roll angle degrees
  pitch:0, // pitch angle degrees
  compass:0, // compass heading degrees
  hudcolour:"rgba(0, 220, 0, 0.9)",
  timeline:new timelineobj()
};

// Startup called once when page is loaded
function startup()
{
  // Just some debug code to make sure things get included in the closure
  gs.canvas=document.getElementById('canvas');
  gs.ctx=gs.canvas.getContext('2d');

  gs.static_canvas=document.getElementById("hud");
  gs.static_ctx=gs.static_canvas.getContext("2d");
  gs.dynamic_canvas=document.getElementById("hud2");
  gs.dynamic_ctx=gs.dynamic_canvas.getContext("2d");

  drawhud(gs);

  write(gs.ctx, 100, 100, "TEST", 10, "#FF00FF");

  console.log(models);
  console.log(gs);
}

// Run the startup() once page has loaded
window.onload=function() { startup(); };
