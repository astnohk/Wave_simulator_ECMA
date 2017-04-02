// The code written in BSD/KNF indent style
"use strict";


// ----- Class -----
function
GlobalEventClass()
{
	this.event_functions = new Array();
	var that = this;
	this.add =
	    function
	    (event_func)
	    {
		    that.event_functions.push(event_func);
	    };
	this.doEvent =
	    function
	    (event)
	    {
		    for (var i = 0; i < that.event_functions.length; i++) {
			    that.event_functions[i](event);
		    }
	    };
}
// ----------




var WindowZIndexOffset = 100;
// Time
var time;
// User ID
var userId = "you";
var onetimepass = "";
// Background color list
var listBackground = {
    change: {name: "Change in Time", color: "rgb(0, 0, 0)"},
    morning: {name: "Morning", color: "rgb(110, 230, 233)"},
    daytime: {name: "Daytime", color: "rgb(93, 198, 255)"},
    dusk: {name: "Dusk", color: "rgb(247, 207, 110)"},
    night: {name: "Night", color: "rgb(10, 10, 0)"},
    red: {name: "Red", color: "rgb(64, 0, 0)"},
    green: {name: "Green", color: "rgb(0, 64, 0)"},
    blue: {name: "Blue", color: "rgb(0, 0, 128)"},
    black: {name: "Black", color: "rgb(0, 0, 0)"}};
// Settings
var UserSettings = {BackgroundColor: "black"};
// Window list
var WindowList = new Array();

//Initialize
window.addEventListener("load", initECMASystem6, false);



// ----- GLOBAL CLICK EVENTS -----
var globalClickEvent = new GlobalEventClass();

var globalMouseMoveEvent = new GlobalEventClass();
globalMouseMoveEvent.add(dragWindow);

var globalMouseUpEvent = new GlobalEventClass();
globalMouseUpEvent.add(dragWindow);



// ----- INITIALIZE -----
function
initECMASystem6()
{
	var timeClock = setInterval(updateTimeAndBackground, 1000);
	// Add Window Scroller
	appendWindowScroller();
	// Event Listener for mouse click or touch
	window.addEventListener("mousedown", globalClickEvent.doEvent, false);
	window.addEventListener("touchstart", globalClickEvent.doEvent, false);
	window.addEventListener("mousemove", globalMouseMoveEvent.doEvent, false);
	window.addEventListener("touchmove", globalMouseMoveEvent.doEvent, false);
	window.addEventListener("mouseup", globalMouseUpEvent.doEvent, false);
	window.addEventListener("touchend", globalMouseUpEvent.doEvent, false);
}



// ----- REALTIME -----
function
updateTimeAndBackground()
{
	time = new Date();
	// Change background color
	changeBackgroundColor();
}



// Check member checkboxes
// if the checkbox has been clicked
// or the dragging mouse pointer pass over the checkbox
function
dragSelector(event)
{
	if (event.type === "mouseenter" && event.buttons === 0) {
		return; // Avoid selecting without button press
	}
	// Get event target
	var target = event.target;
	if (event.type === "touchmove") {
		target = document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY);
	}
	var element = null;
	if (event.target.tagName === "SPAN") {
		element = target;
	} else if (target.parentNode.tagName === "SPAN") {
		element = target.parentNode;
	} else {
		return;
	}
	if (element.hasChildNodes()) {
		var children = element.childNodes;
		for (var i = 0; i < children.length; i++) {
			if (children[i].tagName === "INPUT") {
				if (firstChecked === 0) {
					firstChecked = children[i].checked === false ? 1 : 2;
				}
				children[i].checked = firstChecked == 1 ? true : false;
				break;
			}
		}
	}
	displayNoteForm(); // Show or Hide the form for writing notes
	updateNotesDisplay(); // Update display of Notes
}



// ----- SETTINGS -----
function
openSettings()
{
	var settingsMenu = document.getElementById("MySettingsMenu");
	if (document.getElementById("MySettingsMenu") !== null) {
		settingsMenu.remove();
	} else {
		// Open menu
		settingsMenu = document.createElement("div");
		settingsMenu.id = "MySettingsMenu";
		document.querySelector("#UpperRightMenu div.MenuDropdown").appendChild(settingsMenu);
		// Make menu
		var changeBackground = document.createElement("div");
		changeBackground.className = "classMySettingsMenu";
		changeBackground.innerHTML = "Change Background";
		changeBackground.addEventListener("click", openChangeBackground, false);
		settingsMenu.appendChild(changeBackground);
	}
}

function
openChangeBackground()
{
	if (document.getElementById("changeBackground") !== null) {
		return;
	}
	var win = createWindow({id: "changeBackground", title: "Change Background Color"});
	win.style.left = "30%";
	win.style.top = "30%";
	win.style.width = "600px";
	document.body.appendChild(win);
	var board = document.createElement("div");
	board.className = "BlackBoard";
	win.appendChild(board);
	var box_main = document.createElement("div");
	box_main.className = "upperBox";
	box_main.style.display = "flex";
	box_main.style.flexWrap = "wrap";
	box_main.style.justifyContent = "space-around";
	board.appendChild(box_main);
	var box_button = document.createElement("div");
	box_button.className = "buttonBox";
	box_button.style.display = "flex";
	box_button.style.justifyContent = "flex_start";
	box_button.style.marginTop = "16px";
	board.appendChild(box_button);
	// Create background list
	var keys = Object.keys(listBackground);
	var boxSize = 100;
	var backgroundChanger =
	    function (evnt) {
		    UserSettings.BackgroundColor = evnt.target.id.slice(14);
		    changeBackgroundColor();
		    // Reset outline color
		    var units = document.querySelectorAll("#changeBackground div.BlackBoard div.upperBox span");
		    for (var i = 0; i < units.length; i++) {
			    units[i].style.outlineColor = "rgba(240, 240, 240, 0.8)";
		    }
		    // Set outline color of selected box
		    evnt.target.style.outlineColor = "rgba(255, 40, 40, 0.8)";
	    };
	for (var i = 0; i < keys.length; i++) {
		var colorId = keys[i];
		var color = listBackground[keys[i]].color;
		var unit = document.createElement("span");
		unit.id = "listBackground" + colorId;
		unit.style.display = "flex";
		unit.style.justifyContent = "center";
		unit.style.alignItems = "center";
		unit.style.margin = "8px";
		unit.style.height = String(boxSize) + "px";
		unit.style.width = String(boxSize) + "px";
		unit.style.color = negateColor(color);
		unit.style.backgroundColor = color;
		unit.style.outlineStyle = "solid";
		unit.style.outlineWidth = "4px";
		if (UserSettings.BackgroundColor == keys[i]) {
			unit.style.outlineColor = "rgba(255, 40, 40, 0.8)";
		} else {
			unit.style.outlineColor = "rgba(240, 240, 240, 0.8)";
		}
		unit.style.cursor = "pointer";
		unit.innerHTML = listBackground[colorId].name;
		unit.addEventListener("click", backgroundChanger, false);
		box_main.appendChild(unit);
	}
	// Add save button
	var save = document.createElement("input");
	save.type = "button";
	save.id = "saveChangeBackground";
	save.value = "Save";
	save.style.margin = "4px";
	save.addEventListener(
	    "click",
	    function () {
		    //saveSettings(); // It needs CGI to work
		    win.closeWindow();
	    },
	    false);
	box_button.appendChild(save);
}

function
changeBackgroundColor()
{
	// Set background color
	if (UserSettings.BackgroundColor === "change") {
		if (time.getMonth() <= 3 || 10 <= time.getMonth()) {
			if (time.getHours() < 6 || 18 <= time.getHours()) {
				document.body.style.background = "rgba(10, 10, 0, 1.0)";
			} else if (time.getHours() < 7 || 17 <= time.getHours()) {
				document.body.style.background = "rgba(247, 207, 110, 1.0)";
			} else if (time.getHours() < 8 || 16 <= time.getHours()) {
				document.body.style.background = "rgba(110, 230, 233, 1.0)";
			} else {
				document.body.style.background = "rgba(93, 198, 255, 1.0)";
			}
		} else {
			if (time.getHours() < 4 || 19 <= time.getHours()) {
				document.body.style.background = "rgba(10, 10, 0, 1.0)";
			} else if (time.getHours() < 5 || 18 <= time.getHours()) {
				document.body.style.background = "rgba(247, 207, 110, 1.0)";
			} else if (time.getHours() < 6 || 17 <= time.getHours()) {
				document.body.style.background = "rgba(110, 230, 233, 1.0)";
			} else {
				document.body.style.background = "rgba(93, 198, 255, 1.0)";
			}
		}
	} else {
		document.body.style.background = listBackground[UserSettings.BackgroundColor].color;
	}
}

function
saveSettings()
{
	var request = new XMLHttpRequest();
	request.open("POST", "cgi-bin/saveSettings.cgi", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.onreadystatechange = function () {
		if (request.readyState == 4) {
			if (request.status == 200) {
				console.log(request.responseText);
				if (request.responseText.indexOf("Error:") >= 0) {
					console.log("Error: Wrong ID or one-time password");
				}
				console.log("settings saved successfully");
			} else {
				console.log("Error: Failed to request");
			}
		}
	    };
	var query = "id=" + encrypt(userId) +
	    "&onetimepass=" + encrypt(onetimepass) +
	    "&settings=" + encrypt(JSON.stringify(UserSettings));
	request.send(query);
}

function
loadSettings()
{
	var request = new XMLHttpRequest();
	request.open("POST", "cgi-bin/loadSettings.cgi", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.onreadystatechange = function () {
		if (request.readyState == 4) {
			if (request.status == 200) {
				if (request.responseText.indexOf("Error:") >= 0) {
					console.log("Error: Wrong ID or one-time password");
				}
				var tmp = JSON.parse(decrypt(request.responseText));
				Object.assign(UserSettings, tmp);
				console.log("settings loaded successfully");
			} else {
				console.log("Error: Failed to request");
			}
		}
	    };
	var query = "id=" + encrypt(userId) +
	    "&onetimepass=" + encrypt(onetimepass) +
	    "&pubkey=" + cryptToClient.getPublicKey();
	request.send(query);
}




// ---------- LIBRARIES ----------
function
parseUnicodeInt(str, base)
{
	if (typeof base === "undefined") {
		var base = 10;
	}
	if (str.search(/[０-９]/) >= 0) {
		var list = ["０", "１", "２", "３", "４", "５", "６", "７", "８", "９"];
		for (var i = 0; i < 10; i++) {
			var regex = new RegExp(list[i], "g");
			str = str.replace(regex, String(i));
		}
	}
	return parseInt(str, base);
}

// ----- Base64 -----
// If you encode Unicode strings then use the functions below.
// These functions avoid problems when using Unicode strings.
// These functions idea from Johan Sundstrom.
function
enBase64(str)
{
	if (typeof str === "undefined") {
		return "";
	}
	return window.btoa(unescape(encodeURIComponent(str)));
}

function
deBase64(str)
{
	if (typeof str === "undefined") {
		return "";
	}
	return decodeURIComponent(escape(window.atob(str)));
}

// negate color in rgb(d, d, d) or rgba(d, d, d, f) style
function
negateColor(color)
{
	var output;
	if (color.indexOf("rgba") >= 0) {
		output = "rgba(";
	} else {
		output = "rgb(";
	}
	var strings = color.substr(color.indexOf("(") + 1).split(',');
	for (var i = 0; i < 3; i++) {
		var intensity = parseInt(strings[i], 10);
		output += (i > 0 ? ", " : "") + String(255 - intensity);
	}
	if (color.indexOf("rgba") >= 0) {
		var alpha = parseFloat(strings[3]);
		output += ", " + String(alpha) + ")";
	} else {
		output += ")";
	}
	return output;
}




// ----- WINDOWS -----
function
makeFunctionButton(className, innerHTML, onClickFunction)
{
	var box = document.createElement("span");
	box.className = className;
	box.innerHTML = innerHTML;
	box.addEventListener("click", onClickFunction, false);
	box.addEventListener("touchstart", onClickFunction, false);
	return box;
}

function
createWindow(parameter)
{
	var timeDuration = 300;
	var win = document.createElement("div");
	win.opening = true;
	// Check whether parameter is defined or not
	var parameterDefined = true;
	if (typeof parameter === "undefined") {
		parameterDefined = false;
	}
	// Set class
	win.className = "classWindow";
	win.windowClassName = "classWindow";
	win.dialog = false;
	win.style.top = String(100 + Math.min(WindowList.length * 10, 200)) + "px";
	win.style.left = String(40 + Math.min(WindowList.length * 10, 200)) + "px";
	if (parameterDefined && "type" in parameter) {
		if (parameter.type === "dialog") {
			win.dialog = true;
			win.style.borderBottomLeftRadius = "16px";
		}
	}
	if (parameterDefined) {
		// Set ID
		if ("id" in parameter) {
			win.id = parameter.id;
		}
		// Style
		if ("style" in parameter) {
			Object.assign(win.style, parameter.style);
		}
		// Title
		if ("title" in parameter && win.dialog === false) {
			// Add title
			var title = document.createElement("span");
			title.className = "classWindowTitle";
			title.innerHTML = parameter.title;
			title.addEventListener("mousedown", dragWindow, false);
			title.addEventListener("touchstart", dragWindow, false);
			win.appendChild(title);
			win.windowTitle = parameter.title;
		}
	}
	// Add window close function to HTML Element
	win.closing = false;
	if (parameterDefined && "closeFunction" in parameter) {
		win.closeFunctionUserDefined = parameter.closeFunction;
	} else {
		win.closeFunctionUserDefined = function () {};
	}
	win.closeWindow = function ()
	    {
		    if (win.parentNode === null ||// The Node has been created but not added to DOM tree
			win.opening || win.closing) {
			    return;
		    }
		    win.closing = true;
		    win.style.transitionProperty = "opacity";
		    win.style.transitionDuration = String(timeDuration) + "ms";
		    win.style.transitionTimingFunction = "linear";
		    win.style.opacity = 0;
		    var timeout = setTimeout(function ()
			{
				win.closeFunctionUserDefined();
				win.remove();
				spliceWindowList(win); // Remove window from WindowList
			},
			timeDuration);
	    };
	if (!(parameterDefined && "noCloseButton" in parameter)) {
		// Append Close button
		var closeBox = makeFunctionButton(
		    "classButton",
		    "Close",
		    win.closeWindow);
		closeBox.style.position = "absolute";
		closeBox.style.right = "30px";
		closeBox.style.bottom = "0px";
		win.appendChild(closeBox);
	}
	win.addEventListener("mousedown", dragWindow, false);
	win.addEventListener("touchstart", dragWindow, false);
	// Add new window to WindowList
	if (WindowList.length > 0) {
		win.style.zIndex = String(parseInt(WindowList[WindowList.length - 1].style.zIndex, 10) + 1);
	} else {
		win.style.zIndex = String(WindowZIndexOffset);
	}
	WindowList.push(win);
	// Add slider for resizing
	var resize = document.createElement("div");
	resize.className = "classWindowResizer";
	win.appendChild(resize);
	// Finish opening process
	win.opening = false;
	return win;
}

function createDraggableElement(elementName)
{
	var element = document.createElement(elementName);
	element.windowClassName = "classDraggableElement";
	element.addEventListener("mousedown", dragWindow, false);
	element.addEventListener("touchstart", dragWindow, false);
	return element;
}

function raiseWindowList(target)
{
	var index = WindowList.indexOf(target);
	WindowList.splice(index, 1);
	WindowList.push(target);
	for (var i = 0; i < WindowList.length; i++) {
		WindowList[i].style.zIndex = String(WindowZIndexOffset + i);
	}
}

function lowerWindowList(target)
{
	var index = WindowList.indexOf(target);
	WindowList.splice(index, 1);
	WindowList.unshift(target);
	for (var i = 0; i < WindowList.length; i++) {
		WindowList[i].style.zIndex = String(WindowZIndexOffset + i);
	}
}

function spliceWindowList(target)
{
	var index = WindowList.indexOf(target);
	WindowList.splice(index, 1);
	for (var i = 0; i < WindowList.length; i++) {
		WindowList[i].zIndex = String(WindowZIndexOffset + i);
	}
}

/*
    Drag or resize the window.
    If the event target is window border then resize the window.
*/
var draggingWindow = null;
var resizingWindow = false;
var draggingWindowOffset = {x: 0, y: 0};
function
dragWindow(event)
{
	// Get window object
	var clientX = 0;
	var clientY = 0;
	if (event.type === "touchstart" || event.type === "touchmove" || event.type === "touchup") {
		clientX = event.touches[0].clientX; // Use first touch event
		clientY = event.touches[0].clientY;
	} else {
		clientX = event.clientX;
		clientY = event.clientY;
	}
	var win = null;
	if (event.type === "mousedown" || event.type === "touchstart") {
		// Raise selected window to frontmost
		if (event.currentTarget.windowClassName === "classWindow") {
			raiseWindowList(event.currentTarget);
		}
		if (event.target.windowClassName === "classWindow" || event.target.windowClassName === "classDraggableElement") {
			win = event.target;
		} else if (event.target.className === "classWindowResizer") {
			resizingWindow = true;
			win = event.target.parentNode;
		} else if (event.target.className === "classWindowTitle") {
			win = event.target.parentNode;
		} else {
			// Start drag only the event fired on window itself
			return;
		}
		draggingWindow = win;
		var rect = win.getBoundingClientRect();
		draggingWindowOffset.x = clientX - rect.left;
		draggingWindowOffset.y = clientY - rect.top;
		// Transparent
		win.style.opacity = "0.8";
		return;
	} else if (draggingWindow === null || resizingWindow === null) {
		return;
	} else if (event.type === "mouseup" || event.type === "touchend") {
		draggingWindow.style.opacity = "1.0";
		draggingWindowOffset = {x: 0, y: 0};
		draggingWindow = null;
		resizingWindow = false;
		return;
	}
	event.preventDefault();
	//event.stopPropagation(); // Prevent to propagate the event to parent node
	// Get mouse position
	if (resizingWindow) { // Resize the window
		var style = window.getComputedStyle(draggingWindow, "");
		var rect = draggingWindow.getBoundingClientRect();
		var x = clientX - rect.left -
		    parseInt(style.borderLeftWidth, 10) - parseInt(style.borderRightWidth, 10) -
		    parseInt(style.paddingRight, 10) - 7;
		var y = clientY - rect.top -
		    parseInt(style.borderTopWidth, 10) - parseInt(style.borderBottomWidth, 10) -
		    parseInt(style.paddingBottom, 10) - 7;
		draggingWindow.style.width = String(x) + "px";
		draggingWindow.style.height = String(y) + "px";
	} else { // Drag the window
		var parentNode = draggingWindow.parentNode;
		var parentRect = parentNode.getBoundingClientRect();
		var x = 0;
		var y = 0;
		if (parentNode.nodeName === "BODY") {
			// If the parent is BODY then the amount of scroll should be neglected
			// because document.body.scrollTop == window.scrollY
			x = clientX - draggingWindowOffset.x - parentRect.left;
			y = clientY - draggingWindowOffset.y - parentRect.top;
		} else {
			x = clientX - draggingWindowOffset.x - parentRect.left + parentNode.scrollLeft;
			y = clientY - draggingWindowOffset.y - parentRect.top + parentNode.scrollTop;
		}
		// Move the window
		draggingWindow.style.left = String(x) + "px";
		draggingWindow.style.top = String(y) + "px";
	}
}

function
appendWindowScroller()
{
	var windowScroller = document.createElement("div");
	windowScroller.className = "classWindowScroller";
	windowScroller.id = "WindowScroller";
	windowScroller.opening = false;
	document.body.appendChild(windowScroller);
	var raiseClickedTitle = function (event)
	    {
		    windowScroller.insertBefore(event.currentTarget, null);
		    for (var i = 0; i < WindowList.length; i++) {
			    if (WindowList[i].windowTitle === event.currentTarget.innerHTML) {
				    raiseWindowList(WindowList[i]);
				    break;
			    }
		    }
	    };
	var openScroller = function ()
	    {
		    if (windowScroller.opening) {
			    // Already opened
			    return;
		    }
		    windowScroller.opening = true;
		    windowScroller.style.width = "100px";
		    for (var i = 0; i < WindowList.length; i++) {
			    var box = document.createElement("div");
			    box.className = "classWindowTitle";
			    box.style.position = "relative";
			    box.style.marginTop = "6px";
			    box.style.transitionProperty = "top";
			    box.style.transitionDuration = "0.2s";
			    box.style.transitionTimingFunction = "linear";
			    box.innerHTML = WindowList[i].windowTitle;
			    box.addEventListener("click", raiseClickedTitle, false);
			    windowScroller.appendChild(box);
		    }
	    };
	var closeScroller = function ()
	    {
		    if (windowScroller.opening) {
			    windowScroller.style.width = "18px";
			    windowScroller.innerHTML = "";
			    windowScroller.opening = false;
		    }
	    };
	windowScroller.addEventListener("mouseenter", openScroller, false);
	windowScroller.addEventListener("mouseleave", closeScroller, false);
	windowScroller.addEventListener("touchstart", openScroller, false);
	windowScroller.addEventListener("touchstart", closeScroller, false);
	windowScroller.addEventListener(
	    "wheel",
	    function (event) {
		    if (event.deltaY > 0) {
			    raiseWindowList(WindowList[0]);
			    windowScroller.insertBefore(windowScroller.children[0], null);
		    } else {
			    windowScroller.insertBefore(
				windowScroller.children[windowScroller.children.length - 1],
				windowScroller.children[0]);
			    lowerWindowList(WindowList[WindowList.length - 1]);
		    }
	    },
	    false);
	return;
}

function
errorWindow(message)
{
	var errorWin = document.getElementById("errorWindow");
	if (errorWin === null) {
		errorWin = createWindow({id: "errorWindow", style: {position: "absolute", top: "30%", left: "30%", color: "rgb(255, 50, 50)", backgroundColor: "rgba(255, 0, 0, 0.8)"}});
		document.body.appendChild(errorWin);
	}
	var content = document.querySelector("#errorWindow div.BlackBoard"); // get <div className="BlackBoard"> within a <tags id="errorWindow">
	if (content === null) {
		content = document.createElement("div");
		errorWin.appendChild(content);
	}
	content.className = "BlackBoard";
	content.innerHTML = message;
}




// ----- Encryption -----

function
initEncryptionToServer()
{
	var request = new XMLHttpRequest();
	request.open("POST", "cgi-bin/loadKey.cgi", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.onreadystatechange = function () {
		if (request.readyState == 4 && request.status == 200) {
			cryptToServer.setKey(request.responseText);
		}
	    };
	request.send("load=" + RSA_key_length);
}

function
initEncryptionToClient()
{
	cryptToClient.getKey();
}

function
encrypt(text)
{
	// encrypt with server's public key
	if (typeof text === "undefined" || text.length < 1) {
		return "";
	}
	var text_encoded = encodeURIComponent(text);
	var encrypted = "";
	var i = 0;
	for (i = 0; i < Math.ceil(text_encoded.length / maxEncryptLength); i++) {
		encrypted += cryptToServer.encrypt(text_encoded.slice(maxEncryptLength * i, Math.min(maxEncryptLength * (i + 1), text_encoded.length))) + "|";
	}
	return encrypted.slice(0, -1);
}

function
decrypt(text)
{
	// decrypt with client generated private key
	if (typeof text === "undefined" || text.length < 1) {
		return "";
	}
	var encrypted = text.split("|");
	var decrypted = "";
	var i = 0;
	for (i = 0; i < encrypted.length; i++) {
		if (encrypted[i].length < 1) {
			continue;
		}
		decrypted += cryptToClient.decrypt(encrypted[i]);
	}
	return decodeURIComponent(decrypted);
}

