// The code written in BSD/KNF indent style
"use strict";

var timeClock;

var canvas;
var context;

var dt = 0.25;
var g = 2.4;
var f_float = 5.0;
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
//var boatPosition = {x: braneSize.width * interval / 2.0, y: braneSize.height * interval / 2.0, z: 0};
var boatPosition = {x: 300, y: 300, z: 0};
var boatVelocity = {x: 0, y: 0, z: 0};
var boatVelocityRoll = {roll: 0, pitch: 0, yaw: 0};
var boatMass = 4;
var boat = make3dModel(
    [[{x:35, y:0, z:10}, {x:20, y:15, z:10}, {x:-20, y:15, z:10}, {x:-20, y:-15, z:10}, {x:20, y:-15, z:10}],
    [{x:35, y:0, z:10}, {x:20, y:0, z:-5}, {x:20, y:15, z:10}],
    [{x:35, y:0, z:10}, {x:20, y:-15, z:10}, {x:20, y:0, z:-5}],
    [{x:20, y:15, z:10}, {x:20, y:0, z:-5}, {x:-20, y:0, z:-5}, {x:-20, y:15, z:10}],
    [{x:20, y:-15, z:10}, {x:-20, y:-15, z:10}, {x:-20, y:0, z:-5}, {x:20, y:0, z:-5}],
    [{x:-20, y:15, z:10}, {x:-20, y:0, z:-5}, {x:-20, y:-15, z:10}]]);



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
	physics_boat();
	draw3dModel(boat, boatPosition);
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
braneAt(x, y)
{
	if (x < 0 || braneSize.width <= x || y <= 0 || braneSize.height <= y) {
		return 0.0;
	} else {
		return brane[y * braneSize.width + x];
	}
}

function
braneInsideOrNot(x, y)
{
	if (x < 0 || braneSize.width <= x || y <= 0 || braneSize.height <= y) {
		return false;
	} else {
		return true;
	}
}

function
asin(y)
{
	if (-1.0 < y && y < 1.0) {
		return Math.asin(y);
	} else if (y > 0) {
		return 0.25 * Math.PI;
	} else {
		return -0.25 * Math.PI;
	}
}

function
physics_boat()
{
	var x = Math.floor(boatPosition.x / interval);
	var y = Math.floor(boatPosition.y / interval);
	if (boatPosition.z > braneAt(x, y)) { // Under the water
		boatVelocity.z -= g * dt; // Gravity
		boatVelocity.x *= 0.98;
		boatVelocity.y *= 0.98;
		boatVelocity.z *= 0.98;
	} else {
		boatVelocity.z += dt * f_float / boatMass; // Floating
		boatVelocity.x *= 0.9;
		boatVelocity.y *= 0.9;
		boatVelocity.z *= 0.9;
		// Rolling
		var x_diff = braneAt(x + 1, y) - braneAt(x, y);
		var y_diff = braneAt(x, y + 1) - braneAt(x, y);
		var x_axis = rotate3d(boat.roll, boat.pitch, boat.yaw, {x:1, y:0, z:0});
		var y_axis = rotate3d(boat.roll, boat.pitch, boat.yaw, {x:0, y:1, z:0});
		var z_axis = rotate3d(boat.roll, boat.pitch, boat.yaw, {x:0, y:0, z:1});
		boatVelocityRoll.roll += rot_degree / 40.0 *
		    (Math.atan2(z_axis.z * (x_diff * y_axis.x + y_diff * y_axis.y - y_axis.z * interval), interval) / Math.PI -
		    0.25 * Math.sin(2.0 * Math.PI * boat.roll / rot_degree) * Math.cos(asin(x_axis.z))) /
		    boatMass;
		boatVelocityRoll.pitch += rot_degree / 40.0 *
		    (-Math.atan2(z_axis.z * (x_diff * x_axis.x + y_diff * x_axis.y - x_axis.z * interval), interval) / Math.PI -
		    0.25 * Math.sin(2.0 * Math.PI * boat.pitch / rot_degree) * Math.cos(asin(y_axis.z))) /
		    boatMass;
		boatVelocityRoll.yaw += rot_degree / 40.0 *
		    Math.atan2(y_axis.z * (x_diff * x_axis.x + y_diff * x_axis.y - x_axis.z * interval), interval) / Math.PI /
		    boatMass;
		if (braneInsideOrNot(x, y)) {
			brane[y * braneSize.width + x] -= boatMass * 0.3;
		}
	}
	boatPosition.x += boatVelocity.x * dt;
	boatPosition.y += boatVelocity.y * dt;
	boatPosition.z += boatVelocity.z * dt;
	boat.roll += boatVelocityRoll.roll * dt;
	boat.pitch += boatVelocityRoll.pitch * dt;
	boat.yaw += boatVelocityRoll.yaw * dt;
	boatVelocityRoll.roll *= 0.98;
	boatVelocityRoll.pitch *= 0.98;
	boatVelocityRoll.yaw *= 0.98;
}

function
accel(i, j)
{
	var interest = brane[i * braneSize.width + j];
	var a = 0.0;
	a += k_brane * (braneAt(j, i - 1) - interest);
	a += k_brane * (braneAt(j - 1, i) - interest);
	a += k_brane * (braneAt(j, i + 1) - interest);
	a += k_brane * (braneAt(j + 1, i) - interest);
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
			amp = Math.round(2 * Math.max(Math.abs(braneAt(j - 1, i)), Math.abs(braneAt(j, i))));
			context.strokeStyle = colormap[Math.min(colormap_quantize, amp)];
			context.beginPath();
			xy = calcView(
			    (j - 1) * interval - offset.x,
			    i * interval - offset.y,
			    braneAt(j - 1, i));
			context.moveTo(xy.x + offset.x, xy.y + offset.y);
			xy = calcView(
			    j * interval - offset.x,
			    i * interval - offset.y,
			    braneAt(j, i));
			context.lineTo(xy.x + offset.x, xy.y + offset.y);
			context.stroke();
		}
	}
	for (j = 0; j < braneSize.width; j++) {
		for (i = 1; i < braneSize.height; i++) {
			amp = Math.round(2 * Math.max(Math.abs(braneAt(j, i - 1)), Math.abs(braneAt(j, i))));
			context.strokeStyle = colormap[Math.min(colormap_quantize, amp)];
			context.beginPath();
			xy = calcView(
			    j * interval - offset.x,
			    (i - 1) * interval - offset.y,
			    braneAt(j, i - 1));
			context.moveTo(xy.x + offset.x, xy.y + offset.y);
			xy = calcView(
			    j * interval - offset.x,
			    i * interval - offset.y,
			    braneAt(j, i));
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
draw3dModel(model, position, roll)
{
	var xy;
	context.strokeStyle = "white";
	rotate3dModel(model.roll, model.pitch, model.yaw, boat); // Rotate model
	for (var i = 0; i < model.edges.current.length; i++) {
		if (model.normalVector[i].x * field_XYZ.X.z + model.normalVector[i].y * field_XYZ.Y.z + model.normalVector[i].z * field_XYZ.Z.z > 0) {;
			continue;
		}
		context.beginPath();
		xy = calcView(
		    model.edges.current[i][0].x + position.x - offset.x,
		    model.edges.current[i][0].y + position.y - offset.y,
		    model.edges.current[i][0].z + position.z - offset.z);
		context.moveTo(xy.x + offset.x, xy.y + offset.y);
		for (var j = 1; j <= model.edges.current[i].length; j++) {
			xy = calcView(
			    model.edges.current[i][j % model.edges.current[i].length].x + position.x - offset.x,
			    model.edges.current[i][j % model.edges.current[i].length].y + position.y - offset.y,
			    model.edges.current[i][j % model.edges.current[i].length].z + position.z - offset.z);
			context.lineTo(xy.x + offset.x, xy.y + offset.y);
		}
		context.stroke();
	}
}

function
make3dModel(modelEdges)
{
	var model = {roll: 0, pitch: 0, yaw: 0, edges: {origin: new Array(modelEdges.length), current: new Array(modelEdges.length)}, normalVector: new Array(modelEdges.length)};
	// Compute normal vector
	for (var i = 0; i < modelEdges.length; i++) {
		model.edges.origin[i] = new Array(modelEdges[i].length);
		model.edges.current[i] = new Array(modelEdges[i].length);
		for (var j = 0; j < modelEdges[i].length; j++) {
			model.edges.origin[i][j] = modelEdges[i][j];
			model.edges.current[i][j] = modelEdges[i][j];
		}
		model.normalVector[i] = calcNormalVector(modelEdges[i]);
	}
	return model;
}

function
calcNormalVector(edges)
{
	var vector = {x: 0, y: 0, z: 0};
	if (edges.length < 3) {
		return vector;
	}
	var a = {
	    x: edges[2].x - edges[1].x,
	    y: edges[2].y - edges[1].y,
	    z: edges[2].z - edges[1].z};
	var b = {
	    x: edges[0].x - edges[1].x,
	    y: edges[0].y - edges[1].y,
	    z: edges[0].z - edges[1].z};
	vector.x = a.y * b.z - a.z * b.y;
	vector.y = a.z * b.x - a.x * b.z;
	vector.z = a.x * b.y - a.y * b.x;
	var norm = norm_XYZ(vector);
	if (norm > 0.01) {
		vector.x /= norm;
		vector.y /= norm;
		vector.z /= norm;
	}
	return vector;
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
normalize_XYZ(xyz)
{
	var norm = norm_XYZ(xyz);
	if (norm > 0.1) {
		xyz.x /= norm;
		xyz.y /= norm;
		xyz.z /= norm;
	}
	return xyz;
}

function
rotate(x, y, XYZ)
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
	return ret;
}

function
rot_field_XYZ(x, y)
{
	field_XYZ.X = rotate(x, y, field_XYZ.X);
	field_XYZ.Y = rotate(x, y, field_XYZ.Y);
	field_XYZ.Z = rotate(x, y, field_XYZ.Z);
	// Normalize
	field_XYZ.X = normalize_XYZ(field_XYZ.X);
	field_XYZ.Y = normalize_XYZ(field_XYZ.Y);
	field_XYZ.Z = normalize_XYZ(field_XYZ.Z);
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
rot_field_XYZ_onZ(yaw, y)
{
	var X = {x: 0, y: 0, z: 0};
	var Y = {x: 0, y: 0, z: 0};
	X = field_XYZ.X;
	Y = field_XYZ.Y;
	var cos = Math.cos(2.0 * Math.PI * yaw / rot_degree);
	var sin = Math.sin(2.0 * Math.PI * yaw / rot_degree);
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
rotate3d(roll, pitch, yaw, XYZ)
{
	var di_r = {x: 0, y: 0, z: 0};
	var di_p = {x: 0, y: 0, z: 0};
	var di_y = {x: 0, y: 0, z: 0};
	var di_py = {x: 0, y: 0, z: 0};
	var di = {x: 0, y: 0, z: 0};
	// Yaw
	di_y.x =
	    XYZ.x * Math.cos(2.0 * Math.PI * yaw / rot_degree) -
	    XYZ.y * Math.sin(2.0 * Math.PI * yaw / rot_degree) -
	    XYZ.x;
	di_y.y =
	    XYZ.y * Math.cos(2.0 * Math.PI * yaw / rot_degree) +
	    XYZ.x * Math.sin(2.0 * Math.PI * yaw / rot_degree) -
	    XYZ.y;
	// Pitch
	di_p.x =
	    XYZ.x * Math.cos(2.0 * Math.PI * pitch / rot_degree) +
	    XYZ.z * Math.sin(2.0 * Math.PI * pitch / rot_degree) -
	    XYZ.x;
	di_p.z =
	    XYZ.z * Math.cos(2.0 * Math.PI * pitch / rot_degree) -
	    XYZ.x * Math.sin(2.0 * Math.PI * pitch / rot_degree) -
	    XYZ.z;
	di_py.x =
	    di_p.x +
	    di_y.x * Math.cos(2.0 * Math.PI * pitch / rot_degree);
	di_py.y = di_y.y;
	di_py.z =
	    di_p.z -
	    di_y.x * Math.sin(2.0 * Math.PI * pitch / rot_degree);
	// Roll
	di_r.y =
	    XYZ.y * Math.cos(2.0 * Math.PI * roll / rot_degree) -
	    XYZ.z * Math.sin(2.0 * Math.PI * roll/ rot_degree) -
	    XYZ.y;
	di_r.z =
	    XYZ.z * Math.cos(2.0 * Math.PI * roll / rot_degree) +
	    XYZ.y * Math.sin(2.0 * Math.PI * roll / rot_degree) -
	    XYZ.z;
	di.x = di_py.x;
	di.y =
	    di_r.y +
	    di_py.y * Math.cos(2.0 * Math.PI * roll / rot_degree) -
	    di_py.z * Math.sin(2.0 * Math.PI * roll/ rot_degree);
	di.z =
	    di_r.z +
	    di_py.z * Math.cos(2.0 * Math.PI * roll / rot_degree) +
	    di_py.y * Math.sin(2.0 * Math.PI * roll / rot_degree);
	return {x: XYZ.x + di.x, y: XYZ.y + di.y, z: XYZ.z + di.z};
}

function
rotate3dModel(roll, pitch, yaw, model)
{
	for (var i = 0; i < model.edges.origin.length; i++) {
		for (var j = 0; j < model.edges.origin[i].length; j++) {
			model.edges.current[i][j] = rotate3d(model.roll, model.pitch, model.yaw, model.edges.origin[i][j]);
		}
		model.normalVector[i] = calcNormalVector(model.edges.current[i]);
	}
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

