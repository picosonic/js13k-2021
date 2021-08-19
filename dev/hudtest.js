var vw=1280;
var vh=720;

// In-game variables
var gs={
  static_canvas:null,
  static_ctx:null,
  dynamic_canvas:null,
  dynamic_ctx:null,
  knots:480, // speed
  altitude:12500, // feet
  roll:0, // roll angle degrees
  pitch:0, // pitch angle degrees
  compass:0, // compass heading degrees
  hudcolour:"rgba(0, 220, 0, 0.9)"
};

// Adjust values
var rolldir=1;
var altdir=10;
var knotsdir=1;
var pitchdir=0.5;

function testspeed()
{
  gs.knots+=knotsdir;
  
  if ((gs.knots>(knmach*2)) || (gs.knots<1))
    knotsdir*=-1;
}

function testaltitude()
{
  gs.altitude+=altdir;

  if ((gs.altitude>45000) || (gs.altitude<10))
    altdir*=-1;
}

function testpitch()
{
  gs.pitch+=pitchdir;

  if ((gs.pitch>=30) || (gs.pitch<=-30))
    pitchdir*=-1;
}

function testroll()
{
  gs.roll+=rolldir;

  if ((gs.roll>45) || (gs.roll<-45))
    rolldir*=-1;
    
  gs.compass+=rolldir;
  if (gs.compass<0) gs.compass=360+gs.compass;
  if (gs.compass>360) gs.compass=gs.compass-360;
}

function moveclouds()
{
  var clouds=document.getElementById("clouds");

  clouds.style.backgroundPosition=""+(((gs.roll+45)/90)*100)+"% "+(100-(((gs.pitch+30)/60)*100))+"%";
}

function rotatedynamic()
{
  gs.dynamic_canvas.style.transform="rotate("+gs.roll+"deg)";
}

function dotest()
{
  testroll();
  testspeed();
  testaltitude();
  testpitch();
  
  drawhud(gs);

  moveclouds();
  rotatedynamic();
}

function startup()
{
  gs.static_canvas=document.getElementById("static_hud");
  gs.static_ctx=gs.static_canvas.getContext("2d");
  gs.dynamic_canvas=document.getElementById("dynamic_hud");
  gs.dynamic_ctx=gs.dynamic_canvas.getContext("2d");
 
  dotest();
  
  setInterval(function(){ dotest(); }, 125);
}

// Run the startup() once page has loaded
window.onload=function() { startup(); };
