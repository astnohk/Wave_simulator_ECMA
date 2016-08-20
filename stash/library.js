// ----- LIBRARY -----
var WindowZIndexOffset = 100;



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
				win.parentNode.removeChild(win);
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
		if (event.currentTarget.className === "classWindow") {
			raiseWindowList(event.currentTarget);
		}
		if (event.target.className === "classWindow") {
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


// ----- Base64 -----
// If you encode Unicode string then use the function below.
// These function avoid the problems because of the Unicode string.
// The function idea from Johan Sundstrom.

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

