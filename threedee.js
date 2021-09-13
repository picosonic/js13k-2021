// Based on tutorial at https://www.youtube.com/watch?v=XgMWc6LumG4 by @Javidx9
// Part #2 - Normals, Culling, Lighting & Mesh Loading

// OpenGL default palette
var palette=[
  [102, 102, 102], // 0 "darkgrey"
  [255, 0, 0], // 1 "red"
  [0, 255, 0], // 2 "green"
  [0, 0, 255], // 3 "blue"
  [0, 255, 255], // 4 "cyan"
  [255, 0, 255], // 5 "magenta"
  [255, 255, 0], // 6 "yellow"
  [255, 255, 255], // 7 "white"
  [0, 0, 0], // 8 "black"
  [127, 0, 0], // 9 "darkred"
  [0, 127, 0], // 10 "darkgreen"
  [0, 0, 127], // 11 "darkblue"
  [0, 127, 127], // 12 "darkcyan"
  [127, 0, 127], // 13 "darkmagenta"
  [127, 127, 0], // 14 "darkyellow"
  [204, 204, 204] // 15 "lightgrey"
];

// Projection matrix values
var fnear=0.1; // Near plane (Z)
var ffar=1000; // Far plane (Z)
var ffov=90; // Field of view in degrees
var faspectratio=400/400; // Screen aspect ratio
var ffovrad=1/Math.tan((ffov/2)/(180*Math.PI)); // Tangent of field of view calculation in radians
var run3d=false;
var lx=0.1;

var xmax=400;
var ymax=400;

const PIOVER180=(Math.PI/180);

// Deep clone an object
function deepclone(obj)
{
  return JSON.parse(JSON.stringify(obj));
}

// ***************************************************************************

// Single vertex
class vec3d
{
  constructor(x, y, z)
  {
    this.x=x||0;
    this.y=y||0;
    this.z=z||0;
  }

  set(x, y, z)
  {
    this.x=x||0;
    this.y=y||0;
    this.z=z||0;
  }
}

// Simplest 3D primative, contains 3 vertices
class triangle
{
  constructor(a=undefined, b=undefined, c=undefined, red=255, green=255, blue=255)
  {
    this.p=new Array(3);
    this.shade=1; // How illuminated the triangle is 1=100%

    this.r=red;
    this.g=green;
    this.b=blue;

    if ((a==undefined) && (b==undefined) && (c==undefined))
    {
      var tri=new vec3d(0, 0, 0);

      this.p[0]=deepclone(tri);
      this.p[1]=deepclone(tri);
      this.p[2]=deepclone(tri);
    }
    else
    {
      this.p[0]=deepclone(a);
      this.p[1]=deepclone(b);
      this.p[2]=deepclone(c);
    }
  }
}

// Contains a collection of triangles
class mesh
{
  constructor()
  {
    this.tris=[];
  }

  cleartris()
  {
    this.tris=[];
  }

  addtri(tri)
  {
    this.tris.push(deepclone(tri));
  }

  addface(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, b)
  {
    var t1=new vec3d(x1, y1, z1);
    var t2=new vec3d(x2, y2, z2);
    var t3=new vec3d(x3, y3, z3);
    var tri=new triangle(t1, t2, t3, r, g, b);

    this.addtri(tri);
  }

  len()
  {
    return this.tris.length;
  }

  get(n)
  {
    return this.tris[n];
  }

  loadfromobject(obj)
  {
    if (obj==undefined) return;
    
    var scale=obj.s*0.005;

    for (var i=0; i<obj.f.length; i++)
    {
      var v1=obj.f[i][0];
      var v2=obj.f[i][1];
      var v3=obj.f[i][2];
      var r=255;
      var g=255;
      var b=255;

      // Use face colour from object if available
      if ((obj.c!=undefined) && (obj.c[i]!=undefined) && (palette[obj.c[i]]!=undefined))
      {
        r=palette[obj.c[i]][0];
        g=palette[obj.c[i]][1];
        b=palette[obj.c[i]][2];
      }

      this.addface(obj.v[v1-1][0]*scale, obj.v[v1-1][1]*scale, obj.v[v1-1][2]*scale,
                   obj.v[v2-1][0]*scale, obj.v[v2-1][1]*scale, obj.v[v2-1][2]*scale,
                   obj.v[v3-1][0]*scale, obj.v[v3-1][1]*scale, obj.v[v3-1][2]*scale,
                   r, g, b);
    }
  }
}

class mat4x4
{
  constructor()
  {
    this.m=new Array(4*4);
    this.m.fill(0);
  }

  set(x, y, value)
  {
    this.m[(y*4)+x]=value;
  }

  get(x, y)
  {
    return this.m[(y*4)+x];
  }
}

class engine3D
{
  constructor()
  {
    // Save canvas object and 2d context for it
    this.canvas=document.getElementById('threedee');
    this.ctx=this.canvas.getContext('2d', { alpha:false});
    this.ctx.imageSmoothingEnabled=false;
    this.ctx.mozimageSmoothingEnabled=false;

    // Timestamp for start of render
    this.starttime=null;

    this.meshcube=new mesh();
    this.matproj=new mat4x4();

    // Position camera in 3D space always 0,0,0
    this.vcamera=new vec3d(0, 0, 0);

    this.theta=0;

    this.matproj.set(0, 0, faspectratio*ffovrad);
    this.matproj.set(1, 1, ffovrad);
    this.matproj.set(2, 2, ffar/(ffar-fnear));
    this.matproj.set(3, 2, (-ffar*fnear)/(ffar-fnear));
    this.matproj.set(2, 3, 1);
    this.matproj.set(3, 3, 0);
  
    this.theta=4.3;
    
    // The active 3D models
    this.activemodels=[];
  }

  // Generate a UUID v4 as per RFC 4122
  uuidv4()
  {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Add models to active models
  addmodel(model, x, y, z, rotx, roty, rotz)
  {
    var obj=deepclone(model);

    obj.id=this.uuidv4();

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

    obj.s*=10;

    this.activemodels.push(obj);

    return (this.activemodels.length-1);
  }

  // Find 3D model by name
  findmodel(name)
  {
    for (var i=0; i<models.length; i++)
      if (models[i].t==name)
        return models[i];

    return undefined;
  }

  // Add a model by name
  addnamedmodel(name, x, y, z, rotx, roty, rotz)
  {
    for (var i=0; i<models.length; i++)
      if (models[i].t==name)
        return this.addmodel(models[i], x, y, z, rotx, roty, rotz);
  }

  // Start engine running
  start()
  {
    run3d=true;
    window.requestAnimationFrame(this.drawframe.bind(this));
  }

  // Stop engine
  stop()
  {
    run3d=false;
  }

  // Draw triangle
  drawtriangle(tri)
  {
    this.ctx.fillStyle=tri.shade;
    this.ctx.strokeStyle=tri.shade;

    this.ctx.beginPath();

    for (var j=0; j<3; j++)
      this.ctx.lineTo(tri.p[j].x, tri.p[j].y);

    this.ctx.lineTo(tri.p[0].x, tri.p[0].y);

    this.ctx.fill();
    this.ctx.stroke();
  }

  // Draw the whole frame
  drawframe(timestamp)
  {
    if (!this.starttime) this.starttime=timestamp;
    var progress=(timestamp-this.starttime)/5000;

    // Clear screen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Set up rotation matrices
    var matrotz=new mat4x4();
    var matrotx=new mat4x4();

//    this.theta+=0.005;
//    this.theta%=(4*Math.PI);

    // Rotation Z
    matrotz.set(0, 0, Math.cos(this.theta));
    matrotz.set(0, 1, Math.sin(this.theta));
    matrotz.set(1, 0, -Math.sin(this.theta));
    matrotz.set(1, 1, Math.cos(this.theta));
    matrotz.set(2, 2, 1);
    matrotz.set(3, 3, 1);

    // Rotation X
    matrotx.set(0, 0, 1);
    matrotx.set(1, 1, Math.cos(this.theta/2));
    matrotx.set(1, 2, Math.sin(this.theta/2));
    matrotx.set(2, 1, -Math.sin(this.theta/2));
    matrotx.set(2, 2, Math.cos(this.theta/2));
    matrotx.set(3, 3, 1);

    var trianglestoraster=new Array();
    
    // Find triangles from active objects
    this.meshcube.cleartris();
    this.activemodels.forEach(function (item, index) {
      this.meshcube.loadfromobject(item);
    }, this);
    
    // Draw triangles
    for (var i=0; i<this.meshcube.len(); i++)
    {
      var tri=this.meshcube.get(i);
      var trirotatedz=new triangle();
      var trirotatedzx=new triangle();
      var triprojected=deepclone(tri);
      var tritranslated;

      // Rotate in Z-Axis
      this.multiplymatrixvector(tri.p[0], trirotatedz.p[0], matrotz);
      this.multiplymatrixvector(tri.p[1], trirotatedz.p[1], matrotz);
      this.multiplymatrixvector(tri.p[2], trirotatedz.p[2], matrotz);

      // Rotate in X-Axis
      this.multiplymatrixvector(trirotatedz.p[0], trirotatedzx.p[0], matrotx);
      this.multiplymatrixvector(trirotatedz.p[1], trirotatedzx.p[1], matrotx);
      this.multiplymatrixvector(trirotatedz.p[2], trirotatedzx.p[2], matrotx);

      // Offset into the screen
      tritranslated=deepclone(trirotatedzx);
      tritranslated.p[0].z=trirotatedzx.p[0].z+70;
      tritranslated.p[1].z=trirotatedzx.p[1].z+70;
      tritranslated.p[2].z=trirotatedzx.p[2].z+70;

      // Use cross product to get surface normal
      var line1=new vec3d(tritranslated.p[1].x-tritranslated.p[0].x, tritranslated.p[1].y-tritranslated.p[0].y, tritranslated.p[1].z-tritranslated.p[0].z);
      var line2=new vec3d(tritranslated.p[2].x-tritranslated.p[0].x, tritranslated.p[2].y-tritranslated.p[0].y, tritranslated.p[2].z-tritranslated.p[0].z);
      var normal=new vec3d((line1.y*line2.z) - (line1.z*line2.y), (line1.z*line2.x) - (line1.x*line2.z), (line1.x*line2.y) - (line1.y*line2.x));

      // Normalise the normal (give it a length of 1)
      var l=Math.sqrt((normal.x*normal.x) + (normal.y*normal.y) + (normal.z*normal.z));
      normal.x/=l;
      normal.y/=l;
      normal.z/=l;

      // Only render triangles which face viewer (using cross product)
      if ((normal.x * (tritranslated.p[0].x - this.vcamera.x) + 
           normal.y * (tritranslated.p[0].y - this.vcamera.y) +
           normal.z * (tritranslated.p[0].z - this.vcamera.z)) < 0)
      {
        // Illumination
        var lightdir=new vec3d(1, -1.5, -1.5); // light comes from above
        l=Math.sqrt((lightdir.x*lightdir.x) + (lightdir.y*lightdir.y) + (lightdir.z*lightdir.z));
        lightdir.x/=l;
        lightdir.y/=l;
        lightdir.z/=l;

        // Dot product between surface normal and light direction
        var dp=(normal.x*lightdir.x) + (normal.y*lightdir.y) + (normal.z*lightdir.z);
        var ambient=0.1; // 33% minimum light
        var equiv=Math.round(ambient+(dp*255));
        if (equiv>255) equiv=255;
        if (equiv<0) equiv=0;
        equiv=equiv/255;
        triprojected.shade="rgb("+(triprojected.r*equiv)+","+(triprojected.g*equiv)+","+(triprojected.b*equiv)+")";

        // Project triangles from 3D --> 2D
        this.multiplymatrixvector(tritranslated.p[0], triprojected.p[0], this.matproj);
        this.multiplymatrixvector(tritranslated.p[1], triprojected.p[1], this.matproj);
        this.multiplymatrixvector(tritranslated.p[2], triprojected.p[2], this.matproj);

        // Scale into view
        triprojected.p[0].x+=1; triprojected.p[0].y+=1;
        triprojected.p[1].x+=1; triprojected.p[1].y+=1;
        triprojected.p[2].x+=1; triprojected.p[2].y+=1;
        triprojected.p[0].x*=xmax/2;
        triprojected.p[0].y*=ymax/2;
        triprojected.p[1].x*=xmax/2;
        triprojected.p[1].y*=ymax/2;
        triprojected.p[2].x*=xmax/2;
        triprojected.p[2].y*=ymax/2;

        // Store triangle for Z sorting
        trianglestoraster.push(triprojected);
      }
    }

    // Sort triangles from back to front (using average Z value)
    trianglestoraster.sort(function(t1,t2){return ((t2.p[0].z+t2.p[1].z+t2.p[2].z)/3)-((t1.p[0].z+t1.p[1].z+t1.p[2].z)/3)});

    // Rasterise sorted visible triangles
    for (var i=0; i<trianglestoraster.length; i++)
      this.drawtriangle(trianglestoraster[i]);

    // Ask to be called again on the next frame
    if (run3d)
      window.requestAnimationFrame(this.drawframe.bind(this));
    else
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Matrix vector multiplication from input triangle to output triangle using 4x4 matrix
  multiplymatrixvector(i, o, m)
  {
    o.x = i.x * m.get(0, 0) + i.y * m.get(1, 0) + i.z * m.get(2, 0) + m.get(3, 0);
    o.y = i.x * m.get(0, 1) + i.y * m.get(1, 1) + i.z * m.get(2, 1) + m.get(3, 1);
    o.z = i.x * m.get(0, 2) + i.y * m.get(1, 2) + i.z * m.get(2, 2) + m.get(3, 2);

    // Fourth element for 4x4 matrix
    var w = i.x * m.get(0, 3) + i.y * m.get(1, 3) + i.z * m.get(2, 3) + m.get(3, 3);

    // Convert from 4D to 3D cartesian coordinates when w is not 0
    if (w!=0)
    {
      o.x/=w;
      o.y/=w;
      o.z/=w;
    }
  }
}
