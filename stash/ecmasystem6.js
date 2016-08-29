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

