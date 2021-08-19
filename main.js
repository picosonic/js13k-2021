// JS 13k 2021 entry

// Game state
var gs={
  // Canvas object
  canvas:null,
  ctx:null,
};

// Startup called once when page is loaded
function startup()
{
  gs.canvas=document.getElementById('canvas');
  gs.ctx=gs.canvas.getContext('2d');

  write(gs.ctx, 100, 100, "TEST", 10, "#FF00FF");

  console.log(models);
  console.log(gs);
}

// Run the startup() once page has loaded
window.onload=function() { startup(); };
