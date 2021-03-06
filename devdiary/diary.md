# Dev Diary / Postmortem

**Airspace Alpha Zulu**

This is my fourth game jam entry, and my fifth HTML5/JS game.

Like in previous years, just before the theme was announced I created a new project template with updated build and minify steps from my entry last year.

As soon as the theme was announced I had some thoughts as to what kind of game I want to create to fit the theme, here as some of my inital thoughts/notes/ideas ..

SPACE
-----
* Space as a location, i.e. outer space
* Space in a physical sense
* Space as an area/arena where something happens
* The marking of distance between two or more objects
* Personal space
* Space as a slot in time
* Space as a reserved/assigned place/zone, i.e. parking space, beach towel, e.t.c.
* An epoch or technological time, e.g. space age, space race
* Space bar as a key on the keyboard

Game ideas
----------
* Battleships type game - where a space has to be cleared on a grid by finding hidden entities
* Space ship docking game - like [Elite](http://www.bbcmicro.co.uk/game.php?id=366), but you play the roll of the space station docking computer
* Driving game - still keen to do a driving game of some sort, maybe make space between yourself and a chaser
* Flight sim - a low res 3D flight simulator, piloting an advanced fighter jet avoiding enemy detection spaces and landing
* Sokoban game - a box shuffling game to make some space for something
* Space clearing - flying round in space above Earth to clear up defunct satellites
* Parking space - a driving game where you compete for a parking space with increasing difficulty
* Timing game - tapping space bar in time with music or events on screen
* Space race - be the first to advance a civilisation enough to launch a rocket

Here is a rough diary of progress as posted on [Twitter](https://twitter.com/femtosonic) and taken from notes and [commit logs](https://github.com/picosonic/js13k-2021/commits/)..

13th August
-----------
Getting some game ideas before starting to think about doing coding experiments. I like the thought of doing more than one game. Perhaps a 2D and a 3D one, but I may run out of time very quickly unless I make one of them really simple to code but really fun to play.

![F/A-XX stealth](aug13.jpg?raw=true "F/A-XX stealth")

Decided to make a 3D [stealth](https://en.wikipedia.org/wiki/Stealth_aircraft) flight sim and naming it "Airspace Alpha Zulu". Built a stealth fighter jet 3D model loosely based on concept renderings for upcoming [F/A-XX](https://en.wikipedia.org/wiki/F/A-XX_program). Only 56 vertices and 88 faces. Need to fix exhuast vents and do something for the wheels. But I'm quite happy with it.

14th August
-----------
Improved 3D model exhuast vents and set it spinning to take a look from various angles.

![Spinning model](aug14.gif?raw=true "Spinning model")

15th August
-----------
Investigating fighter jet [HUD](https://en.wikipedia.org/wiki/Head-up_display) symbology.

![HUD symbology](aug15.jpg?raw=true "HUD symbology")

Started putting together a test page for HUD visualisation.

![HUD test](aug15b.png?raw=true "HUD test")

16th/17th August
----------------
A real struggle to get aircraft metrics data visualised in the [F-16](https://en.wikipedia.org/wiki/General_Dynamics_F-16_Fighting_Falcon) style HUD. Especially around [floating point precision issues](https://stackoverflow.com/questions/1458633/how-to-deal-with-floating-point-number-precision-in-javascript) and scales crossing zero boundary.

Also dashed lines in canvas gave me a real problem. Turning them on didn't work every time and sometimes left dashed enabled for every subsequent line despite me turning it off in the [documented way](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash). Also using [save() and restore()](https://stackoverflow.com/questions/41513197/how-to-reset-canvas-path-style) didn't seem to make any difference. Only putting them into a different canvas worked reliably for me.

![HUD canned data](aug17.gif?raw=true "HUD canned data")

Colourised the 3D plane model and put it onto the clouds to see how it would look.

![Coloured 3D model](aug17b.png?raw=true "Coloured 3D model")

18th August
-----------
Created a 3D model of an aircraft carrier based on [USS Enterprise CVN-65](https://en.wikipedia.org/wiki/USS_Enterprise_(CVN-65)) to hopefully land on following each stealth mission.

![Negative ghostrider the pattern is full](aug18.gif?raw=true "Negative ghostrider the pattern is full")

19th August
-----------
Created a simple .obj to JSON conversion script. Colourised the aircraft carrier, added runway markings and mocked up a landing with some parked jets.

![Landing mockup](aug19.gif?raw=true "Landing mockup")

20th August
-----------
Wondered about putting some other jet models into the game. Found a 3D model of the upcoming [Tempest](https://en.wikipedia.org/wiki/BAE_Systems_Tempest) jet. But after conversion it had too many vertices (25,776) and too many faces (51,014) to be useable and made the game engine go really slow. I have tried remeshing it down to 1000 faces which is a lot better but zipped it takes up 7.2kB.

![Tempest](aug20.gif?raw=true "Tempest")

21st August
-----------
Added support for faces with texture and normal indeces in .obj to .json converter.

26th August
-----------
Started an experiment with creating an SVG font.

Added 3D and timeline libraries.

Fixed script which calls closure compiler when more than one jar exist.

Added animation callback to process game state advancement.

Disabled alpha and smoothing on 3D canvas element to improve rendering speeds.

Added support for browser resizing.

29th August
-----------
Added test for plane engine noise using [brown noise](https://en.wikipedia.org/wiki/Brownian_noise), based on some [sample code](https://noisehack.com/generate-noise-web-audio-api/).

Tested loading 3D plane and carrier models to check scale.

30th/31st August
----------------
Spent time trying to fix 3D software renderer which has an issue with clipping. Some triangles when aligned towards the viewer appear to be culled incorrectly.

![3D clipping](aug31.jpg?raw=true "3D clipping")

9th September
--------------
Having devoted much of my dev time to my [mobile entry for JS13k](https://js13kgames.com/entries/crater-space) to get at least one game submitted, I've now moved back on to AirSpace Alpha Zulu.

Imported the stealth jet and aircraft carrier models.

Added basic keyboard navigation.

10th September
--------------
Struggling with the maths behind the 3D navigation and model rotations, so decided to look at a previous game I had made for JS13k. This was a [3D flying game](https://js13kgames.com/entries/backspace-return-to-planet-figadore) which rendered the 3D polys to an SVG, this worked reaonably well but my new models are aligned differently.

|   | X | Y | Z |
|---|:---:|:---:|:---:|
|old | left/right | up/down | forward/back |
|new | forward/back | left/right | up/down |

Where :

 * left/right = [sagittal plane](https://en.wikipedia.org/wiki/Sagittal_plane)
 * up/down = [transverse plane](https://en.wikipedia.org/wiki/Transverse_plane)
 * forward/back = [coronal plane](https://en.wikipedia.org/wiki/Coronal_plane)

So to use the same navigation code I needed to rotate the new models by 90 degrees on X axis (roll) and 270 degrees on Z axis (yaw).

11th September
--------------
Added throttle up/down.

12th September
--------------
Added brownian noise for jet, which changes as your speed and roll does.

Start on the carrier in the middle of a launch.

When doing below 50 knots, loose altitude due to stalling.

Fixed position of jet HUD overlay. Added pitch ladder updates due to roll and climb/descend.

Made some screenshots for submission.

13th September
--------------
Detect crashes into the sea and successful landings.

Packed everything up and submitted.

Looking back
------------
Having decided to make a 3D flying game I wanted to use a [3D engine](https://github.com/picosonic/js3dengine) which I was writing to use the canvas which was heavily based on [tutorials I'd seen on YouTube](https://www.youtube.com/watch?v=XgMWc6LumG4) by [@Javidx9](https://github.com/OneLoneCoder/videos). However I did run into some issue with the clipping an popping of triangles. I also struggled changing my mindset between a static camera and moving models/world and a static world with moving camera. Ultimately I reverted back to a previous 3D engine I'd written which renders to SVG for a [previous JS13k entry](https://js13kgames.com/entries/backspace-return-to-planet-figadore).

Each of the 3D models I made were done using views I found showing top/left/right/back/front of each object. I then hand crafted the .obj files by measuring coordinates in pixels within GIMP for each vertex (adding a Z component as I went along). These points were numbered on the image so that I could refer back to them when doing the faces. I previewed the .obj files in meshlab to make sure all looked ok and that I'd got the right clockwise winding on each face I made. I created a tiny material file so that I could view the models with some colour on them. This was great fun to do. The only thing which required fixing was moving the origin to the centre of the model (for rotation purposes), I create a [.php script](https://github.com/picosonic/js13k-2021/blob/main/obj2js.php) to do this for me and package each up into a models file. Lastly because I ended up using my old SVG engine, I needed to rotate the models (to have Z go into the screen rather than up) as detailed above.

A part which I would say was the most enjoyable to do was the creation of the [F16](https://en.wikipedia.org/wiki/General_Dynamics_F-16_Fighting_Falcon) style [HUD](https://en.wikipedia.org/wiki/Head-up_display). I'd watched a few videos of these in [flight sim games](https://www.youtube.com/watch?v=jwv0ibUG4lo) and live, and also found various static images in manuals and photos. I wanted to try to recreate this as best I could and link it to the aircraft model in my game. I implement the pitch ladder, altitude, compass, roll indicator and airspeed (including mach conversion). Because I ran out of time to create missions, I didn't implement the waypoint/steerpoint system, and due to the behind the plane view I didn't add the artifical horizon.

One of the things I spent quite a bit of time on before having to move on to something else was a new very small SVG font in the style of Top Gun (well this is all about flying jets from a carrier). I found a [truetype font](https://blogfonts.com/top-gun.font) that somebody had produced and which was released as freeware. I wrote out all the characters of the alphabet into a text layer in inkscape then set about extracting a simplified set of paths for each letter. Also given the angular approach to the lettering I figured I may be able to minify further by using a set of shortcuts, like bottom-left square or bottom-left angled, e.t.c. I managed to get all the characters out but they all had transforms applied and the path coordinates were to multiple decimal places. When I created a writer for the font, it was tantilisingly close to working but I had to drop it and move on to other more pressing dev. Ultimately I re-used a 14-segment SVG font which I'd used in a [previous JS13k entry](https://js13kgames.com/entries/backspace-return-to-planet-figadore). I may well revisit the TG font in a postcomp version to replace the 14-segment one.

Towards the end I wanted to add a bit more realism so added a noise generator. I believe aircraft sound more like pink noise, but I wanted to opt for brown noise as it sounded good too. The gain ramps up and down with the thrust and rolling left/right changes the stereo position of the brown noise to give it a slightly 3D positioning feel since the view is from behind. I felt this worked reasonably well.

I think I lost a lot of time by deciding to make more than one game for JS13k this year, not because it is easy, but because it is hard (I wanted to stretch myself). Given all the difficulties above mostly with debugging and fixing/switching game engines I ultimately ended up concentrating on the game which felt simpler so that I could at least get one of the two games submitted.
