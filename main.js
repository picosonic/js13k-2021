// JS 13k 2021 entry

// Game state
var gs={
  // Animation frame of reference
  step:(1/60), // target step time @ 60 fps
  acc:0, // accumulated time since last frame
  lasttime:0, // time of last frame

  // Canvas object
  canvas:null,
  ctx:null,

  static_canvas:null,
  static_ctx:null,
  dynamic_canvas:null,
  dynamic_ctx:null,

  threedee:null,

  knots:480, // speed
  altitude:12500, // feet
  roll:0, // roll angle degrees
  pitch:0, // pitch angle degrees
  compass:0, // compass heading degrees
  hudcolour:"rgba(0, 220, 0, 0.9)",
  timeline:new timelineobj()
};

// Called once per frame
function rafcallback(timestamp)
{
  // First time round, just save epoch
  if (gs.lasttime>0)
  {
    // Determine accumulated time since last call
    gs.acc+=((timestamp-gs.lasttime) / 1000);

    // If it's more than 15 seconds since last call, reset
    if ((gs.acc>gs.step) && ((gs.acc/gs.step)>(60*15)))
      gs.acc=gs.step*2;

    // Process the "steps" since last call
    while (gs.acc>gs.step)
      gs.acc-=gs.step;
  }

  // Remember when we were last called
  gs.lasttime=timestamp;

  // Request that we are called on the next frame
  window.requestAnimationFrame(rafcallback);
}

// Startup called once when page is loaded
function startup()
{
  // Just some debug code to make sure things get included in the closure
  gs.canvas=document.getElementById('threedee');
  gs.ctx=gs.canvas.getContext('2d');

  gs.static_canvas=document.getElementById("hud");
  gs.static_ctx=gs.static_canvas.getContext("2d");
  gs.dynamic_canvas=document.getElementById("hud2");
  gs.dynamic_ctx=gs.dynamic_canvas.getContext("2d");

  drawhud(gs);

  write(gs.ctx, 800, 100, "TEST", 10, "#FF00FF");

  window.requestAnimationFrame(rafcallback);

  console.log(models);
  console.log(gs);
  gs.threedee=new engine3D;
  gs.threedee.start();
}

// Run the startup() once page has loaded
window.onload=function() { startup(); };
