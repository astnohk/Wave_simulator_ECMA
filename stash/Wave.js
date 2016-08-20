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

	canvas = document.getElementById("mainPool");
	context = canvas.getContext("2d");
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
	for (var i = 1; i < braneSize.height; i++) {
		context.beginPath();
		context.strokeStyle = 'blue';
		context.moveTo(10, i * interval + brane[i * braneSize.width + j]);
		for (var j = 1; j < braneSize.width; j++) {
			context.lineTo(10 + j * interval, i * interval + brane[i * braneSize.width + j]);
		}
		context.stroke();
	}
	context.beginPath();
	context.strokeStyle = "red";
	context.arc(10, 10, 10, 0, 2.0 * Math.PI, false);
	context.stroke();
}

