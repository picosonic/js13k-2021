// JS 13k 2021 entry

// Game state
var gs={
  // Animation frame of reference
  step:(1/60), // target step time @ 60 fps
  acc:0, // accumulated time since last frame
  lasttime:0, // time of last frame

  // Control state
  gamepad:-1,
  gamepadbuttons:[], // Button mapping
  gamepadaxes:[], // Axes mapping
  gamepadaxesval:[], // Axes values

  // SVG interface
  svg:new svg3d(),

  // Active 3D models
  activemodels:[],
  sea:{},

  // Characters
  player:{id:null, keystate:0, padstate:0}, // input bitfield [straferight][strafeleft][action][down][right][up][left]
  carrier:{id:null, keystate:0, padstate:0}, // input bitfield [straferight][strafeleft][action][down][right][up][left]
  thiskey:0,
  lastkey:0,
  leanx:0,
  leany:0,
  leanz:0,
  npcs:[],
  score:0,
  thrust:0,
  landed:false,

  // Aircraft HUD
  static_canvas:null,
  static_ctx:null,
  dynamic_canvas:null,
  dynamic_ctx:null,
  scale:1,
  
  // Aircraft flight targets
  rolltarget:0,
  pitchtarget:0,

  // Aircraft flight metrics
  knots:0, // speed
  altitude:70, // feet
  roll:0, // roll angle degrees
  pitch:0, // pitch angle degrees
  compass:0, // compass heading degrees
  hudcolour:"rgba(0, 220, 0, 0.9)",

  randoms:new randomizer(3,6,6,4),
  timeline:new timelineobj(),
  state:0, // 0=intro, 1=title, 2=ingame 3=completed
};

///////////////////////////////////

var audioContext=new (window.webkitAudioContext || window.AudioContext)();
var throttle=0;

function createBrownNoise()
{
  var lastOut = 0.0;
  var node = audioContext.createScriptProcessor(4096, 1, 1);
  node.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);
      for (var i = 0; i < 4096; i++) {
          var white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // (roughly) compensate for gain
      }
  }
  return node;
}

var brownNoise = createBrownNoise();
var brownGain = audioContext.createGain();

brownGain.gain.value = 0;
brownNoise.connect(brownGain);
//brownGain.connect(audioContext.destination);

var panNode=audioContext.createStereoPanner();
panNode.connect(audioContext.destination);

brownGain.connect(panNode);

///////////////////////////////////

function updateposition()
{
  var dbg="";

  dbg+="X:"+Math.floor(gs.svg.tranx)+" Y:"+Math.floor(gs.svg.trany)+" Z:"+Math.floor(gs.svg.tranz)+"<br/>";
  dbg+="RX:"+Math.floor(gs.svg.rotx)+" RY:"+Math.floor(gs.svg.roty)+" RZ:"+Math.floor(gs.svg.rotz)+"<br/>";
  dbg+="KEY:"+gs.player.keystate;
  if (gs.gamepad!=-1) dbg+=" PAD:"+gs.player.padstate;
  dbg+="<br/>INV "+gs.npcs.length;

  console.log(dbg);
}

// Clear both keyboard and gamepad input state
function clearinputstate(character)
{
  character.keystate=0;
  character.padstate=0;
}

// Check if an input is set in either keyboard or gamepad input state
function ispressed(character, keybit)
{
  return (((character.keystate&keybit)!=0) || ((character.padstate&keybit)!=0));
}

// Update the position of players/enemies
function updatemovements(character)
{
  // Move player when a key is pressed
  if ((character.keystate!=0) || (character.padstate!=0))
  {
    var val=0;

    // Left key
    if ((ispressed(character, 1)) && (!ispressed(character, 4)))
    {
      if ((character.padstate&1)!=0)
        val=gs.gamepadaxesval[0];
      else
        val=-1;

      // Yaw - Turn L/R
      gs.svg.roty+=val*2;
      gs.leanx=-val*50;
      gs.leany=-val*50;
    }

    // Right key
    if ((ispressed(character, 4)) && (!ispressed(character, 1)))
    {
      if ((character.padstate&4)!=0)
        val=gs.gamepadaxesval[0];
      else
        val=1;

      // Yaw - Turn L/R
      gs.svg.roty+=val*2;
      gs.leanx=-val*50;
      gs.leany=-val*50;
    }

    // Up key
    if ((ispressed(character, 2)) && (!ispressed(character, 8)))
    {
      if ((character.padstate&2)!=0)
        val=gs.gamepadaxesval[1];
      else
        val=-1;

      // Pitch - F/B
      gs.svg.tranx+=(val*36)*Math.sin(gs.svg.roty*PIOVER180);
      gs.svg.tranz+=(val*36)*Math.cos(gs.svg.roty*PIOVER180);

      //gs.leanz=-25;
      gs.pitchtarget=-10;

      // Collective Up/Down
      gs.svg.trany-=val*16;
    }
    else
    {
      gs.svg.tranx-=15*Math.sin(gs.svg.roty*PIOVER180);
      gs.svg.tranz-=15*Math.cos(gs.svg.roty*PIOVER180);
    }

    // Down key
    if ((ispressed(character, 8)) && (!ispressed(character, 2)))
    {
      if ((character.padstate&8)!=0)
        val=gs.gamepadaxesval[1];
      else
        val=1;

      // Pitch - F/B
      gs.svg.tranx+=(val*24)*Math.sin(gs.svg.roty*PIOVER180);
      gs.svg.tranz+=(val*24)*Math.cos(gs.svg.roty*PIOVER180);

      //gs.leanz=25;
      gs.pitchtarget=10;

      // Collective Up/Down
      gs.svg.trany-=val*16;
    }
    
    // Prevent angle over/underflow
    if (gs.svg.rotx<0) gs.svg.rotx=360+gs.svg.rotx;
    if (gs.svg.roty<0) gs.svg.roty=360+gs.svg.roty;
    if (gs.svg.rotz<0) gs.svg.rotz=360+gs.svg.rotz;

    if (gs.svg.rotx>360) gs.svg.rotx-=360;
    if (gs.svg.roty>360) gs.svg.roty-=360;
    if (gs.svg.rotz>360) gs.svg.rotz-=360;

    // Action key
    if (ispressed(character, 16))
    {
    }

    // Strafe left key
    if ((ispressed(character, 32)) && (!ispressed(character, 64)))
    {
      val=50;

      // Roll - Sidestep / Strafe L/R
      gs.svg.tranx+=val*Math.sin((gs.svg.roty+90)*PIOVER180);
      gs.svg.tranz+=val*Math.cos((gs.svg.roty+90)*PIOVER180);
    }

    // Strafe right key
    if ((ispressed(character, 64)) && (!ispressed(character, 32)))
    {
      val=-50;

      // Roll - Sidestep / Strafe L/R
      gs.svg.tranx+=val*Math.sin((gs.svg.roty+90)*PIOVER180);
      gs.svg.tranz+=val*Math.cos((gs.svg.roty+90)*PIOVER180);
    }
  }
  else
  {
    // Continue forwards if nothing pressed
    gs.svg.tranx-=gs.thrust*Math.sin(gs.svg.roty*PIOVER180);
    gs.svg.tranz-=gs.thrust*Math.cos(gs.svg.roty*PIOVER180);
  }

  // Neither up/down, so set pitch target to centreline
  if ((character.keystate==0) || ((!ispressed(character, 2)) && (!ispressed(character, 8))))
    gs.pitchtarget=0;

  gs.dynamic_canvas.style.transform="scale("+gs.scale+") rotate("+gs.roll+"deg)";

  // Do a dampened lean return
  if (gs.leanx>0) gs.leanx-=gs.leanx>2?2:1;
  if (gs.leanx<0) gs.leanx+=gs.leanx<-2?2:1;

  if (gs.leany>0) gs.leany-=gs.leany>2?2:1;
  if (gs.leany<0) gs.leany+=gs.leany<-2?2:1;

  if (gs.leanz>0) gs.leanz-=gs.leanz>2?2:1;
  if (gs.leanz<0) gs.leanz+=gs.leanz<-2?2:1;
  
  panNode.pan.setValueAtTime(gs.leanx/100, audioContext.currentTime);

  // Rotate new level to flat
  if (gs.svg.rotz>20) gs.svg.rotz-=0.25;
}

function angle2d(x1, y1, x2, y2)
{
  var result=(Math.atan2(y2-y1,x2-x1)*(180/Math.PI));

  return result;
}

// Distance between 2 [x,y,z] points
function distance3d(x1, y1, z1, x2, y2, z2)
{
  return (
    Math.sqrt(
      Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2) + Math.pow(z2-z1, 2)
    )
  );
}

// Roughly see if two points have overlap
function overlap3d(x1, y1, z1, x2, y2, z2, overlap)
{
  var dx=Math.abs(Math.max(x1, x2)-Math.min(x1, x2));
  var dy=Math.abs(Math.max(y1, y2)-Math.min(y1, y2));
  var dz=Math.abs(Math.max(z1, z2)-Math.min(z1, z2));

  return ((dx<overlap) && (dy<overlap) && (dz<overlap));
}

// Find a model with matching id
function findmodelbyid(id)
{
  for (var i=0; i<gs.activemodels.length; i++)
  {
    if (gs.activemodels[i].id==id)
      return i;
  }

  return -1;
}

// Switch model colours
function swapcolours(modelid, source, target)
{
  try
  {
    if (modelid==-1) return;

    for (var i=0; i<gs.activemodels[modelid].c.length; i++)
      if (gs.activemodels[modelid].c[i]==source)
        gs.activemodels[modelid].c[i]=target;
  }

  catch (e) {}
}

// Remove all NPCs
function removenpcs()
{
  for (var i=0; i<gs.npcs.length; i++)
  {
    var npc=findmodelbyid(gs.npcs[i]);
    if (npc!=-1)
      gs.activemodels.splice(npc, 1);
  }

  // Wipe NPC array
  gs.npcs=[];
}

// Remove all models
function removeallmodels()
{
  removenpcs();
  gs.activemodels=[];
}

// Determine if level completed
function levelcompleted()
{
  // Check for landing
  if (((gs.svg.roty>=345) || (gs.svg.roty<=15)) // aligned as per take-off
    && (gs.altitude>=0) && (gs.altitude<=70) // altitude ok
    && (gs.knots>=50) && (gs.knots<=65) // speed ok
    && (gs.tranx>=472) && (gs.tranx<=679) // x position ok
    && (gs.tranz>=692) && (gs.tranz<=10730)) // y position ok
  {
    gs.landed=true;
    return true;
  }

  // x=692 to z=10730
  // x=472 to z=6765

  // Check for crash
  return ((gs.altitude<0) || (gs.npcs.length==0));
}

// Update the text HUD
function updatetxthud()
{
  clear(gs.svg.svghud);

  switch (gs.state)
  {
    case 1:
      writeseg(gs.svg.svghud, 120, 100, "AIRSPACE", "gold", 1);
      writeseg(gs.svg.svghud, 240, 150, "ALPHA ZULU", "gold", 0.35);
      writeseg(gs.svg.svghud, 60, 350, "WASD/CURSORS/SPACE/ENTER/GAMEPAD TO PLAY", "gold", 0.25);
      break;

    case 2:
      // TODO playing
      break;

    case 3:
      if ((gs.landed) || (gs.altitude>0))
      {
        writeseg(gs.svg.svghud, 50, 170, "YOU'VE DONE IT", "gold", 0.75);
        writeseg(gs.svg.svghud, 55, 240, "THE STEALTH JET IS HOME SAFE", "gold", 0.35);
        writeseg(gs.svg.svghud, 100, 350, "PRESS FIRE TO PLAY AGAIN", "gold", 0.25);
      }
      else
      {
        writeseg(gs.svg.svghud, 175, 170, "FAILED", "red", 1);
        writeseg(gs.svg.svghud, 70, 240, "YOU'VE CRASHED INTO THE SEA", "red", 0.35);
        writeseg(gs.svg.svghud, 100, 350, "PRESS FIRE TO GO BACK AND TRY AGAIN", "gold", 0.25);
      }
      break;

    default:
      break;
  }
}

function addnpcs(count)
{
  // Remove NPCs from previous level
  removenpcs();

  // Add some new invaders
  for (var n=0; n<count; n++)
  {
    var o=addnamedmodel("stealth", gs.randoms.rnd(10000)-5000, 800, 0-gs.randoms.rnd(10000), 0, gs.randoms.rnd(360), 0);

    gs.activemodels[o].s=0.1;
    applymodelrotation(o, 270, 0, 270);

    gs.npcs.push(gs.activemodels[o].id);

    gs.activemodels[o].vx=25*Math.sin(gs.activemodels[o].roty*PIOVER180);
    gs.activemodels[o].vz=-25*Math.cos(gs.activemodels[o].roty*PIOVER180);
  }
}

// Update the game world state
function update()
{
  if (gs.state!=2) return;

  if (levelcompleted())
  {
    gs.state=3;
    gs.level=1;
    gs.lastkey=0; gs.thiskey=0;

    updatetxthud();

    removeallmodels();
    
    clearhud(gs);

    throttle=0;
    brownGain.gain.value=throttle;

    // Start a timeout before allowing keys
    gs.timeline.reset();
    gs.timeline.add(1000, function(){ window.requestAnimationFrame(awaitkeyboard); });
    gs.timeline.begin();

    return;
  }

  // Apply keystate to player
  updatemovements(gs.player);

  // If player out of bounds, then reset
  if ((gs.svg.tranx<-10000) ||
   (gs.svg.tranx>10000) ||
   (gs.svg.tranz<0) ||
   (gs.svg.tranz>20000))
  {
    gs.svg.tranx=0;
    gs.svg.tranz=5000;
  }

  // Keep player in view
  gs.activemodels[gs.player.id].x=-gs.svg.tranx;
  gs.activemodels[gs.player.id].y=-gs.svg.trany;
  gs.activemodels[gs.player.id].z=-gs.svg.tranz;

  gs.activemodels[gs.player.id].rotx=-gs.svg.rotx;
  gs.activemodels[gs.player.id].roty=-gs.svg.roty;
  gs.activemodels[gs.player.id].rotz=0;

  // Update player angle
  gs.activemodels[gs.player.id].rotx+=gs.leanx;
  gs.activemodels[gs.player.id].roty+=gs.leany;
  gs.activemodels[gs.player.id].rotz+=gs.leanz;

//  gs.compass=Math.atan2(2*Math.sin(gs.activemodels[gs.player.id].roty*PIOVER180), 2*Math.cos(gs.activemodels[gs.player.id].roty*PIOVER180))*(180/Math.PI);
  gs.compass=gs.svg.roty;
  gs.altitude=-gs.svg.trany-70;
  gs.rolltarget=gs.leanx;
  gs.knots=gs.thrust*4;

  // Dappen roll
  if (gs.roll<gs.rolltarget) gs.roll++;
  if (gs.roll>gs.rolltarget) gs.roll--;

  // Dappen pitch
  if (gs.pitch<gs.pitchtarget) gs.pitch+=0.2;
  if (gs.pitch>gs.pitchtarget) gs.pitch-=0.2;
  
  if (throttle==0)
    gs.thrust=0;

  // Loose altitude if we are stalling
  if (gs.knots<=50)
    gs.svg.trany+=5;
    
 // updateposition();
  drawhud(gs);
 
  // Move object by velocity (if required)
  gs.activemodels.forEach(function (item, index) {
    item.x+=item.vx;
    item.y+=item.vy;
    item.z+=item.vz;
  });

  // Move enemies around
  for (var i=0; i<gs.npcs.length; i++)
  {
    var npcid=findmodelbyid(gs.npcs[i]);
    if (npcid==-1) continue;
    var angle=gs.activemodels[npcid].roty;

    // Change direction sometimes
    if (gs.randoms.rnd(250)<10)
    {
      // Randomize a new angle
      angle=(gs.activemodels[npcid].roty+(gs.randoms.rnd(50)-25))%360;
      gs.activemodels[npcid].roty=angle;

      // Set new movement vector
      gs.activemodels[npcid].vx=25*Math.sin(angle*PIOVER180);
      gs.activemodels[npcid].vz=-25*Math.cos(angle*PIOVER180);
    }

    // If out of bounds, then set on a new random course
    if ((gs.activemodels[npcid].x<-5000) ||
       (gs.activemodels[npcid].z<-10000) ||
       (gs.activemodels[npcid].x>5000) ||
       (gs.activemodels[npcid].z>0))
    {
      // Randomize a new angle
      angle=(gs.activemodels[npcid].roty+180+gs.randoms.rnd(45))%360;
      gs.activemodels[npcid].roty=angle;

      // Set new movement vector
      gs.activemodels[npcid].vx=25*Math.sin(angle*PIOVER180);
      gs.activemodels[npcid].vz=-25*Math.cos(angle*PIOVER180);

      // Move enemy away from boundary
      gs.activemodels[npcid].x+=gs.activemodels[npcid].vx;
      gs.activemodels[npcid].z+=gs.activemodels[npcid].vz;
    }
  }

  updatetxthud();
}

// Request animation frame callback
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

    var progress=timestamp/100;

    // Gamepad support
    if (!!(navigator.getGamepads))
      gamepadscan();

    // Process "steps" since last call
    while (gs.acc>gs.step)
    {
      update();
      gs.acc-=gs.step;
    }

    // Render the game world
    gs.svg.render(progress);
  }

  // Remember when we were last called
  gs.lasttime=timestamp;

  // Request we are called on the next frame if still playing
  if (gs.state==2)
    window.requestAnimationFrame(rafcallback);
}

// Handle resize events
function playfieldsize()
{
  var xmax=960;
  var ymax=540;
  var height=window.innerHeight;
  var aspectratio=xmax/ymax;
  var ratio=xmax/ymax;
  var width=Math.floor(height*ratio);
  var top=0;
  var left=Math.floor((window.innerWidth/2)-(width/2));

  if ((window.innerWidth/window.innerHeight)<aspectratio)
  {
    width=window.innerWidth;
    ratio=ymax/xmax;
    height=Math.floor(width*ratio);
    left=0;
    top=Math.floor((window.innerHeight/2)-(height/2));
  }
  
  left+=(width/5);
  
  gs.scale=(height/ymax);

  gs.static_canvas.style.top=top+"px";
  gs.static_canvas.style.left=left+"px";
  gs.static_canvas.style.transformOrigin='0 0';
  gs.static_canvas.style.transform='scale('+gs.scale+')';

  gs.dynamic_canvas.style.top=((window.innerHeight/2)-(gs.static_canvas.height/2))+"px";
  gs.dynamic_canvas.style.left=(((window.innerWidth/2)-(gs.static_canvas.width/2))+(gs.static_canvas.width/16))+"px";
  gs.dynamic_canvas.style.transformOrigin='center';
  gs.dynamic_canvas.style.transform='scale('+gs.scale+')';

  gs.svg.resize();
}

function generatesea(gridx, gridy, gridsize)
{
  var sea={t:"sea", w:gridx, d:gridy, tilesize:gridsize, heightmap:[], v:[], f:[], c:[], s:10, x:0, y:0, z:0};
  var maxheight=10;

  for (var y=0; y<gridy; y++)
    for (var x=0; x<gridx; x++)
    {
      if (x>0)
        sea.heightmap[(y*gridx)+x]=sea.heightmap[(y*gridx)+(x-1)]+(gs.randoms.rnd(maxheight/2)-(maxheight/4));
      else
        sea.heightmap[(y*gridx)+x]=gs.randoms.rnd(maxheight);

      sea.v.push([x*gridsize-((gridx*gridsize)/2), (sea.heightmap[(y*gridx)+x]), 0-(y*gridsize)]);
    }

  for (y=1; y<gridy; y++)
    for (x=1; x<gridx; x++)
    {
      var offs=((y*gridx)+x)+1;

      sea.f.push([
      offs,
      offs-1,
      offs-gridy-1
      ]);

      sea.c.push(3);

      sea.f.push([
      offs,
      offs-gridy-1,
      offs-gridy
      ]);

      sea.c.push(3);
    }

  return sea;
}

// Scan for any connected gamepads
function gamepadscan()
{
  var gamepads=navigator.getGamepads();
  var found=0;

  var gleft=false;
  var gright=false;
  var gup=false;
  var gdown=false;
  var gjump=false;

  for (var padid=0; padid<gamepads.length; padid++)
  {
    // Only support first found gamepad
    if ((found==0) && (gamepads[padid] && gamepads[padid].connected))
    {
      found++;

      // If we don't already have this one, add mapping for it
      if (gs.gamepad!=padid)
      {
//        console.log("Found new gamepad "+padid+" '"+gamepads[padid].id+"'");

        gs.gamepad=padid;

        if (gamepads[padid].mapping==="standard")
        {
	  // Browser supported "standard" gamepad
          gs.gamepadbuttons[0]=14; // left (left) d-left
          gs.gamepadbuttons[1]=15; // right (left) d-right
          gs.gamepadbuttons[2]=12; // top (left) d-up
          gs.gamepadbuttons[3]=13; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=3; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="054c-0268-Sony PLAYSTATION(R)3 Controller")
        {
          // PS3 DualShock 3
          gs.gamepadbuttons[0]=15; // left (left) d-left
          gs.gamepadbuttons[1]=16; // right (left) d-right
          gs.gamepadbuttons[2]=13; // top (left) d-up
          gs.gamepadbuttons[3]=14; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=3; // cam left/right axis
          gs.gamepadaxes[3]=4; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="045e-028e-Microsoft X-Box 360 pad")
        {
          // XBOX 360
          // 8Bitdo GBros. Adapter (XInput mode)
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=6; // left/right axis
          gs.gamepadaxes[1]=7; // up/down axis
          gs.gamepadaxes[2]=3; // cam left/right axis
          gs.gamepadaxes[3]=4; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="0f0d-00c1-  Switch Controller")
        {
          // Nintendo Switch
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=1;  // bottom button (right) x

          gs.gamepadaxes[0]=4; // left/right axis
          gs.gamepadaxes[1]=5; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=3; // cam up/down axis
        }
        else
        if ((gamepads[padid].id=="054c-05c4-Sony Computer Entertainment Wireless Controller") || (gamepads[padid].id=="045e-02e0-8Bitdo SF30 Pro") || (gamepads[padid].id=="045e-02e0-8BitDo GBros Adapter"))
        {
          // PS4 DualShock 4
          // 8Bitdo SF30 Pro GamePad (XInput mode)
          // 8Bitdo GBros. Adapter (XInput mode)
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=3; // cam left/right axis
          gs.gamepadaxes[3]=4; // cam up/down axis
        }
        else
        if ((gamepads[padid].id=="054c-0ce6-Sony Interactive Entertainment Wireless Controller") || (gamepads[padid].id=="054c-0ce6-Wireless Controller"))
        {
          // PS5 DualSense
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=1;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=5; // cam up/down axis
        }
        else
        if ((gamepads[padid].id=="057e-2009-Pro Controller") || (gamepads[padid].id=="18d1-9400-Google Inc. Stadia Controller") || (gamepads[padid].id=="18d1-9400-StadiaZYSW-7992"))
        {
          // Nintendo Switch Pro Controller
          // 8Bitdo SF30 Pro GamePad (Switch mode)
          // 8Bitdo GBros. Adapter (Switch mode)
          // Google Stadia Controller (Wired and Bluetooth)
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=3; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="2dc8-6100-8Bitdo SF30 Pro")
        {
          // 8Bitdo SF30 Pro GamePad (DInput mode)
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=1;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=3; // cam up/down axis
        }
        else
        {
          // Unknown non-"standard" mapping
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=-1;  // bottom button (right) x

          gs.gamepadaxes[0]=-1; // left/right axis
          gs.gamepadaxes[1]=-1; // up/down axis
          gs.gamepadaxes[2]=-1; // cam left/right axis
          gs.gamepadaxes[3]=-1; // cam up/down axis
        }
      }

      // Check analog axes
      for (var i=0; i<gamepads[padid].axes.length; i++)
      {
        var val=gamepads[padid].axes[i];

        if (i==gs.gamepadaxes[0])
        {
          gs.gamepadaxesval[0]=val;

          if (val<-0.5) // Left
            gleft=true;

          if (val>0.5) // Right
            gright=true;
        }

        if (i==gs.gamepadaxes[1])
        {
          gs.gamepadaxesval[1]=val;

          if (val<-0.5) // Up
            gup=true;

          if (val>0.5) // Down
            gdown=true;
        }

        if (i==gs.gamepadaxes[2])
          gs.gamepadaxesval[2]=val;

        if (i==gs.gamepadaxes[3])
          gs.gamepadaxesval[3]=val;
      }

      // Check buttons
      for (i=0; i<gamepads[padid].buttons.length; i++)
      {
        var val=gamepads[padid].buttons[i];
        var pressed=val==1.0;

        if (typeof(val)=="object")
        {
          pressed=val.pressed;
          val=val.value;
        }

        if (pressed)
        {
          switch (i)
          {
            case gs.gamepadbuttons[0]: gleft=true; break;
            case gs.gamepadbuttons[1]: gright=true; break;
            case gs.gamepadbuttons[2]: gup=true; break;
            case gs.gamepadbuttons[3]: gdown=true; break;
            case gs.gamepadbuttons[4]: gjump=true; break;
            default: break;
          }
        }
      }

      // Update padstate
      if (gup)
        gs.player.padstate|=2;
      else
        gs.player.padstate&=~2;

      if (gdown)
        gs.player.padstate|=8;
      else
        gs.player.padstate&=~8;

      if (gleft)
        gs.player.padstate|=1;
      else
        gs.player.padstate&=~1;

      if (gright)
        gs.player.padstate|=4;
      else
        gs.player.padstate&=~4;

      if (gjump)
        gs.player.padstate|=16;
      else
        gs.player.padstate&=~16;
    }
  }

  // Detect disconnect
  if ((found==0) && (gs.gamepad!=-1))
  {
//    console.log("Disconnected gamepad "+padid);
    
    gs.gamepad=-1;
  }
}

// Deep clone an object
function clone(obj)
{
  return JSON.parse(JSON.stringify(obj));
}

// Generate a UUID v4 as per RFC 4122
function uuidv4()
{
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function applymodelrotation(id, rotx, roty, rotz)
{
  gs.svg.initmodelrotation(rotx, roty, rotz);
  
  for (var i=0; i<gs.activemodels[id].v.length; i++)
  {
    var nv=gs.svg.rotatevertex(gs.activemodels[id].v[i][0], gs.activemodels[id].v[i][1], gs.activemodels[id].v[i][2]);
    gs.activemodels[id].v[i][0]=nv[0];
    gs.activemodels[id].v[i][1]=nv[1];
    gs.activemodels[id].v[i][2]=nv[2];
  }
}

// Add models to active models
function addmodel(model, x, y, z, rotx, roty, rotz)
{
  var obj=clone(model);

  obj.id=uuidv4();

  // Translation
  obj.x=x;
  obj.y=y;
  obj.z=z;

  // Rotation
  obj.rotx=rotx;
  obj.roty=roty;
  obj.rotz=rotz;

  // Velocity
  obj.vx=0;
  obj.vy=0;
  obj.vz=0;

  // Flags
  obj.flags=0;

  gs.activemodels.push(obj);

  return (gs.activemodels.length-1);
}

// Update the player key state
function updatekeystate(e, dir)
{
  switch (e.which)
  {
    case 37: // cursor left
    case 65: // A
    case 90: // Z
      if (dir==1)
        gs.player.keystate|=1;
      else
        gs.player.keystate&=~1;
      e.preventDefault();
      break;

    case 38: // cursor up
    case 87: // W
    case 59: // semicolon
      if (dir==1)
        gs.player.keystate|=2;
      else
        gs.player.keystate&=~2;
      e.preventDefault();
      break;

    case 39: // cursor right
    case 68: // D
    case 88: // X
      if (dir==1)
        gs.player.keystate|=4;
      else
        gs.player.keystate&=~4;
      e.preventDefault();
      break;

    case 40: // cursor down
    case 83: // S
    case 190: // dot
      if (dir==1)
        gs.player.keystate|=8;
      else
        gs.player.keystate&=~8;
      e.preventDefault();
      break;

    case 13: // enter
    case 32: // space
      if (dir==1)
        gs.player.keystate|=16;
      else
        gs.player.keystate&=~16;
      e.preventDefault();
      break;

    case 81: // Q
      if (dir==1)
        gs.player.keystate|=32;
      else
        gs.player.keystate&=~32;
      e.preventDefault();
      break;

    case 69: // E
      if (dir==1)
        gs.player.keystate|=64;
      else
        gs.player.keystate&=~64;
      e.preventDefault();
      break;

    case 33: // PageUp
      if (dir==1)
      {
        // Check for starting up engine
        if (throttle==0)
          throttle=0.005;

        if (throttle<0.05)
        {
          throttle+=0.0001;
          brownGain.gain.value=throttle;
        }
    
        if (gs.thrust<60) gs.thrust+=0.5;
      }
      e.preventDefault();
      break;

    case 34: // PageDown
      if (dir==1)
      {
        // Check for turning engine off
        if ((throttle<=0.005) || (gs.thrust<=0))
        {
          throttle=0;
          brownGain.gain.value=throttle;
        }

        if (throttle>0)
        {
          throttle-=0.0001;
          brownGain.gain.value=throttle;
        }
    
        if (gs.thrust>0) gs.thrust-=0.5;
      }
      e.preventDefault();
      break;

    case 27: // escape
      e.preventDefault();
      break;

    default:
      break;
  }

  if (dir==1)
    gs.thiskey=e.which;
}

// Add a model by name
function addnamedmodel(name, x, y, z, rotx, roty, rotz)
{
  for (var i=0; i<models.length; i++)
    if (models[i].t==name)
      return addmodel(models[i], x, y, z, rotx, roty, rotz);
}

function startgame()
{
  // World rotation in degrees
  gs.svg.rotx=0;
  gs.svg.roty=350;
  gs.svg.rotz=20;

  // World translation in pixels, to put plane on carrier for launch
  gs.svg.tranx=-27;
  gs.svg.trany=-984;
  gs.svg.tranz=11832;

  // Launch  
  throttle=0.05;
  brownGain.gain.value=throttle;
  gs.thrust=60; gs.knots=0;

  gs.state=2;
  gs.altitude=20;
  gs.landed=false;

  window.requestAnimationFrame(rafcallback);
}

function awaitkeyboard(timestamp)
{
  if (gs.state==1)
  {
    // Render the model
    if (gs.activemodels.length>0)
    {
      gs.svg.render(timestamp/100);
      gs.activemodels[0].rotx=((gs.activemodels[0].rotx+2) % 360);
      gs.activemodels[0].roty=((gs.activemodels[0].roty+2) % 360);
      gs.activemodels[0].rotz=((gs.activemodels[0].rotz+1) % 360);
      if (gs.activemodels[0].s<0.5)
        gs.activemodels[0].s+=0.01;
    }
  }

  // See if something newly pressed
  if (gs.thiskey!=gs.lastkey)
  {
    switch (gs.state)
    {
      case 1: // Title, so start game
        gs.timeline.reset();
        gs.score=0;
        gs.level=1;

        gs.lastkey=0;
        gs.thiskey=0;

        removeallmodels();

        // Generate sea model
        var seax=40, seay=40;
        gs.sea=generatesea(seax, seay, 100);

        gs.player.id=addnamedmodel("stealth", 0, 0, 0, 0, 0, 0);
        applymodelrotation(gs.player.id, 90, 0, 270);
        gs.activemodels[gs.player.id].s=0.1;

        gs.carrier.id=addnamedmodel("cvn-65", -500, 570, -10000, 0, 0, 0);
        gs.activemodels[gs.carrier.id].s=5;
        applymodelrotation(gs.carrier.id, 90, 0, 270);

        addmodel(gs.sea, 0, 0, 0, 0, 0, 0);

        // Add invaders
        addnpcs(2);

        startgame();
        break;

      case 2: // In-game, so already processed
        break;

      case 3: // SUCCESS/FAIL, so return to title
        showtitle();
        break;

      default:
        gs.lastkey=gs.thiskey;
        break;
    }
  }
  else
    window.requestAnimationFrame(awaitkeyboard);
}

function showtitle()
{
  gs.state=1;
  gs.lastkey=0; gs.thiskey=0;

  updatetxthud();

  removeallmodels();

  var o=addnamedmodel("stealth", 0, 0, 0, 0, 0, 0);
  gs.activemodels[0].s=0.01;

  // World rotation in degrees
  gs.svg.rotx=0;
  gs.svg.roty=0;
  gs.svg.rotz=0;

  // World translation in pixels
  gs.svg.tranx=0;
  gs.svg.trany=0;
  gs.svg.tranz=0;

  gs.svg.render(0);

  // Start a timeout before allowing keys
  gs.timeline.reset();
  gs.timeline.add(1000, function(){ window.requestAnimationFrame(awaitkeyboard); });
  gs.timeline.begin();
}

// Entry point
function init()
{
  // Initialise stuff
  document.onkeydown=function(e)
  {
    e = e || window.event;
    updatekeystate(e, 1);
  };

  document.onkeyup=function(e)
  {
    e = e || window.event;
    updatekeystate(e, 0);
  };

  // Stop things from being dragged around
  window.ondragstart=function(e)
  {
    e = e || window.event;
    e.preventDefault();
  };

  // Set up game state
  gs.svg.init();

  // Set up plane HUD
  gs.static_canvas=document.getElementById("static_hud");
  gs.static_ctx=gs.static_canvas.getContext("2d");
  gs.dynamic_canvas=document.getElementById("dynamic_hud");
  gs.dynamic_ctx=gs.dynamic_canvas.getContext("2d");

  window.addEventListener("resize", function() { playfieldsize(); });

  playfieldsize();

  showtitle();
}

// Run the init() once page has loaded
window.onload=function() { init(); };
