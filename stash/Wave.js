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
var raining = null;

var scale = 1.0;
var field_XYZ = {X: {x: 1.0, y: 0.0, z: 0.0}, Y: {x: 0.0, y: 1.0, z: 0.0}, Z: {x: 0.0, y: 0.0, z: 1.0}};
var view_offset = {x: 0, y: 0, z: 0};
var display_offset = {x: 0, y: 0, z: 0};
var rot_degree = 3600;
var colormap_quantize = 200;
var colormap = {current: [], normal: new Array(colormap_quantize), bluesea: new Array(colormap_quantize)};

var prev_clientX = 0;
var prev_clientY = 0;

// 3D object
var throttleAccelerate = 0.2;
var listObjects = new Array();
var boatPositionInitial = {x: 300, y: 300, z: 0};
var boatMass = 4;
var boatThrottleMax = 5;
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
	// Set event listener
	window.addEventListener("keydown", keyDown, false);
	document.getElementById("collapseButton").addEventListener("mousedown", collapseBoat, false);
	document.getElementById("collapseButton").addEventListener("touchstart", collapseBoat, false);
	// Adjust initial view rotation
	rot_field_XYZ(0, Math.PI * 120.0 / 180.0);
	// Start loop
	timeClock = setInterval(loop, 25);
	// Random impulse
	raining = setInterval(function ()
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
	physicsObjects();
	draw();
}



// ----- REALTIME -----
function
braneAt(x, y)
{
	if (x < 0 || braneSize.width <= x || y < 0 || braneSize.height <= y) {
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
physics()
{
	for (var y = 0; y < braneSize.height; y++) {
		for (var x = 0; x < braneSize.width; x++) {
			vel[y * braneSize.width + x] += accelBrane(x, y) * dt;
			vel[y * braneSize.width + x] *= 0.98; // damping
			brane_tmp[y * braneSize.width + x] = brane[y * braneSize.width + x] + vel[y * braneSize.width + x] * dt;
		}
	}
	for (var n = 0; n < brane.length; n++) {
		brane[n] = brane_tmp[n];
	}
}

function
accelBrane(x, y)
{
	var interest = braneAt(x, y);
	var a = 0.0;
	a += k_brane * (braneAt(x, y - 1) - interest);
	a += k_brane * (braneAt(x, y + 1) - interest);
	a += k_brane * (braneAt(x - 1, y) - interest);
	a += k_brane * (braneAt(x + 1, y) - interest);
	return a;
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
	var x_axis = rotate3d(object.rolling, {x:1, y:0, z:0});
	var y_axis = rotate3d(object.rolling, {x:0, y:1, z:0});
	var z_axis = rotate3d(object.rolling, {x:0, y:0, z:1});
	var x = Math.floor(object.position.x / interval);
	var y = Math.floor(object.position.y / interval);
	var dampingVelocity = 0.05;
	// Gravity
	object.velocity.z -= g * dt;
	// Under the sea
	if (object.position.z < braneAt(x, y)) { // Under the water
		// Floating
		object.velocity.z += Math.min(Math.pow((braneAt(x, y) - object.position.z) / 10.0, 2), 1.0) * f_float * dt;
		// Accelerate object if throttle is used
		object.velocity.x += object.throttle * throttleAccelerate * x_axis.x;
		object.velocity.y += object.throttle * throttleAccelerate * x_axis.y;
		object.velocity.z += object.throttle * throttleAccelerate * x_axis.z;
		// Set damping factor
		dampingVelocity = 0.1 + 0.0 * Math.min(Math.pow((braneAt(x, y) - object.position.z) / 10.0, 2), 1.0);
		// Rolling
		var x_diff = braneAt(x + 1, y) - braneAt(x, y);
		var y_diff = braneAt(x, y + 1) - braneAt(x, y);
		object.velocityRolling.roll +=
		    Math.atan2(z_axis.z * (x_diff * y_axis.x + y_diff * y_axis.y - y_axis.z * interval), interval) / object.mass / 40.0 -
		    0.2 * Math.sin(object.rolling.roll) * Math.cos(asin(x_axis.z));
		object.velocityRolling.pitch +=
		    -Math.atan2(z_axis.z * (x_diff * x_axis.x + y_diff * x_axis.y - x_axis.z * interval), interval) / object.mass / 40.0 -
		    0.2 * Math.sin(object.rolling.pitch) * Math.cos(asin(y_axis.z));
		object.velocityRolling.yaw +=
		    Math.atan2(y_axis.z * (x_diff * x_axis.x + y_diff * x_axis.y - x_axis.z * interval), interval) / object.mass / 40.0;
		if (braneInsideOrNot(x, y)) {
			brane[y * braneSize.width + x] -= object.mass * 0.3;
		}
	}
	// Update position and velocity
	object.position.x += object.velocity.x * dt;
	object.position.y += object.velocity.y * dt;
	object.position.z += object.velocity.z * dt;
	object.velocity.x -=
	    object.velocity.x * dampingVelocity * dt;
	object.velocity.y -=
	    object.velocity.y * dampingVelocity * dt;
	object.velocity.z -=
	    object.velocity.z * dampingVelocity * dt;
	object.rolling.roll += object.velocityRolling.roll * dt;
	object.rolling.pitch += object.velocityRolling.pitch * dt;
	object.rolling.yaw += object.velocityRolling.yaw * dt;
	object.velocityRolling.roll -= object.velocityRolling.roll * dampingVelocity * dt;
	object.velocityRolling.pitch -= object.velocityRolling.pitch * dampingVelocity * dt;
	object.velocityRolling.yaw -= object.velocityRolling.yaw * dampingVelocity * dt;
	rotate3dObject(object); // Rotate object
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
	context.clearRect(0, 0, canvas.width, canvas.height);
	drawBrane();
	drawXYZVector();
	// Draw 3D object
	draw3dObjects();
	drawThrottle();
}

function
drawBrane()
{
	var xy = {x: 0, y: 0};
	var x;
	var y;
	var amp;
	context.strokeStyle = 'blue';
	for (y = 0; y < braneSize.height; y++) {
		for (x = 1; x < braneSize.width; x++) {
			amp = Math.round(2 * Math.max(Math.abs(braneAt(x - 1, y)), Math.abs(braneAt(x, y))));
			context.strokeStyle = colormap.current[Math.min(colormap_quantize, amp)];
			context.beginPath();
			xy = calcView(
			    (x - 1) * interval,
			    y * interval,
			    braneAt(x - 1, y));
			context.moveTo(xy.x, xy.y);
			xy = calcView(
			    x * interval,
			    y * interval,
			    braneAt(x, y));
			context.lineTo(xy.x, xy.y);
			context.stroke();
		}
	}
	for (x = 0; x < braneSize.width; x++) {
		for (y = 1; y < braneSize.height; y++) {
			amp = Math.round(2 * Math.max(Math.abs(braneAt(x, y - 1)), Math.abs(braneAt(x, y))));
			context.strokeStyle = colormap.current[Math.min(colormap_quantize, amp)];
			context.beginPath();
			xy = calcView(
			    x * interval,
			    (y - 1) * interval,
			    braneAt(x, y - 1));
			context.moveTo(xy.x, xy.y);
			xy = calcView(
			    x * interval,
			    y * interval,
			    braneAt(x, y));
			context.lineTo(xy.x, xy.y);
			context.stroke();
		}
	}
}

function
drawXYZVector()
{
	// Show XYZ coordinate
	context.lineWidth = 2;
	context.beginPath();
	context.moveTo(42, 42);
	context.strokeStyle = "red";
	context.lineTo(42 + 42 * field_XYZ.X.x, 42 + 42 * field_XYZ.X.y);
	var xy = calcXYZOnFieldXYZ(-7, -7, 0);
	context.lineTo(42 + 42 * field_XYZ.X.x + xy.x, 42 + 42 * field_XYZ.X.y + xy.y);
	xy = calcXYZOnFieldXYZ(-7, 8, 0);
	context.lineTo(42 + 42 * field_XYZ.X.x + xy.x, 42 + 42 * field_XYZ.X.y + xy.y);
	context.stroke();
	context.beginPath();
	context.moveTo(42, 42);
	context.strokeStyle = "lime";
	context.lineTo(42 + 42 * field_XYZ.Y.x, 42 + 42 * field_XYZ.Y.y);
	xy = calcXYZOnFieldXYZ(7, -7, 0);
	context.lineTo(42 + 42 * field_XYZ.Y.x + xy.x, 42 + 42 * field_XYZ.Y.y + xy.y);
	xy = calcXYZOnFieldXYZ(-8, -7, 0);
	context.lineTo(42 + 42 * field_XYZ.Y.x + xy.x, 42 + 42 * field_XYZ.Y.y + xy.y);
	context.stroke();
	context.beginPath();
	context.moveTo(42, 42);
	context.strokeStyle = "blue";
	context.lineTo(42 + 42 * field_XYZ.Z.x, 42 + 42 * field_XYZ.Z.y);
	xy = calcXYZOnFieldXYZ(0, 7, -7);
	context.lineTo(42 + 42 * field_XYZ.Z.x + xy.x, 42 + 42 * field_XYZ.Z.y + xy.y);
	xy = calcXYZOnFieldXYZ(0, -8, -7);
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
	for (var i = 0; i < object.edges.current.length; i++) {
		if (object.edges.current.length > 1 &&
		    object.normalVector[i].x * field_XYZ.X.z + object.normalVector[i].y * field_XYZ.Y.z + object.normalVector[i].z * field_XYZ.Z.z > 0) {;
			continue;
		}
		context.beginPath();
		xy = calcView(
		    object.edges.current[i][0].x + object.position.x,
		    object.edges.current[i][0].y + object.position.y,
		    object.edges.current[i][0].z + object.position.z);
		context.moveTo(xy.x, xy.y);
		for (var j = 1; j <= object.edges.current[i].length; j++) {
			xy = calcView(
			    object.edges.current[i][j % object.edges.current[i].length].x + object.position.x,
			    object.edges.current[i][j % object.edges.current[i].length].y + object.position.y,
			    object.edges.current[i][j % object.edges.current[i].length].z + object.position.z);
			context.lineTo(xy.x, xy.y);
		}
		context.stroke();
	}
}

function
drawThrottle()
{
	var throttleSteps = boatThrottleMax + Math.floor(boatThrottleMax / 2.0) + 1;
	var throttleStepInterval = 5;
	context.lineWidth = 2;
	// Write ruler
	context.beginPath();
	context.moveTo(100, 10);
	context.strokeStyle = "white";
	context.lineTo(100, 10 + throttleStepInterval * (throttleSteps - 1));
	for (var i = 0; i < throttleSteps; i++) {
		context.moveTo(100, 10 + throttleStepInterval * i);
		context.lineTo(105, 10 + throttleStepInterval * i);
		if (i == boatThrottleMax) {
			context.lineTo(110, 10 + throttleStepInterval * i);
		}
	}
	context.stroke();
	// Write current throttle
	context.strokeStyle = "red";
	context.beginPath();
	context.moveTo(112, 10 + throttleStepInterval * (boatThrottleMax - boat.throttle));
	context.lineTo(132, 10 + throttleStepInterval * (boatThrottleMax - boat.throttle));
	context.stroke();
	// Reset lineWidth
	context.lineWidth = 1;
}

function
make3dObject(objectEdges, position, rolling, velocity, velocityRolling, mass)
{
	var object = {
		position: {x: position.x, y: position.y, z: position.z},
		rolling: {roll: rolling.roll, pitch: rolling.pitch, yaw: rolling.yaw},
		edges: {origin: new Array(objectEdges.length), current: new Array(objectEdges.length)},
		normalVector: new Array(objectEdges.length),
		velocity: {x: velocity.x, y: velocity.y, z: velocity.z},
		velocityRolling: {roll: velocityRolling.roll, pitch: velocityRolling.pitch, yaw: velocityRolling.yaw},
		mass: mass,
		throttle: 0.0};
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
collapseBoat()
{
	collapse3dObject(boat);
}

function
collapse3dObject(object)
{
	var index = listObjects.indexOf(object);
	listObjects.splice(index, 1);
	for (var i = 0; i < object.edges.origin.length; i++) {
		for (var j = 1; j <= object.edges.origin[i].length; j++) {
			var edge = [object.edges.origin[i][j - 1], object.edges.origin[i][j % object.edges.origin[i].length]];
			var norm = norm_XYZ({x: edge[1].x - edge[0].x, y: edge[1].y - edge[0].y, z: edge[1].z - edge[0].z});
			var newObject = make3dObject(
			    [[{x: -norm / 2, y: 0, z: 0}, {x: norm /2, y: 0, z: 0}]],
			    object.position,
			    object.rolling,
			    {x: 100 * (Math.random() - 0.5), y: 100 * (Math.random() - 0.5), z: 100 * Math.random()},
			    {roll: 2.0 * Math.PI * (Math.random() - 0.5), pitch: 2.0 * Math.PI * (Math.random() - 0.5), yaw: 2.0 * Math.PI * (Math.random() - 0.5)},
			    object.mass / object.edges.origin.length);
			listObjects.push(newObject);
		}
	}
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
calcXYZOnFieldXYZ(x, y, z)
{
	var xy = {x: 0, y: 0};
	xy.x = x * field_XYZ.X.x + y * field_XYZ.Y.x + z * field_XYZ.Z.x;
	xy.y = x * field_XYZ.X.y + y * field_XYZ.Y.y + z * field_XYZ.Z.y;
	return xy;
}

function
calcView(x, y, z)
{
	var xy = {x: 0, y: 0};
	var X = x - view_offset.x;
	var Y = y - view_offset.y;
	var Z = z - view_offset.z;
	xy.x = scale * (X * field_XYZ.X.x + Y * field_XYZ.Y.x + Z * field_XYZ.Z.x) + display_offset.x;
	xy.y = scale * (X * field_XYZ.X.y + Y * field_XYZ.Y.y + Z * field_XYZ.Z.y) + display_offset.y;
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
	ret.x = XYZ.x * Math.cos(x) - XYZ.z * Math.sin(x);
	ret.z = XYZ.z * Math.cos(x) + XYZ.x * Math.sin(x);
	ret.y = XYZ.y * Math.cos(y) - ret.z * Math.sin(y);
	ret.z = ret.z * Math.cos(y) + XYZ.y * Math.sin(y);
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
	var cos = Math.cos(yaw);
	var sin = Math.sin(yaw);
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
rotate3d(rolling, XYZ)
{
	var di_r = {x: 0, y: 0, z: 0};
	var di_p = {x: 0, y: 0, z: 0};
	var di_y = {x: 0, y: 0, z: 0};
	var di_py = {x: 0, y: 0, z: 0};
	var di = {x: 0, y: 0, z: 0};
	// Yaw
	di_y.x =
	    XYZ.x * Math.cos(rolling.yaw) -
	    XYZ.y * Math.sin(rolling.yaw) -
	    XYZ.x;
	di_y.y =
	    XYZ.y * Math.cos(rolling.yaw) +
	    XYZ.x * Math.sin(rolling.yaw) -
	    XYZ.y;
	// Pitch
	di_p.x =
	    XYZ.x * Math.cos(rolling.pitch) +
	    XYZ.z * Math.sin(rolling.pitch) -
	    XYZ.x;
	di_p.z =
	    XYZ.z * Math.cos(rolling.pitch) -
	    XYZ.x * Math.sin(rolling.pitch) -
	    XYZ.z;
	di_py.x = di_p.x + di_y.x * Math.cos(rolling.pitch);
	di_py.y = di_y.y;
	di_py.z = di_p.z - di_y.x * Math.sin(rolling.pitch);
	// Roll
	di_r.y =
	    XYZ.y * Math.cos(rolling.roll) -
	    XYZ.z * Math.sin(rolling.roll) -
	    XYZ.y;
	di_r.z =
	    XYZ.z * Math.cos(rolling.roll) +
	    XYZ.y * Math.sin(rolling.roll) -
	    XYZ.z;
	di.x = di_py.x;
	di.y =
	    di_r.y +
	    di_py.y * Math.cos(rolling.roll) -
	    di_py.z * Math.sin(rolling.roll);
	di.z =
	    di_r.z +
	    di_py.z * Math.cos(rolling.roll) +
	    di_py.y * Math.sin(rolling.roll);
	return {x: XYZ.x + di.x, y: XYZ.y + di.y, z: XYZ.z + di.z};
}

function
rotate3dObject(object)
{
	for (var i = 0; i < object.edges.origin.length; i++) {
		for (var j = 0; j < object.edges.origin[i].length; j++) {
			object.edges.current[i][j] = rotate3d(object.rolling, object.edges.origin[i][j]);
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
			rot_field_XYZ_onZ(
			    2.0 * Math.PI * (event.clientX - prev_clientX) / rot_degree,
			    2.0 * Math.PI * (event.clientY - prev_clientY) / rot_degree);
		} else if ((event.buttons & 4) != 0) {
			var move = {x: 0, y: 0}
			move.x = event.clientX - prev_clientX;
			move.y = event.clientY - prev_clientY;
			view_offset.x -= move.x * field_XYZ.X.x + move.y * field_XYZ.X.y;
			view_offset.y -= move.x * field_XYZ.Y.x + move.y * field_XYZ.Y.y;
			view_offset.z -= move.x * field_XYZ.Z.x + move.y * field_XYZ.Z.y;
		}
		prev_clientX = event.clientX;
		prev_clientY = event.clientY;
	} else if (event.type === "touchmove") {
		if (event.touches.length == 1) {
			rot_field_XYZ_onZ(
			    2.0 * Math.PI * (event.touches[0].clientX - prev_clientX) / rot_degree,
			    2.0 * Math.PI * (event.touches[0].clientY - prev_clientY) / rot_degree);
		} else if (event.touches.length == 2) {
			var move = {x: 0, y: 0}
			move.x = event.touches[0].clientX - prev_clientX;
			move.y = event.touches[0].clientY - prev_clientY;
			view_offset.x -= move.x * field_XYZ.X.x + move.y * field_XYZ.X.y;
			view_offset.y -= move.x * field_XYZ.Y.x + move.y * field_XYZ.Y.y;
			view_offset.z -= move.x * field_XYZ.Z.x + move.y * field_XYZ.Z.y;
		}
		prev_clientX = event.touches[0].clientX;
		prev_clientY = event.touches[0].clientY;
	}
}

function
keyDown(event)
{
	event.preventDefault();
	switch (event.key) {
		case "ArrowUp":
			if (boat.throttle < boatThrottleMax) {
				boat.throttle++;
			}
			break;
		case "ArrowDown":
			if (boat.throttle > -Math.floor(boatThrottleMax / 2.0)) {
				boat.throttle--;
			}
			break;
		case "ArrowLeft":
			boat.velocityRolling.yaw += Math.PI * 0.5 / 180.0;
			break;
		case "ArrowRight":
			boat.velocityRolling.yaw -= Math.PI * 0.5 / 180.0;
			break;
	}
}

