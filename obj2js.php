<?php

// Convert a wavefront .obj file into .js object

// First check we have an input and output filename
if ((!isset($argc)) || ($argc<3))
{
  echo "Specify <input.obj> and <output.js> on command line\n";
  echo "optionally also specify [<scale> <set>] on command line\n";
  exit(0);
}

$input_file=$argv[1];
$output_file=$argv[2];

// Next check input exists
if (!file_exists($input_file))
{
  echo "Unable to read input file\n";
  exit(0);
}

// Check for optional set argument when model is to be part of a set
$set=false;
if ($argc==4)
  $set=$argv[3]==="set";

// Check for optional scale argument
if ($argc==5)
  $scale=$argv[4];
else
  $scale="1";

// Next gather some stats on first pass
$num_verts=0;
$num_faces=0;
$min_x=9999999;
$max_x=-9999999;
$min_y=9999999;
$max_y=-9999999;
$min_z=9999999;
$max_z=-9999999;
$min_face=9999999;
$max_face=-9999999;

$cur_tex=7; // White
$vertices=array();
$faces=array();

$handle=fopen($input_file, "r");
if ($handle)
{
  while (($line=fgets($handle))!==false)
  {
    $line=ltrim(rtrim($line));

    if (substr($line, 0, 2)==="v ")
    {
      $num_verts++;

      $verts=explode(" ", $line);

      $x=intval($verts[1]);
      $y=intval($verts[2]);
      $z=intval($verts[3]);

      if ($x<$min_x) $min_x=$x;
      if ($x>$max_x) $max_x=$x;
      if ($y<$min_y) $min_y=$y;
      if ($y>$max_y) $max_y=$y;
      if ($z<$min_z) $min_z=$z;
      if ($z>$max_z) $max_z=$z;

      $vertices[]=array("x"=>$x, "y"=>$y, "z"=>$z);
    }
    else
    if (substr($line, 0, 2)==="f ")
    {
      $num_faces++;

      $face=explode(" ", $line);

      $c=explode("/", $face[1]);
      $t1=intval($c[0]);
      $c=explode("/", $face[2]);
      $t2=intval($c[0]);
      $c=explode("/", $face[3]);
      $t3=intval($c[0]);

      if ($t1<$min_face) $min_face=$t1;
      if ($t1>$max_face) $max_face=$t1;
      if ($t2<$min_face) $min_face=$t2;
      if ($t2>$max_face) $max_face=$t2;
      if ($t3<$min_face) $min_face=$t3;
      if ($t3>$max_face) $max_face=$t3;

      $faces[]=array("t1"=>$t1, "t2"=>$t2, "t3"=>$t3, "c"=>$cur_tex);
    }
    else
    if (substr($line, 0, 10)==="usemtl gl_")
    {
      $components=explode("_", $line);
      $col=intval($components[1]);

      $cur_tex=$col;
    }
    else
    if (substr($line, 0, 8)==="# scale ")
    {
      $components=explode(" ", $line);
      $scale=$components[2];
    }
  }

  fclose($handle);
}
else
{
  // Error opening the file.
  echo "Error opening input file\n";
  exit(0);
}

$dx=round($min_x+(($max_x-$min_x)/2));
$dy=round($min_y+(($max_y-$min_y)/2));
$dz=round($min_z+(($max_z-$min_z)/2));

$objname=basename($input_file, ".obj");

if ($output_file!=="-")
{
  echo "Stats\n";
  echo "-----\n";
  echo "Name : $objname\n";
  echo "Vertices : $num_verts\n";
  echo "Faces : $num_faces\n";
  echo "\n";
  echo "Faces reference vertices between $min_face and $max_face\n";
  echo "\n";
  echo "X ranges from $min_x to $max_x, delta of $dx\n";
  echo "Y ranges from $min_y to $max_y, delta of $dy\n";
  echo "Z ranges from $min_z to $max_z, delta of $dz\n";
}

// Translate the vertices to put model in the centre (for rotating purposes)
for ($i=0; $i<count($vertices); $i++)
{
  $vertices[$i]["x"]-=$dx;
  $vertices[$i]["y"]-=$dy;
  $vertices[$i]["z"]-=$dz;
}

// Build an output string
$out="";

if (!$set)
  $out.="var ".$objname."=";

$out.="{";
$out.="t:\"".$objname."\",";

$out.="v:[";
for ($i=0; $i<count($vertices); $i++)
  $out.="[".$vertices[$i]["x"].",".$vertices[$i]["y"].",".$vertices[$i]["z"]."]".($i+1<count($vertices)?",":"");
$out.="],";

$out.="f:[";
for ($i=0; $i<count($faces); $i++)
  $out.="[".$faces[$i]["t1"].",".$faces[$i]["t2"].",".$faces[$i]["t3"]."]".($i+1<count($faces)?",":"");
$out.="],";

$out.="c:[";
for ($i=0; $i<count($faces); $i++)
  $out.=$faces[$i]["c"].($i+1<count($faces)?",":"");
$out.="],";

$out.="s:$scale";

$out.="}";

if (!$set)
  $out.=";";

// Output the JSON
if ($output_file==="-")
  echo "$out";
else
  file_put_contents($output_file, $out);
?>
