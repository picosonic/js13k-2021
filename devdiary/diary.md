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

