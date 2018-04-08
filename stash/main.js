window.addEventListener("load", initSystem, false);

var SystemRoot;
var WaveSimulatorWindow;
var WaveSimulatorApplication;

function
initSystem()
{
	SystemRoot = new ECMASystem(document.body);

	WaveSimulatorWindow = SystemRoot.createWindow({id: "WaveSimulator", noCloseButton: null});
	WaveSimulatorWindow.ECMASystemWindowFixed = true;
	WaveSimulatorWindow.style.position = "absolute";
	WaveSimulatorWindow.style.top = "0px";
	WaveSimulatorWindow.style.left = "0px";
	WaveSimulatorWindow.style.width = "100%";
	WaveSimulatorWindow.style.height = "100%";
	WaveSimulatorWindow.style.padding = "0";
	WaveSimulatorWindow.style.outline = "0";
	WaveSimulatorWindow.style.border = "0";
	WaveSimulatorWindow.style.backgroundColor = "rgba(20, 20, 20, 0.5)";
	document.body.appendChild(WaveSimulatorWindow);
	SystemRoot.windowScroller.style.display = "none";

	WaveSimulatorApplication = new WaveSimulator(SystemRoot, WaveSimulatorWindow);
}

