// https://www.youtube.com/watch?v=BHx-OWdHqf8

const knmach=661.49; // Mach 1 in knots
const radindeg=Math.PI/180;
const altlow=200; // Altitide at which warning will be given (and below)

function altitudeformat(altitude, full)
{
  var ta=Math.floor(altitude);
  var altstr="";

  if (!full)
    ta=Math.floor(ta/100);

  while (ta>0)
  {
    if ((full) && (altstr.length==3)) altstr=","+altstr;
    if ((!full) && (altstr.length==1)) altstr=","+altstr;

    altstr=""+(ta%10)+""+altstr;

    ta=Math.floor(ta/10);
  }

  return altstr;
}

function drawhud(ps)
{
  var min, max, i;
  var mach=(ps.knots/knmach);
  var tx, ty, ta, tp, tz;

  // Static HUD elements
  var canvas=ps.static_canvas;
  var ctx=ps.static_ctx;

  // Dynamic HUD elements
  var dcanvas=ps.dynamic_canvas;
  var dctx=ps.dynamic_ctx;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle=ps.hudcolour;
  ctx.lineWidth=2;
  
  // Draw horizon line
  ctx.beginPath();
  ctx.moveTo(20, 222); ctx.lineTo(245, 222);
  ctx.moveTo(315, 222); ctx.lineTo(543, 222);
  ctx.stroke();
  
  // Draw flight path marker
  ctx.beginPath();
  ctx.moveTo(256, 175); ctx.lineTo(274, 175);
  ctx.moveTo(290, 175); ctx.lineTo(307, 175);
  ctx.moveTo(282, 158); ctx.lineTo(282, 166);  
  ctx.stroke();
  ctx.beginPath();  ctx.arc(282, 175, 8, 0, 2 * Math.PI); ctx.stroke();
  
  // Draw airspeed calibration
  write(ctx, 126, 211, "C", 2, ps.hudcolour);
  ctx.beginPath();
  ctx.moveTo(121, 230); ctx.lineTo(139, 230);
  ctx.stroke();

  // Draw airspeed scale
  ctx.beginPath();
  ctx.moveTo(49, 220); ctx.lineTo(92, 220);
  ctx.lineTo(102, 230); ctx.lineTo(92, 240);
  ctx.lineTo(49, 240); ctx.lineTo(49, 220);
  ctx.stroke();
  write(ctx, 57, 223, ""+Math.floor(ps.knots), 2, ps.hudcolour);

  min=Math.floor(ps.knots-80); max=Math.floor(ps.knots+80);
  for (i=min; i<max; i++)
  {
    if ((i%50)==0)
    {
      ctx.beginPath();
      ctx.moveTo(107, 294-(((i-min)/10)*8));
      ctx.lineTo(117, 294-(((i-min)/10)*8));
      ctx.stroke();

      tx=87-((i/10>99)?8:0);
      ty=294-(((i-min)/10)*8)-6;
      
      if ((ty<212) || (ty>236))
        write(ctx, tx, ty, ""+(i/10), 2, ps.hudcolour);
    }
    else if ((i%10)==0)
    {
      ctx.beginPath();
      ctx.moveTo(111, 294-(((i-min)/10)*8));
      ctx.lineTo(117, 294-(((i-min)/10)*8));
      ctx.stroke();
    }
  }

  // Draw master arm and mach
  write(ctx, 124, 303, "SIM", 2, ps.hudcolour);
  write(ctx, 120, 322, ""+(mach.toFixed(2)), 2, ps.hudcolour);

  // Draw altimeter calibration
//  write(ctx, 430, 211, "", 2, ps.hudcolour);
  ctx.beginPath();
  ctx.moveTo(426, 230); ctx.lineTo(443, 230);
  ctx.stroke();
  
  // Draw barometric altitude scale
  ctx.moveTo(472, 220); ctx.lineTo(528, 220);
  ctx.lineTo(528, 240); ctx.lineTo(472, 240);
  ctx.lineTo(462, 230); ctx.lineTo(472, 220);
  ctx.stroke();
  write(ctx, 474, 223, ""+altitudeformat(ps.altitude, true), 2, ps.hudcolour);

  min=ps.altitude-800; max=ps.altitude+800;
  for (i=min; i<max; i++)
  {
    if ((i%500)==0)
    {
      ctx.beginPath();
      ctx.moveTo(448, 294-(((i-min)/100)*8));
      ctx.lineTo(458, 294-(((i-min)/100)*8));
      ctx.stroke();

      tx=465;
      ty=294-(((i-min)/100)*8)-6;
      
      if ((ty<212) || (ty>236))
        write(ctx, tx, ty, ""+altitudeformat(i, false), 2, ps.hudcolour);
    }
    else if ((i%100)==0)
    {
      ctx.beginPath();
      ctx.moveTo(448, 294-(((i-min)/100)*8));
      ctx.lineTo(454, 294-(((i-min)/100)*8));
      ctx.stroke();
    }
  }
  
  // Draw radar altitude
  write(ctx, 404, 311, "R", 2, ps.hudcolour);
  ctx.beginPath();
  ctx.moveTo(417, 309); ctx.lineTo(478, 309);
  ctx.lineTo(478, 327); ctx.lineTo(417, 327); ctx.lineTo(417, 309);
  ctx.stroke();

  ta=ps.altitude-650; // Offset by height above sea level
  write(ctx, 424, 311, ""+altitudeformat(ta, true), 2, ps.hudcolour);

  // Draw great circle steering cue
  ctx.beginPath();  ctx.arc(330, 175, 5, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(331, 170); ctx.lineTo(335, 150);
  ctx.stroke();
  
  // Draw steerpoint symbol
  ctx.beginPath();
  ctx.moveTo(353, 198); ctx.lineTo(360, 205);
  ctx.lineTo(353, 212); ctx.lineTo(346, 205); ctx.lineTo(353, 198);
  ctx.stroke();
  
  // Draw pitch ladder
  dctx.clearRect(0, 0, dcanvas.width, dcanvas.height);

  dctx.strokeStyle=ps.hudcolour;
  dctx.lineWidth=2;
  
  tp=ps.pitch;
  tz=222+(tp*35); // Position of zero degrees in pixels from the top

  min=-50; max=50;
  for (i=min; i<max; i+=5)
  {
    if (((i%5)==0) && (i!=0))
    {
      ta=(tz-(i*35));

      if ((ta>(10)) && (ta<470))
      {
        if (i<0)
          dctx.setLineDash([7]);
        else
          dctx.setLineDash([]);

        dctx.beginPath();
      
        dctx.moveTo(212, ta); dctx.lineTo(254, ta); dctx.lineTo(254, ta+(i<0?-10:10));
        dctx.moveTo(352, ta); dctx.lineTo(310, ta); dctx.lineTo(310, ta+(i<0?-10:10));
        dctx.stroke();
       
        write(dctx, 210-(Math.abs(i)>9?16:8), ta-8, ""+Math.abs(i), 2, ps.hudcolour);
        write(dctx, 352, ta-8, ""+Math.abs(i), 2, ps.hudcolour);
      }
    }
  }

  // Draw altitude low setting
  write(ctx, 410, 334, "AL "+altlow, 2, ps.hudcolour);

  // Draw waypoint heading
  // TODO

  // Draw waypoint distance (miles)/number
  write(ctx, 411, 388, "018>01", 2, ps.hudcolour);

  // Draw roll indicator scale
  for (i=-45; i<=45; i+=5)
  {
    if ((i%30==0) || ((i==45) || (i==-45)))
      ta=10;
    else
      ta=5;
    
    if (((i!=40) && (i!=-40)) && ((i%10==0) || (i==45) || (i==-45)))
    {
      ctx.beginPath();
      ctx.moveTo(282+((95*Math.cos((90+(i*1.5))*radindeg))), 326+((95*Math.sin((90+(i*1.5))*radindeg))));
      ctx.lineTo(282+(((95-ta)*Math.cos((90+(i*1.5))*radindeg))), 326+(((95-ta)*Math.sin((90+(i*1.5))*radindeg))));
      ctx.stroke();
    }
  }

  // Draw roll indicator triangle
  i=ps.roll;
  
  // Limit roll indicator to 45 degrees each way
  if (i>45) i=45;
  if (i<-45) i=-45;

  ctx.beginPath();
  ctx.moveTo(282+((95*Math.cos((90+(i*1.5))*radindeg))), 326+((95*Math.sin((90+(i*1.5))*radindeg))));
  ctx.lineTo(282+((105*Math.cos((90+((i+2)*1.5))*radindeg))), 326+((105*Math.sin((90+((i+2)*1.5))*radindeg))));
  ctx.lineTo(282+((105*Math.cos((90+((i-2)*1.5))*radindeg))), 326+((105*Math.sin((90+((i-2)*1.5))*radindeg))));
  ctx.lineTo(282+((95*Math.cos((90+(i*1.5))*radindeg))), 326+((95*Math.sin((90+(i*1.5))*radindeg))));
  ctx.stroke();
    
  // Draw gun cross
  ctx.beginPath();
  ctx.moveTo(282, 49); ctx.lineTo(282, 59);
  ctx.moveTo(282, 65); ctx.lineTo(282, 75);
  
  ctx.moveTo(269, 62); ctx.lineTo(279, 62);
  ctx.moveTo(285, 62); ctx.lineTo(295, 62);
  ctx.stroke();
  
  // Draw compass, marks each 5 degrees, max of 5 markers
  tp=Math.floor(ps.compass+360);
  min=tp-10;
  max=tp+10;
  for (i=min; i<max; i++)
  {
    if (i%5==0)
    {
      ta=((i-min)*10);
      ctx.moveTo(197+ta, 107); ctx.lineTo(197+ta, 112);
      ctx.stroke();

      if ((i%10==0) && ((190+ta<252) || (190+ta>298)))
      {
        tx=Math.floor((i-360)/10);
        if (tx<0) tx=360+tx;
        if (tx==36) tx=0;
        write(ctx, 190+ta, 118, ""+(tx<10?"0":"")+tx, 2, ps.hudcolour);
      }
    }
  }
  
  ctx.beginPath();
  ctx.moveTo(282, 90); ctx.lineTo(282, 105);
  ctx.rect(268, 116, 30, 22);
  ctx.stroke();

  tp-=360;
  write(ctx, 270, 120, ""+(tp<10?"00":(tp<100?"0":""))+tp, 2, ps.hudcolour);
  
  // Draw operating mode
  write(ctx, 93, 356, "NAV", 2, ps.hudcolour);
  
  // Draw max Gs
  write(ctx, 93, 338, "8.1", 2, ps.hudcolour);
}

