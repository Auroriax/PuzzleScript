// The client ID of a GitHub OAuth app registered at https://github.com/settings/developers.
// The “callback URL” of that app points to https://www.puzzlescript.net/auth.html.
// If you’re running from another host name, sharing might not work.

maximumsavedprojects = 50;

function solveClick() {
	if (confirm("Use the solver? It can be slow & crash on big levels, so please save beforehand. Doesn't work for mouse controlled games.")) {
		solve();
	}
}

function runClick() {
	clearConsole();
	compile(["restart"]);
}

repopulateSaveDropdown();
var loadDropdown = document.getElementById('loadDropDown');
loadDropdown.selectedIndex=0;

function levelEditorClick_Fn() {
	if (textMode || state.levels.length===0) {
		compile(["loadLevel",0]);
		levelEditorOpened=true;
    	canvasResize();
	} else {
		levelEditorOpened=!levelEditorOpened;
    	canvasResize();
    }
    lastDownTarget=canvas;	
}

function printUnauthorized(){

	var authUrl = getAuthURL();
	consolePrint(
			"<br>" +
			"PuzzleScript needs permission to share games through GitHub:<br>" +
			"<ul>" +
			"<li><a target=\"_blank\" href=\"" + authUrl + "\">Give PuzzleScript permission</a></li>" +
			"</ul>",true);
}

function cancelClick() {
	stopSolving();
}

function runClick()
{
	clearConsole();
	compile(["restart"]);
}

function dateToReadable(title, time)
{
	var year = time.getFullYear();
	var month = time.getMonth()+1;
	var date1 = time.getDate();
	var hour = time.getHours();
	var minutes = time.getMinutes();
	var seconds = time.getSeconds();

	if (month < 10) {
    	month = "0"+month;
	}
	if (date1 < 10) {
		date1 = "0"+date1;
	}
	if (hour < 10) {
		hour = "0"+hour;
	}
	if (minutes < 10) {
		minutes = "0"+minutes;
	}
	if (seconds < 10) {
		seconds = "0"+seconds;
	}

	var result = hour+":"+minutes+" "+year + "-" + month+"-"+date1+" "+title;
	return result;
}

function saveClick() {

	var title = "Untitled";
	if (state.metadata.title!==undefined) {
		title=state.metadata.title;
	}
	var text=editor.getValue();
	var saveDat = {
		title:title,
		text:text,
		date: new Date()
	}

	var curSaveArray = [];
	if (storage_has('saves')) {
		var curSaveArray = JSON.parse(storage_get('saves'));
	}

	if (curSaveArray.length>maximumsavedprojects) {
		curSaveArray.splice(0,1);
	}
	curSaveArray.push(saveDat);


	var savesDatStr = JSON.stringify(curSaveArray);
	try {
	storage_set('saves',savesDatStr);
	}
	catch (e) {
		console.log(e);
		consoleError("Was not able to save the project. This likely has something to do with your cookie settings or, if you've already saved some projects, with local storage size limits.")
		return;
	}

	repopulateSaveDropdown(curSaveArray);

	var loadDropdown = document.getElementById('loadDropDown');
	loadDropdown.selectedIndex=0;

	setEditorClean();

	var escapeHTMLTitle = title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	consolePrint("saved file '"+escapeHTMLTitle+"' to local storage",true);
	if (window.location.href.indexOf("?hack")>=0){
		var currURL= window.location.href; 
		var afterDomain= currURL.substring(currURL.lastIndexOf('/') + 1);
		var beforeQueryString= afterDomain.split("?")[0];  
 
		window.history.pushState({}, document.title, "./" +beforeQueryString);
	}
	//clear parameters from url bar if any present
	if (curSaveArray.length===maximumsavedprojects){
		consolePrint("WARNING: your <i>locally saved file list</i> has reached its maximum capacity of "+maximumsavedprojects+" files - older saved files will be deleted when you save in future.",true);
	}
}

window.addEventListener( "pageshow", function ( event ) {
	var historyTraversal = event.persisted || 
						   ( typeof window.performance != "undefined" && 
								window.performance.navigation.type === 2 );
	if ( historyTraversal ) {
	  // Handle page restore.
	  window.location.reload();
	}
  });

window.addEventListener("popstate", function(event){
	console.log("hey");
	location.reload();
});

function loadDropDownChange() {

	if(!canExit()) {
 		this.selectedIndex = 0;
 		return;
 	}

	var saveString = storage_get('saves');
	if (saveString === null) {
			consolePrint("Eek, trying to load a file, but there's no local storage found. Eek!",true);
	} 

	saves = JSON.parse(saveString);
	
	for (var i=0;i<saves.length;i++) {
		var sd = saves[i];
	    var key = dateToReadable(sd.title,new Date(sd.date));
	    if (key==this.value) {

	    	var saveText = sd.text;
			editor.setValue(saveText);
			clearConsole();
			setEditorClean();
			var loadDropdown = document.getElementById('loadDropDown');
			loadDropdown.selectedIndex=0;
			unloadGame();
			compile(["restart"]);
			return;
	    }
	}		

	consolePrint("Eek, trying to load a save, but couldn't find it. :(",true);
}


function repopulateSaveDropdown(saves) {
	var loadDropdown = document.getElementById('loadDropDown');
	loadDropdown.options.length = 0;

	if (saves===undefined) {
		try {
			if (!storage_has('saves')) {
				return;
			} else {
				saves = JSON.parse(storage_get("saves"));
			}
		} catch (ex) {
			return;
		}
	}

    var optn = document.createElement("OPTION");
    optn.text = "Load";
    optn.value = "Load";
    loadDropdown.options.add(optn);  

	for (var i=saves.length-1;i>=0;i--) {			
		var sd = saves[i];
	    var optn = document.createElement("OPTION");
	    var key = dateToReadable(sd.title,new Date(sd.date));
	    optn.text = key;
	    optn.value = key;
	    loadDropdown.options.add(optn);  
	}
	loadDropdown.selectedIndex=0;
}

repopulateSaveDropdown();
var loadDropdown = document.getElementById('loadDropDown');
loadDropdown.selectedIndex=0;

function levelEditorClick_Fn() {
	if (textMode || state.levels.length===0) {
		compile(["loadLevel",0]);
		levelEditorOpened=true;
    	canvasResize();
	} else {
		levelEditorOpened=!levelEditorOpened;
    	canvasResize();
    }
    lastDownTarget=canvas;	
}

// const HOSTPAGEURL = "http://www.puzzlescript.net"
// const PSFORKNAME = "PuzzleScript"
const HOSTPAGEURL = "https://auroriax.github.io/PuzzleScript"
const PSFORKNAME = "Puzzlescript Plus"

/* I don't want to setup the required server for an OAuth App, so for now we will use a slightly more complex method for the user, which is to create a personal identification token. */
// OAUTH_CLIENT_ID = "211570277eb588cddf44";
function getAuthURL()
{
	return HOSTPAGEURL+'/auth_pat.html';
	// const randomState = window.btoa(Array.prototype.map.call(
	// 	window.crypto.getRandomValues(new Uint8Array(24)),
	// 	function(x) { return String.fromCharCode(x); }).join(""));

	// return "https://github.com/login/oauth/authorize"
	// 	+ "?client_id=" + OAUTH_CLIENT_ID
	// 	+ "&scope=gist"
	// 	+ "&state=" + randomState
	// 	+ "&allow_signup=true";
}

function printUnauthorized()
{
	const authUrl = getAuthURL();
	consolePrint(
		"<br>"+PSFORKNAME+" needs permission to share/save games through GitHub:<br><ul><li><a target=\"_blank\" href=\"" + authUrl + "\">Give "+PSFORKNAME+" permission</a></li></ul>",
		true
	);
}

function shareClick()
{
	return shareOnGitHub(true);
}

function cloudSaveClick()
{
	return shareOnGitHub(false);
}

function shareClick() {
	var oauthAccessToken = storage_get("oauth_access_token");
	if (typeof oauthAccessToken !== "string") {
		// Generates 32 letters of random data, like "liVsr/e+luK9tC02fUob75zEKaL4VpQn".
		printUnauthorized();
		return;
	}

	consolePrint("<br>Sending code to github...", true)
	const title = (state.metadata.title !== undefined) ? state.metadata.title + " ("+PSFORKNAME+" Script)" : "Untitled "+PSFORKNAME+" Script";
	
	compile(["rebuild"]);


	const source = editor.getValue();

	var gistToCreate = {
		"description" : title,
		"public" : true,
		"files": {
			"readme.txt" : {
				"content": "Play this game by pasting the script in "+HOSTPAGEURL+"/editor.html"
			},
			"script.txt" : {
				"content": source
			}
		}
	};

	const githubURL = 'https://api.github.com/gists';
	var githubHTTPClient = new XMLHttpRequest();
	githubHTTPClient.open('POST', githubURL);
	githubHTTPClient.onreadystatechange = function()
	{
		if(githubHTTPClient.readyState != 4)
			return;
		var result = JSON.parse(githubHTTPClient.responseText);
		if (githubHTTPClient.status === 403)
		{
			consoleError(result.message);
		}
		else if (githubHTTPClient.status !== 200 && githubHTTPClient.status !== 201)
		{
			if (githubHTTPClient.statusText==="Unauthorized"){
				consoleError("Authorization check failed.  You have to log back into GitHub (or give it permission again or something).");
				storage_remove("oauth_access_token");
			} else {
				consoleError("HTTP Error "+ githubHTTPClient.status + ' - ' + githubHTTPClient.statusText);
				consoleError("Try giving "+PSFORKNAME+" permission again, that might fix things...");
			}
			printUnauthorized();
		}
		else
		{
			const id = result.id;
			const url = qualifyURL("play.html?p="+id);

			const editurl = qualifyURL("editor.html?hack="+id);
			const sourceCodeLink = "Link to source code:<br><a target=\"_blank\"  href=\""+editurl+"\">"+editurl+"</a>";


			consolePrint('GitHub (<a onclick="githubLogOut();"  href="javascript:void(0);">log out</a>) submission successful.<br>',true);

			consolePrint('<br>'+sourceCodeLink,true);


			if (errorCount>0) {
				consolePrint("<br>Cannot link directly to playable game, because there are compiler errors.",true);
			} else {
				consolePrint("<br>The game can now be played at this url:<br><a target=\"_blank\" href=\""+url+"\">"+url+"</a>",true);
			} 

		}
	}
	githubHTTPClient.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	githubHTTPClient.setRequestHeader("Authorization", "token "+oauthAccessToken);
	const stringifiedGist = JSON.stringify(gistToCreate);
	githubHTTPClient.send(stringifiedGist);
    lastDownTarget=canvas;	
}

function githubLogOut(){
	storage_remove("oauth_access_token");

	const authUrl = getAuthURL();
	consolePrint(
		"<br>Logged out of Github.<br>" +
		"<ul>" +
		"<li><a target=\"_blank\" href=\"" + authUrl + "\">Give "+PSFORKNAME+" permission</a></li>" +
		"</ul>"
				,true);
}

function rebuildClick() {
	compile(["rebuild"]);
}

function post_to_url(path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
}

function exportClick() {
	var sourceCode = editor.getValue();

	compile("restart");

	var sourceString = JSON.stringify(sourceCode);
	
	buildStandalone(sourceString);
}
