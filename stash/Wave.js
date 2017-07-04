// The code written in BSD/KNF indent style
"use strict";

class WaveSimulator {
	constructor(windowSystemRoot, rootWindow) {
		this.SysRoot = windowSystemRoot;
		this.rootWindow = rootWindow;
		this.rootWindow.style.overflow = "hidden";
		this.rootWindow.rootInstance = this;
		this.rootWindowStyle = window.getComputedStyle(this.rootWindow);

		this.collapseButton = null;

		this.timeClock = null;

		this.canvas = null;
		this.context = null;

		this.dt = 0.25;
		this.g = 2.4;
		this.f_float = 5.0;
		this.braneSize = {width: 33, height: 33};
		this.brane = new Array(this.braneSize.width * this.braneSize.height);
		this.brane_tmp = new Array(this.braneSize.width * this.braneSize.height);
		this.velocity = new Array(this.braneSize.width * this.braneSize.height);
		this.k_brane = 0.2;
		this.interval = 30; // drawing interval pixels

		this.rainThreshold = 0.1;
		this.raining = null;

		this.scale = 1.0;
		this.fieldXYZ = {X: {x: 1.0, y: 0.0, z: 0.0}, Y: {x: 0.0, y: 1.0, z: 0.0}, Z: {x: 0.0, y: 0.0, z: 1.0}};
		this.viewOffset = {x: 0, y: 0, z: 0};
		this.displayOffset = {x: 0, y: 0, z: 0};
		this.rotDegree = 3600;
		this.colormapQuantize = 200;
		this.colormap = {current: [], normal: new Array(this.colormapQuantize), bluesea: new Array(this.colormapQuantize)};

		this.prev_clientX = 0;
		this.prev_clientY = 0;

		// 3D object
		this.throttleAccelerate = 0.2;
		this.listObjects = new Array();
		this.boatPositionInitial = {x: 300, y: 300, z: 0};
		this.boatMass = 4;
		this.boatThrottleMax = 5;
		this.boat;
		this.boatEdges =
		    [[{x:35, y:0, z:10}, {x:20, y:15, z:10}, {x:-20, y:15, z:10}, {x:-20, y:-15, z:10}, {x:20, y:-15, z:10}],
		    [{x:35, y:0, z:10}, {x:20, y:0, z:-5}, {x:20, y:15, z:10}],
		    [{x:35, y:0, z:10}, {x:20, y:-15, z:10}, {x:20, y:0, z:-5}],
		    [{x:20, y:15, z:10}, {x:20, y:0, z:-5}, {x:-20, y:0, z:-5}, {x:-20, y:15, z:10}],
		    [{x:20, y:-15, z:10}, {x:-20, y:-15, z:10}, {x:-20, y:0, z:-5}, {x:20, y:0, z:-5}],
		    [{x:-20, y:15, z:10}, {x:-20, y:0, z:-5}, {x:-20, y:-15, z:10}]];
		
		// Initialize
		this.init();
	}

// ----- Initialize -----
	init()
	{
		// Make colormap
		this.makeColormap();
		this.colormap.current = this.colormap.bluesea;
		// Initialize brane
		for (let i = 0; i < this.braneSize.height; i++) {
			for (let j = 0; j < this.braneSize.width; j++) {
				this.brane[i * this.braneSize.width + j] = 0.0;
				this.brane_tmp[i * this.braneSize.width + j] = 0.0;
				this.velocity[i * this.braneSize.width + j] = 0.0;
			}
		}
		// Initialize canvas
		this.prepareCanvas();
		// Set event listener
		this.rootWindow.addEventListener("keydown", function (e) { e.currentTarget.rootInstance.keyDown(e); }, false);
		this.collapseButton = document.createElement("div");
		this.collapseButton.rootInstance = this;
		this.collapseButton.innerHTML = "collapse";
		this.collapseButton.id = "collapseButton";
		this.collapseButton.addEventListener("mousedown", function (e) { e.preventDefault(); e.currentTarget.rootInstance.collapseBoat(e); }, false);
		this.collapseButton.addEventListener("touchstart", function (e) { e.preventDefault(); e.currentTarget.rootInstance.collapseBoat(e); }, false);
		this.rootWindow.appendChild(this.collapseButton);

		// Adjust initial view rotation
		this.rotXYZ(this.fieldXYZ, 0, Math.PI * 120.0 / 180.0);
		// Set root for setInterval
		let root = this;
		// Start loop
		this.timeClock = setInterval(function () { root.loop(); }, 25);
		// Random impulse
		this.raining = setInterval(function ()
		    {
			    let f = Math.random();
			    if (f < root.rainThreshold) {
				    root.brane[Math.floor(33 * Math.random()) * root.braneSize.width + Math.floor(33 * Math.random())] = 200.0 * f;
				    root.rainThreshold += root.rainThreshold < 1.0 ? 0.001 : 0.0;
			    }
		    }, 50);
		// Make 3D object
		this.boat = this.make3dObject(this.boatEdges, this.boatPositionInitial, {roll: 0, pitch: 0, yaw: 0}, {x: 0, y: 0, z: 0}, {roll: 0, pitch: 0, yaw: 0}, this.boatMass);
		// Add 3D objects to list
		this.listObjects.push(this.boat);

		// Set view offset
		this.viewOffset.x = this.braneSize.width * this.interval / 2.0
		this.viewOffset.y = this.braneSize.height * this.interval / 2.0
		// Set display offset
		this.displayOffset.x = this.canvas.width / 2.0
		this.displayOffset.y = this.canvas.height / 2.0
	}

	prepareCanvas()
	{
		// Initialize canvas
		this.canvas = document.createElement("canvas");
		this.canvas.rootInstance = this;
		this.canvas.id = "WaveSimulatorMainPool";
		this.canvas.style.width = "100%";
		this.canvas.style.height = "100%";
		this.rootWindow.appendChild(this.canvas);
		this.canvas.addEventListener(
		    "windowdrag",
		    function (e) {
			    let style = window.getComputedStyle(e.currentTarget);
			    e.currentTarget.width = parseInt(style.width, 10);
			    e.currentTarget.height = parseInt(style.height, 10);
			    let root = e.currentTarget.rootInstance;
			    root.displayOffset.x = e.currentTarget.width / 2.0
			    root.displayOffset.y = e.currentTarget.height / 2.0
		    },
		    false);
		this.canvas.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.mouseClick(e); }, false);
		this.canvas.addEventListener("mousemove", function (e) { e.currentTarget.rootInstance.mouseMove(e); }, false);
		this.canvas.addEventListener("touchstart", function (e) { e.currentTarget.rootInstance.mouseClick(e); }, false);
		this.canvas.addEventListener("touchmove", function (e) { e.currentTarget.rootInstance.mouseMove(e); }, false);
		this.context = this.canvas.getContext("2d");
		// Initialize canvas size
		let canvasStyle = window.getComputedStyle(this.canvas);
		this.canvas.width = parseInt(canvasStyle.width, 10);
		this.canvas.height = parseInt(canvasStyle.height, 10);
	}

	// ----- Start Simulation -----
	loop()
	{
		this.physics();
		this.physicsObjects();
		this.draw();
	}



	// ----- REALTIME -----
	braneAt(x, y)
	{
		if (x < 0 || this.braneSize.width <= x || y < 0 || this.braneSize.height <= y) {
			return 0.0;
		} else {
			return this.brane[y * this.braneSize.width + x];
		}
	}

	braneInsideOrNot(x, y)
	{
		if (x < 0 || this.braneSize.width <= x || y <= 0 || this.braneSize.height <= y) {
			return false;
		} else {
			return true;
		}
	}

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

	physics()
	{
		for (let y = 0; y < this.braneSize.height; y++) {
			for (let x = 0; x < this.braneSize.width; x++) {
				this.velocity[y * this.braneSize.width + x] += this.accelBrane(x, y) * this.dt;
				this.velocity[y * this.braneSize.width + x] *= 0.98; // damping
				this.brane_tmp[y * this.braneSize.width + x] = this.brane[y * this.braneSize.width + x] + this.velocity[y * this.braneSize.width + x] * this.dt;
			}
		}
		for (let n = 0; n < this.brane.length; n++) {
			this.brane[n] = this.brane_tmp[n];
		}
	}

	accelBrane(x, y)
	{
		let interest = this.braneAt(x, y);
		let a = 0.0;
		a += this.k_brane * (this.braneAt(x, y - 1) - interest);
		a += this.k_brane * (this.braneAt(x, y + 1) - interest);
		a += this.k_brane * (this.braneAt(x - 1, y) - interest);
		a += this.k_brane * (this.braneAt(x + 1, y) - interest);
		return a;
	}

	physicsObjects()
	{
		for (let i = 0; i < this.listObjects.length; i++) {
			this.physicsObject(this.listObjects[i]);
		}
	}

	physicsObject(object)
	{
		let x_axis = this.rotate3d({x:1, y:0, z:0}, object.rolling);
		let y_axis = this.rotate3d({x:0, y:1, z:0}, object.rolling);
		let z_axis = this.rotate3d({x:0, y:0, z:1}, object.rolling);
		let x = Math.floor(object.position.x / this.interval);
		let y = Math.floor(object.position.y / this.interval);
		let dampingVelocity = 0.05;
		// Gravity
		object.velocity.z -= this.g * this.dt;
		// Under the sea
		if (object.position.z < this.braneAt(x, y)) { // Under the water
			// Floating
			object.velocity.z += Math.min(Math.pow((this.braneAt(x, y) - object.position.z) / 10.0, 2), 1.0) * this.f_float * this.dt;
			// Accelerate object if throttle is used
			object.velocity.x += object.throttle * this.throttleAccelerate * x_axis.x;
			object.velocity.y += object.throttle * this.throttleAccelerate * x_axis.y;
			object.velocity.z += object.throttle * this.throttleAccelerate * x_axis.z;
			// Set damping factor
			dampingVelocity = 0.1 + 0.0 * Math.min(Math.pow((this.braneAt(x, y) - object.position.z) / 10.0, 2), 1.0);
			// Rolling
			let x_diff = this.braneAt(x + 1, y) - this.braneAt(x, y);
			let y_diff = this.braneAt(x, y + 1) - this.braneAt(x, y);
			object.velocityRolling.roll +=
			    Math.atan2(z_axis.z * (x_diff * y_axis.x + y_diff * y_axis.y - y_axis.z * this.interval), this.interval) / object.mass / 40.0 -
			    0.2 * Math.sin(object.rolling.roll) * Math.cos(this.asin(x_axis.z));
			object.velocityRolling.pitch +=
			    -Math.atan2(z_axis.z * (x_diff * x_axis.x + y_diff * x_axis.y - x_axis.z * this.interval), this.interval) / object.mass / 40.0 -
			    0.2 * Math.sin(object.rolling.pitch) * Math.cos(this.asin(y_axis.z));
			object.velocityRolling.yaw +=
			    Math.atan2(y_axis.z * (x_diff * x_axis.x + y_diff * x_axis.y - x_axis.z * this.interval), this.interval) / object.mass / 40.0;
			if (this.braneInsideOrNot(x, y)) {
				this.brane[y * this.braneSize.width + x] -= object.mass * 0.3;
			}
		}
		// Update position and velocity
		object.position.x += object.velocity.x * this.dt;
		object.position.y += object.velocity.y * this.dt;
		object.position.z += object.velocity.z * this.dt;
		object.velocity.x -=
		    object.velocity.x * dampingVelocity * this.dt;
		object.velocity.y -=
		    object.velocity.y * dampingVelocity * this.dt;
		object.velocity.z -=
		    object.velocity.z * dampingVelocity * this.dt;
		object.rolling.roll += object.velocityRolling.roll * this.dt;
		object.rolling.pitch += object.velocityRolling.pitch * this.dt;
		object.rolling.yaw += object.velocityRolling.yaw * this.dt;
		object.velocityRolling.roll -= object.velocityRolling.roll * dampingVelocity * this.dt;
		object.velocityRolling.pitch -= object.velocityRolling.pitch * dampingVelocity * this.dt;
		object.velocityRolling.yaw -= object.velocityRolling.yaw * dampingVelocity * this.dt;
		this.rotate3dObject(object); // Rotate object
	}

	makeColormap()
	{
		let dc = Math.ceil(255 / (this.colormapQuantize / 2));
		// Make colormap normal
		for (let i = 0; i <= Math.floor(this.colormapQuantize / 2); i++) {
			this.colormap.normal[i] = 'rgb(0,' + Math.min(255, dc * i) + ',' + Math.max(0, 255 - dc * i) + ')';
		}
		for (let i = Math.floor(this.colormapQuantize / 2); i < this.colormapQuantize; i++) {
			this.colormap.normal[i] = 'rgb(' + Math.min(255, dc * i) + ',' + Math.max(0, 255 - dc * i) + ',0)';
		}
		// Make colormap bluesea
		for (let i = 0; i < this.colormapQuantize; i++) {
			this.colormap.bluesea[i] = 'rgb(0,' + Math.min(255, dc * i) + ',255)';
		}
	}

	draw()
	{
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawBrane();
		this.drawXYZVector();
		// Draw 3D object
		this.draw3dObjects();
		this.drawThrottle();
	}

	drawBrane()
	{
		let xy = {x: 0, y: 0};
		let amp;
		this.context.strokeStyle = 'blue';
		for (let y = 0; y < this.braneSize.height; y++) {
			for (let x = 1; x < this.braneSize.width; x++) {
				amp = Math.round(2 * Math.max(Math.abs(this.braneAt(x - 1, y)), Math.abs(this.braneAt(x, y))));
				this.context.strokeStyle = this.colormap.current[Math.min(this.colormapQuantize, amp)];
				this.context.beginPath();
				xy = this.calcView(
				    (x - 1) * this.interval,
				    y * this.interval,
				    this.braneAt(x - 1, y),
				    this.scale,
				    this.viewOffset,
				    this.fieldXYZ);
				this.context.moveTo(xy.x, xy.y);
				xy = this.calcView(
				    x * this.interval,
				    y * this.interval,
				    this.braneAt(x, y),
				    this.scale,
				    this.viewOffset,
				    this.fieldXYZ);
				this.context.lineTo(xy.x, xy.y);
				this.context.stroke();
			}
		}
		for (let x = 0; x < this.braneSize.width; x++) {
			for (let y = 1; y < this.braneSize.height; y++) {
				amp = Math.round(2 * Math.max(Math.abs(this.braneAt(x, y - 1)), Math.abs(this.braneAt(x, y))));
				this.context.strokeStyle = this.colormap.current[Math.min(this.colormapQuantize, amp)];
				this.context.beginPath();
				xy = this.calcView(
				    x * this.interval,
				    (y - 1) * this.interval,
				    this.braneAt(x, y - 1),
				    this.scale,
				    this.viewOffset,
				    this.fieldXYZ);
				this.context.moveTo(xy.x, xy.y);
				xy = this.calcView(
				    x * this.interval,
				    y * this.interval,
				    this.braneAt(x, y),
				    this.scale,
				    this.viewOffset,
				    this.fieldXYZ);
				this.context.lineTo(xy.x, xy.y);
				this.context.stroke();
			}
		}
	}

	drawXYZVector()
	{
		// Show XYZ coordinate
		this.context.lineWidth = 2;
		this.context.beginPath();
		this.context.moveTo(42, 42);
		this.context.strokeStyle = "red";
		this.context.lineTo(42 + 42 * this.fieldXYZ.X.x, 42 + 42 * this.fieldXYZ.X.y);
		let xy = this.calcXYZOnFieldXYZ(-7, -7, 0, this.fieldXYZ);
		this.context.lineTo(42 + 42 * this.fieldXYZ.X.x + xy.x, 42 + 42 * this.fieldXYZ.X.y + xy.y);
		xy = this.calcXYZOnFieldXYZ(-7, 8, 0, this.fieldXYZ);
		this.context.lineTo(42 + 42 * this.fieldXYZ.X.x + xy.x, 42 + 42 * this.fieldXYZ.X.y + xy.y);
		this.context.stroke();
		this.context.beginPath();
		this.context.moveTo(42, 42);
		this.context.strokeStyle = "lime";
		this.context.lineTo(42 + 42 * this.fieldXYZ.Y.x, 42 + 42 * this.fieldXYZ.Y.y);
		xy = this.calcXYZOnFieldXYZ(7, -7, 0, this.fieldXYZ);
		this.context.lineTo(42 + 42 * this.fieldXYZ.Y.x + xy.x, 42 + 42 * this.fieldXYZ.Y.y + xy.y);
		xy = this.calcXYZOnFieldXYZ(-8, -7, 0, this.fieldXYZ);
		this.context.lineTo(42 + 42 * this.fieldXYZ.Y.x + xy.x, 42 + 42 * this.fieldXYZ.Y.y + xy.y);
		this.context.stroke();
		this.context.beginPath();
		this.context.moveTo(42, 42);
		this.context.strokeStyle = "blue";
		this.context.lineTo(42 + 42 * this.fieldXYZ.Z.x, 42 + 42 * this.fieldXYZ.Z.y);
		xy = this.calcXYZOnFieldXYZ(0, 7, -7, this.fieldXYZ);
		this.context.lineTo(42 + 42 * this.fieldXYZ.Z.x + xy.x, 42 + 42 * this.fieldXYZ.Z.y + xy.y);
		xy = this.calcXYZOnFieldXYZ(0, -8, -7, this.fieldXYZ);
		this.context.lineTo(42 + 42 * this.fieldXYZ.Z.x + xy.x, 42 + 42 * this.fieldXYZ.Z.y + xy.y);
		this.context.stroke();
		this.context.lineWidth = 1;
	}

	draw3dObjects()
	{
		for (let i = 0; i < this.listObjects.length; i++) {
			this.draw3dObject(this.listObjects[i]);
		}
	}

	draw3dObject(object)
	{
		let xy;
		this.context.strokeStyle = "white";
		for (let i = 0; i < object.edges.current.length; i++) {
			if (object.edges.current.length > 1 &&
			    object.normalVector[i].x * this.fieldXYZ.X.z + object.normalVector[i].y * this.fieldXYZ.Y.z + object.normalVector[i].z * this.fieldXYZ.Z.z > 0) {;
				continue;
			}
			this.context.beginPath();
			xy = this.calcView(
			    object.edges.current[i][0].x + object.position.x,
			    object.edges.current[i][0].y + object.position.y,
			    object.edges.current[i][0].z + object.position.z,
			    this.scale,
			    this.viewOffset,
			    this.fieldXYZ);
			this.context.moveTo(xy.x, xy.y);
			for (let j = 1; j <= object.edges.current[i].length; j++) {
				xy = this.calcView(
				    object.edges.current[i][j % object.edges.current[i].length].x + object.position.x,
				    object.edges.current[i][j % object.edges.current[i].length].y + object.position.y,
				    object.edges.current[i][j % object.edges.current[i].length].z + object.position.z,
				    this.scale,
				    this.viewOffset,
				    this.fieldXYZ);
				this.context.lineTo(xy.x, xy.y);
			}
			this.context.stroke();
		}
	}

	drawThrottle()
	{
		let throttleSteps = this.boatThrottleMax + Math.floor(this.boatThrottleMax / 2.0) + 1;
		let throttleStepInterval = 5;
		this.context.lineWidth = 2;
		// Write ruler
		this.context.beginPath();
		this.context.moveTo(100, 10);
		this.context.strokeStyle = "white";
		this.context.lineTo(100, 10 + throttleStepInterval * (throttleSteps - 1));
		for (let i = 0; i < throttleSteps; i++) {
			this.context.moveTo(100, 10 + throttleStepInterval * i);
			this.context.lineTo(105, 10 + throttleStepInterval * i);
			if (i == this.boatThrottleMax) {
				this.context.lineTo(110, 10 + throttleStepInterval * i);
			}
		}
		this.context.stroke();
		// Write current throttle
		this.context.strokeStyle = "red";
		this.context.beginPath();
		this.context.moveTo(112, 10 + throttleStepInterval * (this.boatThrottleMax - this.boat.throttle));
		this.context.lineTo(132, 10 + throttleStepInterval * (this.boatThrottleMax - this.boat.throttle));
		this.context.stroke();
		// Reset lineWidth
		this.context.lineWidth = 1;
	}

	make3dObject(objectEdges, position, rolling, velocity, velocityRolling, mass)
	{
		let object = {
			position: {x: position.x, y: position.y, z: position.z},
			rolling: {roll: rolling.roll, pitch: rolling.pitch, yaw: rolling.yaw},
			edges: {origin: new Array(objectEdges.length), current: new Array(objectEdges.length)},
			normalVector: new Array(objectEdges.length),
			velocity: {x: velocity.x, y: velocity.y, z: velocity.z},
			velocityRolling: {roll: velocityRolling.roll, pitch: velocityRolling.pitch, yaw: velocityRolling.yaw},
			mass: mass,
			throttle: 0.0};
		// Compute normal vector
		for (let i = 0; i < objectEdges.length; i++) {
			object.edges.origin[i] = new Array(objectEdges[i].length);
			object.edges.current[i] = new Array(objectEdges[i].length);
			for (let j = 0; j < objectEdges[i].length; j++) {
				object.edges.origin[i][j] = objectEdges[i][j];
				object.edges.current[i][j] = objectEdges[i][j];
			}
			object.normalVector[i] = this.calcNormalVector(objectEdges[i]);
		}
		return object;
	}

	collapseBoat()
	{
		this.collapse3dObject(this.boat);
	}

	collapse3dObject(object)
	{
		let index = this.listObjects.indexOf(object);
		this.listObjects.splice(index, 1);
		for (let i = 0; i < object.edges.origin.length; i++) {
			for (let j = 1; j <= object.edges.origin[i].length; j++) {
				let edge = [object.edges.origin[i][j - 1], object.edges.origin[i][j % object.edges.origin[i].length]];
				let norm = this.normXYZ({x: edge[1].x - edge[0].x, y: edge[1].y - edge[0].y, z: edge[1].z - edge[0].z});
				let newObject = this.make3dObject(
				    [[{x: -norm / 2, y: 0, z: 0}, {x: norm /2, y: 0, z: 0}]],
				    object.position,
				    object.rolling,
				    {x: 100 * (Math.random() - 0.5), y: 100 * (Math.random() - 0.5), z: 100 * Math.random()},
				    {roll: 2.0 * Math.PI * (Math.random() - 0.5), pitch: 2.0 * Math.PI * (Math.random() - 0.5), yaw: 2.0 * Math.PI * (Math.random() - 0.5)},
				    object.mass / object.edges.origin.length);
				this.listObjects.push(newObject);
			}
		}
	}

	calcNormalVector(edges)
	{
		let vector = {x: 0, y: 0, z: 0};
		if (edges.length < 3) {
			return vector;
		}
		let a = {
		    x: edges[2].x - edges[1].x,
		    y: edges[2].y - edges[1].y,
		    z: edges[2].z - edges[1].z};
		let b = {
		    x: edges[0].x - edges[1].x,
		    y: edges[0].y - edges[1].y,
		    z: edges[0].z - edges[1].z};
		vector.x = a.y * b.z - a.z * b.y;
		vector.y = a.z * b.x - a.x * b.z;
		vector.z = a.x * b.y - a.y * b.x;
		let norm = this.normXYZ(vector);
		if (norm > 0.01) {
			vector.x /= norm;
			vector.y /= norm;
			vector.z /= norm;
		}
		return vector;
	}

	calcXYZOnFieldXYZ(x, y, z, fieldXYZ)
	{
		let xy = {x: 0, y: 0};
		xy.x = x * fieldXYZ.X.x + y * fieldXYZ.Y.x + z * fieldXYZ.Z.x;
		xy.y = x * fieldXYZ.X.y + y * fieldXYZ.Y.y + z * fieldXYZ.Z.y;
		return xy;
	}

	calcView(x, y, z, scale, viewOffset, fieldXYZ)
	{
		let xy = {x: 0, y: 0};
		let X = x - this.viewOffset.x;
		let Y = y - this.viewOffset.y;
		let Z = z - this.viewOffset.z;
		xy.x = scale * (X * this.fieldXYZ.X.x + Y * this.fieldXYZ.Y.x + Z * this.fieldXYZ.Z.x) + this.displayOffset.x;
		xy.y = scale * (X * this.fieldXYZ.X.y + Y * this.fieldXYZ.Y.y + Z * this.fieldXYZ.Z.y) + this.displayOffset.y;
		return xy;
	}

	normXYZ(xyz)
	{
		return Math.sqrt(xyz.x * xyz.x + xyz.y * xyz.y + xyz.z * xyz.z);
	}

	innerProductXYZ(A, B)
	{
		return A.x * B.x + A.y * B.y + A.z * B.z;
	}

	normalizeXYZ(XYZ)
	{
		let norm = this.normXYZ(XYZ);
		if (norm > 0.1) {
			XYZ.x /= norm;
			XYZ.y /= norm;
			XYZ.z /= norm;
		}
		return XYZ;
	}

	rotate(XYZ, x, y)
	{
		let ret = {x: 0, y: 0, z: 0};
		ret.x = XYZ.x * Math.cos(x) - XYZ.z * Math.sin(x);
		ret.z = XYZ.z * Math.cos(x) + XYZ.x * Math.sin(x);
		ret.y = XYZ.y * Math.cos(y) - ret.z * Math.sin(y);
		ret.z = ret.z * Math.cos(y) + XYZ.y * Math.sin(y);
		return ret;
	}

	rotXYZ(XYZ, x, y)
	{
		XYZ.X = this.rotate(XYZ.X, x, y);
		XYZ.Y = this.rotate(XYZ.Y, x, y);
		XYZ.Z = this.rotate(XYZ.Z, x, y);
		// Normalize
		XYZ.X = this.normalizeXYZ(XYZ.X);
		XYZ.Y = this.normalizeXYZ(XYZ.Y);
		XYZ.Z = this.normalizeXYZ(XYZ.Z);
		// Reduce residue of Y
		let a = this.innerProductXYZ(XYZ.X, XYZ.Y);
		XYZ.Y.x -= a * XYZ.X.x;
		XYZ.Y.y -= a * XYZ.X.y;
		XYZ.Y.z -= a * XYZ.X.z;
		// Reduce residue of Z
		a = this.innerProductXYZ(XYZ.X, XYZ.Z);
		XYZ.Z.x -= a * XYZ.X.x;
		XYZ.Z.y -= a * XYZ.X.y;
		XYZ.Z.z -= a * XYZ.X.z;
		a = this.innerProductXYZ(XYZ.Y, XYZ.Z);
		XYZ.Z.x -= a * XYZ.Y.x;
		XYZ.Z.y -= a * XYZ.Y.y;
		XYZ.Z.z -= a * XYZ.Y.z;
	}

	rotXYZOnZ(XYZ, yaw, y)
	{
		let X = {x: 0, y: 0, z: 0};
		let Y = {x: 0, y: 0, z: 0};
		X = XYZ.X;
		Y = XYZ.Y;
		let cos = Math.cos(yaw);
		let sin = Math.sin(yaw);
		if (XYZ.Z.y < 0.0) {
			XYZ.X.x = X.x * cos + Y.x * sin;
			XYZ.X.y = X.y * cos + Y.y * sin;
			XYZ.X.z = X.z * cos + Y.z * sin;
			XYZ.Y.x = Y.x * cos - X.x * sin;
			XYZ.Y.y = Y.y * cos - X.y * sin;
			XYZ.Y.z = Y.z * cos - X.z * sin;
		} else {
			XYZ.X.x = X.x * cos - Y.x * sin;
			XYZ.X.y = X.y * cos - Y.y * sin;
			XYZ.X.z = X.z * cos - Y.z * sin;
			XYZ.Y.x = Y.x * cos + X.x * sin;
			XYZ.Y.y = Y.y * cos + X.y * sin;
			XYZ.Y.z = Y.z * cos + X.z * sin;
		}
		// normalize
		let norm = this.normXYZ(XYZ.X);
		if (norm > 0.1) {
			XYZ.X.x /= norm;
			XYZ.X.y /= norm;
			XYZ.X.z /= norm;
		}
		// rot with drag on Y axis same as normal rotation
		this.rotXYZ(XYZ, 0, y);
	}

	rotate3d(XYZ, rolling)
	{
		let di_r = {x: 0, y: 0, z: 0};
		let di_p = {x: 0, y: 0, z: 0};
		let di_y = {x: 0, y: 0, z: 0};
		let di_py = {x: 0, y: 0, z: 0};
		let di = {x: 0, y: 0, z: 0};
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

	rotate3dObject(object)
	{
		for (let i = 0; i < object.edges.origin.length; i++) {
			for (let j = 0; j < object.edges.origin[i].length; j++) {
				object.edges.current[i][j] = this.rotate3d( 
				    object.edges.origin[i][j],
				    object.rolling);
			}
			object.normalVector[i] = this.calcNormalVector(object.edges.current[i]);
		}
	}

	mouseClick(event)
	{
		event.preventDefault();
		if (event.type === "mousedown") {
			this.prev_clientX = event.clientX;
			this.prev_clientY = event.clientY;
		} else if (event.type === "touchstart") {
			this.prev_clientX = event.touches[0].clientX;
			this.prev_clientY = event.touches[0].clientY;
		}
	}

	mouseMove(event)
	{
		event.preventDefault();
		if (event.type === "mousemove") {
			if ((event.buttons & 1) != 0) {
				this.rotXYZOnZ(this.fieldXYZ,
				    2.0 * Math.PI * (event.clientX - this.prev_clientX) / this.rotDegree,
				    2.0 * Math.PI * (event.clientY - this.prev_clientY) / this.rotDegree);
			} else if ((event.buttons & 4) != 0) {
				let move = {x: 0, y: 0}
				move.x = event.clientX - this.prev_clientX;
				move.y = event.clientY - this.prev_clientY;
				this.viewOffset.x -= move.x * this.fieldXYZ.X.x + move.y * this.fieldXYZ.X.y;
				this.viewOffset.y -= move.x * this.fieldXYZ.Y.x + move.y * this.fieldXYZ.Y.y;
				this.viewOffset.z -= move.x * this.fieldXYZ.Z.x + move.y * this.fieldXYZ.Z.y;
			}
			this.prev_clientX = event.clientX;
			this.prev_clientY = event.clientY;
		} else if (event.type === "touchmove") {
			if (event.touches.length == 1) {
				this.rotXYZOnZ(this.fieldXYZ,
				    2.0 * Math.PI * (event.touches[0].clientX - this.prev_clientX) / this.rotDegree,
				    2.0 * Math.PI * (event.touches[0].clientY - this.prev_clientY) / this.rotDegree);
			} else if (event.touches.length == 2) {
				let move = {x: 0, y: 0}
				move.x = event.touches[0].clientX - this.prev_clientX;
				move.y = event.touches[0].clientY - this.prev_clientY;
				this.viewOffset.x -= move.x * this.fieldXYZ.X.x + move.y * this.fieldXYZ.X.y;
				this.viewOffset.y -= move.x * this.fieldXYZ.Y.x + move.y * this.fieldXYZ.Y.y;
				this.viewOffset.z -= move.x * this.fieldXYZ.Z.x + move.y * this.fieldXYZ.Z.y;
			}
			this.prev_clientX = event.touches[0].clientX;
			this.prev_clientY = event.touches[0].clientY;
		}
	}

	keyDown(event)
	{
		event.preventDefault();
		switch (event.key) {
			case "ArrowUp":
				if (this.boat.throttle < this.boatThrottleMax) {
					this.boat.throttle++;
				}
				break;
			case "ArrowDown":
				if (this.boat.throttle > -Math.floor(this.boatThrottleMax / 2.0)) {
					this.boat.throttle--;
				}
				break;
			case "ArrowLeft":
				this.boat.velocityRolling.yaw += Math.PI * 0.5 / 180.0;
				break;
			case "ArrowRight":
				this.boat.velocityRolling.yaw -= Math.PI * 0.5 / 180.0;
				break;
		}
	}
}

