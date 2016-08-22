// The code written in BSD/KNF indent style
"use strict";

var timeClock;

var canvas;
var context;

var dt = 0.25;
var braneSize = {width: 33, height: 33};
var brane = new Array(braneSize.width * braneSize.height);
var brane_tmp = new Array(braneSize.width * braneSize.height);
var vel = new Array(braneSize.width * braneSize.height);
var k_brane = 0.2;
var interval = 30; // drawing interval pixels

var rainThreshold = 0.1;

var field_XYZ = {X: {x: 1.0, y: 0.0, z: 0.0}, Y: {x: 0.0, y: 1.0, z: 0.0}, Z: {x: 0.0, y: 0.0, z: 1.0}};
var offset = {x: 0, y: 0, z: 0};
var rot_degree = 3600;
var colormap_quantize = 200;
var colormap = new Array(colormap_quantize);

var prev_clientX = 0;
var prev_clientY = 0;

// 3D model
var boat = make3dModel(
    [[{x:0, y:35, z:10}, {x:-15, y:20, z:10}, {x:15, y:20, z:10}],
    [{x:-15, y:20, z:10}, {x:-15, y:-20, z:10}, {x:15, y:20, z:10}],
    [{x:15, y:20, z:10}, {x:-15, y:-20, z:10}, {x:15, y:-20, z:10}],
    [{x:0, y:35, z:10}, {x:0, y:20, z:-5}, {x:-15, y:20, z:10}],
    [{x:0, y:35, z:10}, {x:15, y:20, z:10}, {x:0, y:20, z:-5}],
    [{x:-15, y:20, z:10}, {x:0, y:20, z:-5}, {x:-15, y:-20, z:10}],
    [{x:0, y:20, z:-5}, {x:0, y:-20, z:-5}, {x:-15, y:-20, z:10}],
    [{x:15, y:20, z:10}, {x:15, y:-20, z:10}, {x:0, y:20, z:-5}],
    [{x:0, y:20, z:-5}, {x:15, y:-20, z:10}, {x:0, y:-20, z:-5}],
    [{x:-15, y:-20, z:10}, {x:0, y:-20, z:-5}, {x:15, y:-20, z:10}]]);



// Initialize
window.addEventListener("load", init, false);



// ----- Initialize -----
function
init()
{
	// Make colormap
	makeColormap();
	// Initialize brane
	for (var i = 0; i < braneSize.height; i++) {
		for (var j = 0; j < braneSize.width; j++) {
			brane[i * braneSize.width + j] = 0.0;
			brane_tmp[i * braneSize.width + j] = 0.0;
			vel[i * braneSize.width + j] = 0.0;
		}
	}
	// Set view offset
	offset.x = braneSize.width * interval / 2.0
	offset.y = braneSize.height * interval / 2.0
	// Initialize canvas
	canvas = document.getElementById("mainPool");
	canvas.addEventListener("mousedown", mouseClick, false);
	canvas.addEventListener("mousemove", mouseRotation, false);
	canvas.addEventListener("touchstart", mouseClick, false);
	canvas.addEventListener("touchmove", mouseRotation, false);
	context = canvas.getContext("2d");
	// Adjust initial view rotation
	rot_field_XYZ(0, 1350);
	// Start loop
	timeClock = setInterval(loop, 25);
	// Random impulse
	setInterval(function ()
	    {
		    var f = Math.random();
		    if (f < rainThreshold) {
			    brane[Math.floor(33 * Math.random()) * braneSize.width + Math.floor(33 * Math.random())] = 200.0 * f;
			    rainThreshold += rainThreshold < 1.0 ? 0.001 : 0.0;
		    }
	    }, 50);
}




// ----- Start Simulation -----
function
loop()
{
	physics();
	draw();
	// Draw 3D model
	draw3dModel(boat, {x: 300, y: 300, z: 0});
}



// ----- REALTIME -----
function
physics()
{
	for (var i = 0; i < braneSize.height; i++) {
		for (var j = 0; j < braneSize.width; j++) {
			vel[i * braneSize.width + j] *= 0.98; // damping
			vel[i * braneSize.width + j] += accel(i, j) * dt;
			brane_tmp[i * braneSize.width + j] = brane[i * braneSize.width + j] + vel[i * braneSize.width + j] * dt;
		}
	}
	for (var n = 0; n < brane.length; n++) {
		brane[n] = brane_tmp[n];
	}
}

function
accel(i, j)
{
	var interest = brane[i * braneSize.width + j];
	var a = 0.0;
	if (i > 0) {
		a += k_brane * (brane[(i - 1) * braneSize.width + j] - interest);
	} else {
		a += -k_brane * interest;
	}
	if (j > 0) {
		a += k_brane * (brane[i * braneSize.width + j - 1] - interest);
	} else {
		a += -k_brane * interest;
	}
	if (i < braneSize.height - 1) {
		a += k_brane * (brane[(i + 1) * braneSize.width + j] - interest);
	} else {
		a += -k_brane * interest;
	}
	if (j < braneSize.width - 1) {
		a += k_brane * (brane[i * braneSize.width + j + 1] - interest);
	} else {
		a += -k_brane * interest;
	}
	return a;
}

function
makeColormap()
{
	var dc = Math.ceil(255 / (colormap_quantize / 2));
	var i;
	for (i = 0; i <= Math.floor(colormap_quantize / 2); i++) {
		colormap[i] = 'rgb(0,' + Math.min(255, dc * i) + ',' + Math.max(0, 255 - dc * i) + ')';
	}
	for (i = Math.floor(colormap_quantize / 2); i < colormap_quantize; i++) {
		colormap[i] = 'rgb(' + Math.min(255, dc * i) + ',' + Math.max(0, 255 - dc * i) + ',0)';
	}
}

function
draw()
{
	context.fillRect(0, 0, canvas.width, canvas.height);
	var xy = {x: 0, y: 0};
	var i;
	var j;
	var amp;
	context.strokeStyle = 'blue';
	for (i = 0; i < braneSize.height; i++) {
		for (j = 1; j < braneSize.width; j++) {
			amp = Math.round(2 * Math.max(Math.abs(brane[i * braneSize.width + j - 1]), Math.abs(brane[i * braneSize.width + j])));
			context.strokeStyle = colormap[Math.min(colormap_quantize, amp)];
			context.beginPath();
			xy = calcView(
			    (j - 1) * interval - offset.x,
			    i * interval - offset.y,
			    brane[i * braneSize.width + j - 1]);
			context.moveTo(xy.x + offset.x, xy.y + offset.y);
			xy = calcView(
			    j * interval - offset.x,
			    i * interval - offset.y,
			    brane[i * braneSize.width + j]);
			context.lineTo(xy.x + offset.x, xy.y + offset.y);
			context.stroke();
		}
	}
	for (j = 0; j < braneSize.width; j++) {
		for (i = 1; i < braneSize.height; i++) {
			amp = Math.round(2 * Math.max(Math.abs(brane[(i - 1) * braneSize.width + j]), Math.abs(brane[i * braneSize.width + j])));
			context.strokeStyle = colormap[Math.min(colormap_quantize, amp)];
			context.beginPath();
			xy = calcView(
			    j * interval - offset.x,
			    (i - 1) * interval - offset.y,
			    brane[(i - 1) * braneSize.width + j]);
			context.moveTo(xy.x + offset.x, xy.y + offset.y);
			xy = calcView(
			    j * interval - offset.x,
			    i * interval - offset.y,
			    brane[i * braneSize.width + j]);
			context.lineTo(xy.x + offset.x, xy.y + offset.y);
			context.stroke();
		}
	}
	// Show XYZ coordinate
	context.lineWidth = 2;
	context.beginPath();
	context.moveTo(42, 42);
	context.strokeStyle = "red";
	context.lineTo(42 + 42 * field_XYZ.X.x, 42 + 42 * field_XYZ.X.y);
	xy = calcView(-7, -7, 0);
	context.lineTo(42 + 42 * field_XYZ.X.x + xy.x, 42 + 42 * field_XYZ.X.y + xy.y);
	xy = calcView(-7, 8, 0);
	context.lineTo(42 + 42 * field_XYZ.X.x + xy.x, 42 + 42 * field_XYZ.X.y + xy.y);
	context.stroke();
	context.beginPath();
	context.moveTo(42, 42);
	context.strokeStyle = "lime";
	context.lineTo(42 + 42 * field_XYZ.Y.x, 42 + 42 * field_XYZ.Y.y);
	xy = calcView(7, -7, 0);
	context.lineTo(42 + 42 * field_XYZ.Y.x + xy.x, 42 + 42 * field_XYZ.Y.y + xy.y);
	xy = calcView(-8, -7, 0);
	context.lineTo(42 + 42 * field_XYZ.Y.x + xy.x, 42 + 42 * field_XYZ.Y.y + xy.y);
	context.stroke();
	context.beginPath();
	context.moveTo(42, 42);
	context.strokeStyle = "blue";
	context.lineTo(42 + 42 * field_XYZ.Z.x, 42 + 42 * field_XYZ.Z.y);
	xy = calcView(0, 7, -7);
	context.lineTo(42 + 42 * field_XYZ.Z.x + xy.x, 42 + 42 * field_XYZ.Z.y + xy.y);
	xy = calcView(0, -8, -7);
	context.lineTo(42 + 42 * field_XYZ.Z.x + xy.x, 42 + 42 * field_XYZ.Z.y + xy.y);
	context.stroke();
	context.lineWidth = 1;
}

function
draw3dModel(model, offset_model)
{
	var xy;
	context.strokeStyle = "white";
	for (var i = 0; i < model.edges.length; i++) {
		if (model.normalVector[i].x * field_XYZ.X.z + model.normalVector[i].y * field_XYZ.Y.z + model.normalVector[i].z * field_XYZ.Z.z > 0) {;
			continue;
		}
		context.beginPath();
		xy = calcView(
		    offset_model.x + model.edges[i][0].x - offset.x,
		    offset_model.y + model.edges[i][0].y - offset.y,
		    offset_model.z + model.edges[i][0].z - offset.z);
		context.moveTo(xy.x + offset.x, xy.y + offset.y);
		for (var j = 1; j <= model.edges[i].length; j++) {
			xy = calcView(
			    offset_model.x + model.edges[i][j % model.edges[i].length].x - offset.x,
			    offset_model.y + model.edges[i][j % model.edges[i].length].y - offset.y,
			    offset_model.z + model.edges[i][j % model.edges[i].length].z - offset.z);
			context.lineTo(xy.x + offset.x, xy.y + offset.y);
		}
		context.stroke();
	}
}

function
make3dModel(modelEdges)
{
	var model = {edges: modelEdges, normalVector: new Array(modelEdges.length)};
	// Compute normal vector
	for (var i = 0; i < modelEdges.length; i++) {
		model.normalVector[i] = {x: 0, y: 0, z: 0};
		if (modelEdges[i].length < 3) {
			continue;
		}
		var a = {
		    x: modelEdges[i][2].x - modelEdges[i][1].x,
		    y: modelEdges[i][2].y - modelEdges[i][1].y,
		    z: modelEdges[i][2].z - modelEdges[i][1].z};
		var b = {
		    x: modelEdges[i][0].x - modelEdges[i][1].x,
		    y: modelEdges[i][0].y - modelEdges[i][1].y,
		    z: modelEdges[i][0].z - modelEdges[i][1].z};
		model.normalVector[i].x = a.y * b.z - a.z * b.y;
		model.normalVector[i].y = a.z * b.x - a.x * b.z;
		model.normalVector[i].z = a.x * b.y - a.y * b.x;
		var norm = norm_XYZ(model.normalVector[i]);
		if (norm > 0.01) {
			model.normalVector[i].x /= norm;
			model.normalVector[i].y /= norm;
			model.normalVector[i].z /= norm;
		}
	}
	return model;
}

function
calcView(x, y, z)
{
	var xy = {x: 0, y: 0};
	xy.x = x * field_XYZ.X.x + y * field_XYZ.Y.x + z * field_XYZ.Z.x;
	xy.y = x * field_XYZ.X.y + y * field_XYZ.Y.y + z * field_XYZ.Z.y;
	return xy;
}

function
norm_XYZ(xyz)
{
	return Math.sqrt(xyz.x * xyz.x + xyz.y * xyz.y + xyz.z * xyz.z);
}

function
innerProduct_XYZ(A, B)
{
	return A.x * B.x + A.y * B.y + A.z * B.z;
}

function
rotation(x, y, XYZ)
{
	var ret = {x: 0, y: 0, z: 0};
	ret.x =
	    XYZ.x * Math.cos(2.0 * Math.PI * x / rot_degree) -
	    XYZ.z * Math.sin(2.0 * Math.PI * x / rot_degree);
	ret.z =
	    XYZ.z * Math.cos(2.0 * Math.PI * x / rot_degree) +
	    XYZ.x * Math.sin(2.0 * Math.PI * x / rot_degree);
	ret.y =
	    XYZ.y * Math.cos(2.0 * Math.PI * y / rot_degree) -
	    ret.z * Math.sin(2.0 * Math.PI * y / rot_degree);
	ret.z =
	    ret.z * Math.cos(2.0 * Math.PI * y / rot_degree) +
	    XYZ.y * Math.sin(2.0 * Math.PI * y / rot_degree);
	// normalize
	var norm = norm_XYZ(ret);
	if (norm > 0.1) {
		ret.x /= norm;
		ret.y /= norm;
		ret.z /= norm;
	}
	return ret;
}

function
rot_field_XYZ(x, y)
{
	field_XYZ.X = rotation(x, y, field_XYZ.X);
	field_XYZ.Y = rotation(x, y, field_XYZ.Y);
	field_XYZ.Z = rotation(x, y, field_XYZ.Z);
	// Reduce residue of Y
	var a = innerProduct_XYZ(field_XYZ.X, field_XYZ.Y);
	field_XYZ.Y.x -= a * field_XYZ.X.x;
	field_XYZ.Y.y -= a * field_XYZ.X.y;
	field_XYZ.Y.z -= a * field_XYZ.X.z;
	// Reduce residue of Z
	a = innerProduct_XYZ(field_XYZ.X, field_XYZ.Z);
	field_XYZ.Z.x -= a * field_XYZ.X.x;
	field_XYZ.Z.y -= a * field_XYZ.X.y;
	field_XYZ.Z.z -= a * field_XYZ.X.z;
	a = innerProduct_XYZ(field_XYZ.Y, field_XYZ.Z);
	field_XYZ.Z.x -= a * field_XYZ.Y.x;
	field_XYZ.Z.y -= a * field_XYZ.Y.y;
	field_XYZ.Z.z -= a * field_XYZ.Y.z;
}

function
rot_field_XYZ_onZ(x, y)
{
	var X = {x: 0, y: 0, z: 0};
	var Y = {x: 0, y: 0, z: 0};
	X = field_XYZ.X;
	Y = field_XYZ.Y;
	var cos = Math.cos(2.0 * Math.PI * x / rot_degree);
	var sin = Math.sin(2.0 * Math.PI * x / rot_degree);
	if (field_XYZ.Z.y < 0.0) {
		field_XYZ.X.x = X.x * cos + Y.x * sin;
		field_XYZ.X.y = X.y * cos + Y.y * sin;
		field_XYZ.X.z = X.z * cos + Y.z * sin;
		field_XYZ.Y.x = Y.x * cos - X.x * sin;
		field_XYZ.Y.y = Y.y * cos - X.y * sin;
		field_XYZ.Y.z = Y.z * cos - X.z * sin;
	} else {
		field_XYZ.X.x = X.x * cos - Y.x * sin;
		field_XYZ.X.y = X.y * cos - Y.y * sin;
		field_XYZ.X.z = X.z * cos - Y.z * sin;
		field_XYZ.Y.x = Y.x * cos + X.x * sin;
		field_XYZ.Y.y = Y.y * cos + X.y * sin;
		field_XYZ.Y.z = Y.z * cos + X.z * sin;
	}
	// normalize
	var norm = norm_XYZ(field_XYZ.X);
	if (norm > 0.1) {
		field_XYZ.X.x /= norm;
		field_XYZ.X.y /= norm;
		field_XYZ.X.z /= norm;
	}
	// rot with drag on Y axis same as normal rotation
	rot_field_XYZ(0, y);
}

function
mouseClick(event)
{
	event.preventDefault();
	if (event.type === "mousedown") {
		prev_clientX = event.clientX;
		prev_clientY = event.clientY;
	} else if (event.type === "touchstart") {
		prev_clientX = event.touches[0].clientX;
		prev_clientY = event.touches[0].clientY;
	}
}

function
mouseRotation(event)
{
	event.preventDefault();
	if (event.type === "mousemove" && event.buttons & 1 != 0) {
		rot_field_XYZ_onZ(event.clientX - prev_clientX, event.clientY - prev_clientY);
		prev_clientX = event.clientX;
		prev_clientY = event.clientY;
	} else if (event.type === "touchmove" && event.touches.length == 1) {
		rot_field_XYZ_onZ(event.touches[0].clientX - prev_clientX, event.touches[0].clientY - prev_clientY);
		prev_clientX = event.touches[0].clientX;
		prev_clientY = event.touches[0].clientY;
	}
}

