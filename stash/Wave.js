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
var view_offset = {x: 0, y: 0, z: 0};
var display_offset = {x: 0, y: 0, z: 0};
var rot_degree = 3600;
var colormap_quantize = 200;
var colormap = {current: [], normal: new Array(colormap_quantize), bluesea: new Array(colormap_quantize)};

var prev_clientX = 0;
var prev_clientY = 0;

// 3D object
var listObjects = new Array();
var boatPositionInitial = {x: 300, y: 300, z: 0};
var boatMass = 4;
var boat;
var boatEdges =
    [[{x:35, y:0, z:10}, {x:20, y:15, z:10}, {x:-20, y:15, z:10}, {x:-20, y:-15, z:10}, {x:20, y:-15, z:10}],
    [{x:35, y:0, z:10}, {x:20, y:0, z:-5}, {x:20, y:15, z:10}],
    [{x:35, y:0, z:10}, {x:20, y:-15, z:10}, {x:20, y:0, z:-5}],
    [{x:20, y:15, z:10}, {x:20, y:0, z:-5}, {x:-20, y:0, z:-5}, {x:-20, y:15, z:10}],
    [{x:20, y:-15, z:10}, {x:-20, y:-15, z:10}, {x:-20, y:0, z:-5}, {x:20, y:0, z:-5}],
    [{x:-20, y:15, z:10}, {x:-20, y:0, z:-5}, {x:-20, y:-15, z:10}]];



// Initialize
window.addEventListener("load", init, false);



// ----- Initialize -----
function
init()
{
	// Make colormap
	makeColormap();
	colormap.current = colormap.bluesea;
	// Initialize brane
	for (var i = 0; i < braneSize.height; i++) {
		for (var j = 0; j < braneSize.width; j++) {
			brane[i * braneSize.width + j] = 0.0;
			brane_tmp[i * braneSize.width + j] = 0.0;
			vel[i * braneSize.width + j] = 0.0;
		}
	}
	// Set view offset
	view_offset.x = braneSize.width * interval / 2.0
	view_offset.y = braneSize.height * interval / 2.0
	// Set display offset
	display_offset.x = braneSize.width * interval / 2.0
	display_offset.y = braneSize.height * interval / 2.0
	// Initialize canvas
	canvas = document.getElementById("mainPool");
	canvas.addEventListener("mousedown", mouseClick, false);
	canvas.addEventListener("mousemove", mouseMove, false);
	canvas.addEventListener("touchstart", mouseClick, false);
	canvas.addEventListener("touchmove", mouseMove, false);
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
	// Make 3D object
	boat = make3dObject(boatEdges, boatPositionInitial, {roll: 0, pitch: 0, yaw: 0}, {x: 0, y: 0, z: 0}, {roll: 0, pitch: 0, yaw: 0}, boatMass);
	// Add 3D objects to list
	listObjects.push(boat);
}




// ----- Start Simulation -----
function
loop()
{
	physics();
	draw();
	// Draw 3D object
	physicsObjects();
	draw3dObjects();
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
physicsObjects()
{
	for (var i = 0; i < listObjects.length; i++) {
		physicsObject(listObjects[i]);
	}
}

function
physicsObject(object)
{
	var x = Math.floor(object.x / interval);
	var y = Math.floor(object.y / interval);
	if (object.z > braneAt(x, y)) { // Under the water
		object.velocity.z -= g * dt; // Gravity
		object.velocity.x *= 0.98;
		object.velocity.y *= 0.98;
		object.velocity.z *= 0.98;
	} else {
		object.velocity.z += f_float / object.mass * dt; // Floating
		object.velocity.x *= 0.9;
		object.velocity.y *= 0.9;
		object.velocity.z *= 0.9;
		// Rolling
		var x_diff = braneAt(x + 1, y) - braneAt(x, y);
		var y_diff = braneAt(x, y + 1) - braneAt(x, y);
		var x_axis = rotate3d(object.roll, object.pitch, object.yaw, {x:1, y:0, z:0});
		var y_axis = rotate3d(object.roll, object.pitch, object.yaw, {x:0, y:1, z:0});
		var z_axis = rotate3d(object.roll, object.pitch, object.yaw, {x:0, y:0, z:1});
		object.velocityRolling.roll += rot_degree / 40.0 *
		    (Math.atan2(z_axis.z * (x_diff * y_axis.x + y_diff * y_axis.y - y_axis.z * interval), interval) / Math.PI -
		    0.25 * Math.sin(2.0 * Math.PI * object.roll / rot_degree) * Math.cos(asin(x_axis.z))) /
		    object.mass;
		object.velocityRolling.pitch += rot_degree / 40.0 *
		    (-Math.atan2(z_axis.z * (x_diff * x_axis.x + y_diff * x_axis.y - x_axis.z * interval), interval) / Math.PI -
		    0.25 * Math.sin(2.0 * Math.PI * object.pitch / rot_degree) * Math.cos(asin(y_axis.z))) /
		    object.mass;
		object.velocityRolling.yaw += rot_degree / 40.0 *
		    Math.atan2(y_axis.z * (x_diff * x_axis.x + y_diff * x_axis.y - x_axis.z * interval), interval) / Math.PI /
		    object.mass;
		if (braneInsideOrNot(x, y)) {
			brane[y * braneSize.width + x] -= object.mass * 0.3;
		}
		object.velocityRolling.roll *= 0.98;
		object.velocityRolling.pitch *= 0.98;
		object.velocityRolling.yaw *= 0.98;
	}
	object.x += object.velocity.x * dt;
	object.y += object.velocity.y * dt;
	object.z += object.velocity.z * dt;
	object.roll += object.velocityRolling.roll * dt;
	object.pitch += object.velocityRolling.pitch * dt;
	object.yaw += object.velocityRolling.yaw * dt;
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
	// Make colormap normal
	for (i = 0; i <= Math.floor(colormap_quantize / 2); i++) {
		colormap.normal[i] = 'rgb(0,' + Math.min(255, dc * i) + ',' + Math.max(0, 255 - dc * i) + ')';
	}
	for (i = Math.floor(colormap_quantize / 2); i < colormap_quantize; i++) {
		colormap.normal[i] = 'rgb(' + Math.min(255, dc * i) + ',' + Math.max(0, 255 - dc * i) + ',0)';
	}
	// Make colormap bluesea
	for (i = 0; i < colormap_quantize; i++) {
		colormap.bluesea[i] = 'rgb(0,' + Math.min(255, dc * i) + ',255)';
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
			context.strokeStyle = colormap.current[Math.min(colormap_quantize, amp)];
			context.beginPath();
			xy = calcView(
			    (j - 1) * interval - view_offset.x,
			    i * interval - view_offset.y,
			    braneAt(j - 1, i));
			context.moveTo(xy.x + display_offset.x, xy.y + display_offset.y);
			xy = calcView(
			    j * interval - view_offset.x,
			    i * interval - view_offset.y,
			    braneAt(j, i));
			context.lineTo(xy.x + display_offset.x, xy.y + display_offset.y);
			context.stroke();
		}
	}
	for (j = 0; j < braneSize.width; j++) {
		for (i = 1; i < braneSize.height; i++) {
			amp = Math.round(2 * Math.max(Math.abs(braneAt(j, i - 1)), Math.abs(braneAt(j, i))));
			context.strokeStyle = colormap.current[Math.min(colormap_quantize, amp)];
			context.beginPath();
			xy = calcView(
			    j * interval - view_offset.x,
			    (i - 1) * interval - view_offset.y,
			    braneAt(j, i - 1));
			context.moveTo(xy.x + display_offset.x, xy.y + display_offset.y);
			xy = calcView(
			    j * interval - view_offset.x,
			    i * interval - view_offset.y,
			    braneAt(j, i));
			context.lineTo(xy.x + display_offset.x, xy.y + display_offset.y);
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
draw3dObjects()
{
	for (var i = 0; i < listObjects.length; i++) {
		draw3dObject(listObjects[i]);
	}
}

function
draw3dObject(object)
{
	var xy;
	context.strokeStyle = "white";
	rotate3dObject(object.roll, object.pitch, object.yaw, boat); // Rotate object
	for (var i = 0; i < object.edges.current.length; i++) {
		if (object.normalVector[i].x * field_XYZ.X.z + object.normalVector[i].y * field_XYZ.Y.z + object.normalVector[i].z * field_XYZ.Z.z > 0) {;
			continue;
		}
		context.beginPath();
		xy = calcView(
		    object.edges.current[i][0].x + object.x - view_offset.x,
		    object.edges.current[i][0].y + object.y - view_offset.y,
		    object.edges.current[i][0].z + object.z - view_offset.z);
		context.moveTo(xy.x + display_offset.x, xy.y + display_offset.y);
		for (var j = 1; j <= object.edges.current[i].length; j++) {
			xy = calcView(
			    object.edges.current[i][j % object.edges.current[i].length].x + object.x - view_offset.x,
			    object.edges.current[i][j % object.edges.current[i].length].y + object.y - view_offset.y,
			    object.edges.current[i][j % object.edges.current[i].length].z + object.z - view_offset.z);
			context.lineTo(xy.x + display_offset.x, xy.y + display_offset.y);
		}
		context.stroke();
	}
}

function
make3dObject(objectEdges, position, rolling, velocity, velocityRolling, mass)
{
	var object = {x: position.x, y: position.y, z: position.z, roll: rolling.roll, pitch: rolling.pitch, yaw: rolling.yaw, edges: {origin: new Array(objectEdges.length), current: new Array(objectEdges.length)}, normalVector: new Array(objectEdges.length), velocity: velocity, velocityRolling: velocityRolling, mass: mass};
	// Compute normal vector
	for (var i = 0; i < objectEdges.length; i++) {
		object.edges.origin[i] = new Array(objectEdges[i].length);
		object.edges.current[i] = new Array(objectEdges[i].length);
		for (var j = 0; j < objectEdges[i].length; j++) {
			object.edges.origin[i][j] = objectEdges[i][j];
			object.edges.current[i][j] = objectEdges[i][j];
		}
		object.normalVector[i] = calcNormalVector(objectEdges[i]);
	}
	return object;
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
rotate3dObject(roll, pitch, yaw, object)
{
	for (var i = 0; i < object.edges.origin.length; i++) {
		for (var j = 0; j < object.edges.origin[i].length; j++) {
			object.edges.current[i][j] = rotate3d(object.roll, object.pitch, object.yaw, object.edges.origin[i][j]);
		}
		object.normalVector[i] = calcNormalVector(object.edges.current[i]);
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
mouseMove(event)
{
	event.preventDefault();
	if (event.type === "mousemove") {
		if ((event.buttons & 1) != 0) {
			rot_field_XYZ_onZ(event.clientX - prev_clientX, event.clientY - prev_clientY);
		} else if ((event.buttons & 4) != 0) {
			view_offset.x += event.clientX - prev_clientX;
			view_offset.y += event.clientY - prev_clientY;
		}
		prev_clientX = event.clientX;
		prev_clientY = event.clientY;
	} else if (event.type === "touchmove") {
		if (event.touches.length == 1) {
			rot_field_XYZ_onZ(event.touches[0].clientX - prev_clientX, event.touches[0].clientY - prev_clientY);
		}
		prev_clientX = event.touches[0].clientX;
		prev_clientY = event.touches[0].clientY;
	}
}

