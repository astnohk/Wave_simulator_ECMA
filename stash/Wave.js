// The code written in BSD/KNF indent style
"use strict";

var timeClock;

var canvas;
var context;

var dt = 0.25;
var braneSize = {width: 33, height: 33};
var brane = new Array();
var brane_tmp = new Array();
var vel = new Array();
var k_brane = 0.4;
var interval = 30; // drawing interval pixels

var rainThreshold = 0.1;

var field_XYZ = {X: {x: 1.0, y: 0.0, z: 0.0}, Y: {x: 0.0, y: 1.0, z: 0.0}, Z: {x: 0.0, y: 0.0, z: -1.0}};
var offset = {x: 0, y: 0, z: 0};
var rot_degree = 3600;



// Initialize
window.addEventListener("load", init, false);



// ----- Initialize -----
function
init()
{
	for (var i = 0; i < braneSize.height; i++) {
		for (var j = 0; j < braneSize.width; j++) {
			brane[i * braneSize.width + j] = 0.0;
			brane_tmp[i * braneSize.width + j] = 0.0;
			vel[i * braneSize.width + j] = 0.0;
		}
	}
	offset.x = braneSize.width * interval / 2.0
	offset.y = braneSize.height * interval / 2.0
	canvas = document.getElementById("mainPool");
	context = canvas.getContext("2d");
	rot_field_XYZ(0, -450);
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
	}
	if (j > 0) {
		a += k_brane * (brane[i * braneSize.width + j - 1] - interest);
	}
	if (i < braneSize.height - 1) {
		a += k_brane * (brane[(i + 1) * braneSize.width + j] - interest);
	}
	if (j < braneSize.width - 1) {
		a += k_brane * (brane[i * braneSize.width + j + 1] - interest);
	}
	return a;
}

function
draw()
{
	context.fillRect(0, 0, canvas.width, canvas.height);
	var xy = {x: 0, y: 0};
	for (var i = 0; i < braneSize.height; i++) {
		context.beginPath();
		context.strokeStyle = 'blue';
		xy = calc_view(
		    -offset.x / 2.0,
		    i * interval - offset.y / 2.0,
		    brane[i * braneSize.width]);
		context.moveTo(xy.x + offset.x / 2.0, xy.y + offset.y / 2.0);
		for (var j = 1; j < braneSize.width; j++) {
			xy = calc_view(
			    j * interval - offset.x / 2.0,
			    i * interval - offset.y / 2.0,
			    brane[i * braneSize.width + j]);
			context.lineTo(xy.x + offset.x / 2.0, xy.y + offset.y / 2.0);
		}
		context.stroke();
	}
	// Show XYZ coordinate
	context.beginPath();
	context.moveTo(40, 40);
	context.strokeStyle = "red";
	context.lineTo(40 + 40 * field_XYZ.X.x, 40 + 40 * field_XYZ.X.y);
	context.stroke();
	context.beginPath();
	context.moveTo(40, 40);
	context.strokeStyle = "green";
	context.lineTo(40 + 40 * field_XYZ.Y.x, 40 + 40 * field_XYZ.Y.y);
	context.stroke();
	context.beginPath();
	context.moveTo(40, 40);
	context.strokeStyle = "blue";
	context.lineTo(40 + 40 * field_XYZ.Z.x, 40 + 40 * field_XYZ.Z.y);
	context.stroke();
}

function
calc_view(x, y, z)
{
	var xy = {x: 0, y: 0};
	xy.x = x * field_XYZ.X.x + y * field_XYZ.Y.x + z * field_XYZ.Z.x;
	xy.y = x * field_XYZ.X.y + y * field_XYZ.Y.y + z * field_XYZ.Z.y;
	return xy;
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
	var norm = Math.sqrt(ret.x * ret.x + ret.y * ret.y + ret.z * ret.z);
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
}

