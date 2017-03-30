/**
 * @module test.js
 *
 * this program creates control widgets and displays for
 * them to update, and invokes the terrain generator to
 * draw the maps.
 *
 * The original was created by Martin O'Leary to demonstrate
 * the steps of his terrain generation process.  I also find
 * it useful as a work-bench for playing with the various
 * parts of the process, and as sample code for how the terrain
 * generation functions are intended to be used.
 */

/**
 * addSVG - add a Scalable Vector Graphics pannel to a div
 *
 * @param	division to which pannel should be added
 */
function addSVG(div) {
    return div.insert("svg", ":first-child")
        .attr("height", 400)
        .attr("width", 400)
        .attr("viewBox", "-500 -500 1000 1000");
}

/**
 * mesh generation demonstration
 *
 *	button: Generate (256) random points
 *	button: Improve points (to Voronoi polygon vertices)
 *	button: switch between original points and Voronoi vertices
 */
var meshDiv = d3.select("div#mesh");
var meshSVG = addSVG(meshDiv);

var meshPts = null;
var meshVxs = null;
var meshDual = false;

function meshDraw() {
    if (meshDual && !meshVxs) {
        meshVxs = makeMesh(meshPts).vxs;
    }
    visualizePoints(meshSVG, meshDual ? meshVxs : meshPts);
}

// generate a random set of points
meshDiv.append("button")
    .text("Generate random points")
    .on("click", function () {
        meshDual = false;
        meshVxs = null;
        meshPts = generatePoints(256);
        meshDraw();
    });

// improve the points, replacing them with the
//	centers of their Voronoi polygons
meshDiv.append("button")
    .text("Improve points")
    .on("click", function () {
        meshPts = improvePoints(meshPts);
        meshVxs = null;
        meshDraw();
    });

// show orignal points OR Voronoi vertices
var vorBut = meshDiv.append("button")
    .text("Show Voronoi corners")
    .on("click", function () {
        meshDual = !meshDual;
        if (meshDual) {
            vorBut.text("Show original points");
        } else {
            vorBut.text("Show Voronoi corners");
        }
        meshDraw();
    });

/**
 * primary height map demonstration
 *
 *	starts with a randomly generated 4K mesh
 *	button: reset to flat
 *	button: add random slope
 *	button: add positive cone
 *	button: add negative cone
 *	button: add (5) mountains
 *	button: round hills
 *	button: relax terrain
 *	button: set sea-level to median
 */
var primDiv = d3.select("div#prim");
var primSVG = addSVG(primDiv);

var primH = zero(generateGoodMesh(4096));

function primDraw() {
    visualizeVoronoi(primSVG, primH, -1, 1);
    drawPaths(primSVG, 'coast', contour(primH, 0));
}

primDraw();

// create a flat map
primDiv.append("button")
    .text("Reset to flat")
    .on("click", function () {
        primH = zero(primH.mesh); 
        primDraw();
    });

// choose a slope vector, and slope the entire map
primDiv.append("button")
    .text("Add random slope")
    .on("click", function () {
        primH = add(primH, slope(primH.mesh, randomVector(4)));
        primDraw();
    });

// slope the map downwards out from the center
primDiv.append("button")
    .text("Add cone")
    .on("click", function () {
        primH = add(primH, cone(primH.mesh, -0.5));
        primDraw();
    });

// slope the map upwards out from the center
primDiv.append("button")
    .text("Add inverted cone")
    .on("click", function () {
        primH = add(primH, cone(primH.mesh, 0.5));
        primDraw();
    });

// add five randomly chosen mountains
primDiv.append("button")
    .text("Add five blobs")
    .on("click", function () {
        primH = add(primH, mountains(primH.mesh, 5));
        primDraw();
    });

// normalize the height map to 0-1
primDiv.append("button")
    .text("Normalize heightmap")
    .on("click", function () {
        primH = normalize(primH);
        primDraw();
    });

// exaggerate the vertical relief
primDiv.append("button")
    .text("Round hills")
    .on("click", function () {
        primH = peaky(primH);
        primDraw();
    });

// smoothe the terrain
primDiv.append("button")
    .text("Relax")
    .on("click", function () {
        primH = relax(primH);
        primDraw();
    });

// draw a sea-level line
primDiv.append("button")
    .text("Set sea level to median")
    .on("click", function () {
        primH = setSeaLevel(primH, 0.5);
        primDraw();
    });

/**
 * river and erosion demo
 *	button: generate random height-map
 *		generate a mesh
 *		add slope, cone and mountains
 *		round the peaks
 *		fill the sinks
 *		set the sea-level
 *	button: copy heightmap rom above
 *	button: run an erosion pass
 *	button: set sea level to median altitude
 *	button: clean the coast lines
 *	button: display erosion rates
 */
var erodeDiv = d3.select("div#erode");
var erodeSVG = addSVG(erodeDiv);

function generateUneroded() {
    var mesh = generateGoodMesh(4096);
    var h = add(slope(mesh, randomVector(4)),
                cone(mesh, runif(-1, 1)),
                mountains(mesh, 50));
    h = peaky(h);
    h = fillSinks(h);
    h = setSeaLevel(h, 0.5);
    return h;
}

// default: start with the Primary height map
var erodeH = primH;
var erodeViewErosion = false;

function erodeDraw() {
    if (erodeViewErosion) {
        visualizeVoronoi(erodeSVG, erosionRate(erodeH));
    } else {
        visualizeVoronoi(erodeSVG, erodeH, 0, 1);
    }
    drawPaths(erodeSVG, "coast", contour(erodeH, 0));
}

erodeDiv.append("button")
    .text("Generate random heightmap")
    .on("click", function () {
        erodeH = generateUneroded();
        erodeDraw();
    });

erodeDiv.append("button")
    .text("Copy heightmap from above")
    .on("click", function () {
        erodeH = primH;
        erodeDraw();
    });

erodeDiv.append("button")
    .text("Erode")
    .on("click", function () {
        erodeH = doErosion(erodeH, 0.1);
        erodeDraw();
    });

erodeDiv.append("button")
    .text("Set sea level to median")
    .on("click", function () {
        erodeH = setSeaLevel(erodeH, 0.5);
        erodeDraw();
    });


erodeDiv.append("button")
    .text("Clean coastlines")
    .on("click", function () {
        erodeH = cleanCoast(erodeH, 1);
        erodeH = fillSinks(erodeH);
        erodeDraw();
    });

var erodeBut = erodeDiv.append("button")
    .text("Show erosion rate")
    .on("click", function () {
        erodeViewErosion = !erodeViewErosion;
        if (erodeViewErosion) {
            erodeBut.text("Show heightmap");
        } else {
            erodeBut.text("Show erosion rate");
        }
        erodeDraw();
    });

/**
 * physical landscape demo
 *	button: generate random height map
 *	button: copy map from above
 *	button: show the coast line
 *	button: show rivers
 *	button: show slope shading
 */
var physDiv = d3.select("div#phys");
var physSVG = addSVG(physDiv);
var physH = erodeH;

var physViewCoast = false;
var physViewRivers = false;
var physViewSlope = false;
var physViewHeight = true;

function physDraw() {
    if (physViewHeight) {
        visualizeVoronoi(physSVG, physH, 0);
    } else {
        physSVG.selectAll("path.field").remove();
    }
    if (physViewCoast) {
        drawPaths(physSVG, "coast", contour(physH, 0));
    } else {
        drawPaths(physSVG, "coast", []);
    }
    if (physViewRivers) {
        drawPaths(physSVG, "river", getRivers(physH, 0.01));
    } else {
        drawPaths(physSVG, "river", []);
    }
    if (physViewSlope) {
        visualizeSlopes(physSVG, {h:physH});
    } else {
        visualizeSlopes(physSVG, {h:zero(physH.mesh)});
    }
}
physDiv.append("button")
    .text("Generate random heightmap")
    .on("click", function () {
        physH = generateCoast({npts:4096, extent:defaultExtent});
        physDraw();
    });

physDiv.append("button")
    .text("Copy heightmap from above")
    .on("click", function () {
        physH = erodeH;
        physDraw();
    });

var physCoastBut = physDiv.append("button")
    .text("Show coastline")
    .on("click", function () {
        physViewCoast = !physViewCoast;
        physCoastBut.text(physViewCoast ? "Hide coastline" : "Show coastline");
        physDraw();
    });

var physRiverBut = physDiv.append("button")
    .text("Show rivers")
    .on("click", function () {
        physViewRivers = !physViewRivers;
        physRiverBut.text(physViewRivers ? "Hide rivers" : "Show rivers");
        physDraw();
    });


var physSlopeBut = physDiv.append("button")
    .text("Show slope shading")
    .on("click", function () {
        physViewSlope = !physViewSlope;
        physSlopeBut.text(physViewSlope ? "Hide slope shading" : "Show slope shading");
        physDraw();
    });


var physHeightBut = physDiv.append("button")
    .text("Hide heightmap")
    .on("click", function () {
        physViewHeight = !physViewHeight;
        physHeightBut.text(physViewHeight ? "Hide heightmap" : "Show heightmap");
        physDraw();
    });

/**
 * city placement demo
 *	button: generate new height map
 *	button: copy map from above
 *	button: add a new city
 *	button show territories/city location scores
 */
var cityDiv = d3.select("div#city");
var citySVG = addSVG(cityDiv);

var cityViewScore = true;

function newCityRender(h) {
    h = h || generateCoast({npts:4096, extent: defaultExtent});
    return {
        params: defaultParams,
        h: h,
        cities: []
    };
}
var cityRender = newCityRender(physH);
function cityDraw() {
    cityRender.terr = getTerritories(cityRender);
    if (cityViewScore) {
        var score = cityScore(cityRender.h, cityRender.cities);
        visualizeVoronoi(citySVG, score, d3.max(score) - 0.5);
    } else {
        visualizeVoronoi(citySVG, cityRender.terr);
    }
    drawPaths(citySVG, 'coast', contour(cityRender.h, 0));
    drawPaths(citySVG, 'river', getRivers(cityRender.h, 0.01));
    drawPaths(citySVG, 'border', getBorders(cityRender));
    visualizeSlopes(citySVG, cityRender);
    visualizeCities(citySVG, cityRender);
}

cityDiv.append("button")
    .text("Generate random heightmap")
    .on("click", function () {
        cityRender = newCityRender();
        cityDraw();
    });

cityDiv.append("button")
    .text("Copy heightmap from above")
    .on("click", function () {
        cityRender = newCityRender(physH);
        cityDraw();
    });

cityDiv.append("button")
    .text("Add new city")
    .on("click", function () {
        placeCity(cityRender);
        cityDraw();
    });

var cityViewBut = cityDiv.append("button")
    .text("Show territories")
    .on("click", function () {
        cityViewScore = !cityViewScore;
        cityViewBut.text(cityViewScore ? "Show territories" : "Show city location scores");
        cityDraw();
    });

/*
 * complete map creation
 *
 *	Button: copy map from above
 *	Button: generate high resolution map
 *
 */
var finalDiv = d3.select("div#final");
var finalSVG = addSVG(finalDiv);
finalDiv.append("button")
    .text("Copy map from above")
    .on("click", function () {
        drawMap(finalSVG, cityRender);
    });

finalDiv.append("button")
    .text("Generate high resolution map")
    .on("click", function () {
        doMap(finalSVG, defaultParams);
    });
