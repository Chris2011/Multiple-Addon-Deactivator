/**
  FoxyProxy
  Copyright (C) 2006-2010 Eric H. Jung and LeahScape, Inc.
  http://getfoxyproxy.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/gpl.txt
**/
const CI = Components.interfaces, CC = Components.classes;
var urlsTree, proxy, foxyproxy, autoconfurl, overlay, isWindows, fpc;

function onLoad() {
  isWindows = CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULRuntime).OS == "WINNT";
  fpc = CC["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject;
  overlay = fpc.getMostRecentWindow().foxyproxy;
  autoconfurl = document.getElementById("autoconfurl");
  foxyproxy = CC["@leahscape.org/foxyproxy/service;1"].getService().wrappedJSObject;
  if (window.arguments[0].inn.torwiz) {
    document.getElementById("torwiz-broadcaster").hidden = true;
    document.getElementById("not-torwiz-broadcaster").hidden = false;
    urlsTree = document.getElementById("torWizUrlsTree");
  }
  else
    urlsTree = document.getElementById("urlsTree");

  proxy = window.arguments[0].inn.proxy;
  document.getElementById("proxyname").value = proxy.name;
  document.getElementById("proxynotes").value = proxy.notes;
  document.getElementById("animatedIcons").checked = proxy.animatedIcons;
  document.getElementById("cycleEnabled").checked = proxy.includeInCycle;
  document.getElementById("colorpicker").color = proxy.color;
  pickcolor(proxy.color); // NEW SVG
  document.getElementById("tabs").selectedIndex = proxy.selectedTabIndex;
  document.getElementById("proxyenabled").checked = proxy.enabled;
  document.getElementById("mode").value = proxy.mode;
  toggleMode(proxy.mode);
  document.getElementById("host").value = proxy.manualconf.host;
  document.getElementById("port").value = proxy.manualconf.port;
  document.getElementById("isSocks").checked = proxy.manualconf.isSocks;
  document.getElementById("socksversion").value = proxy.manualconf.socksversion;
  document.getElementById("proxyDNS").checked = proxy.proxyDNS;
  autoconfurl.value = proxy.autoconf.url;

  if (proxy.lastresort) {
    document.getElementById("default-proxy-broadcaster").setAttribute("disabled", "true");
	  document.getElementById("proxyname").disabled =
	  	document.getElementById("proxynotes").disabled = true;
      document.getElementById("foxyproxy-urlpatterns-tab").hidden = true;
  }
  document.getElementById("pacLoadNotificationEnabled").checked = proxy.autoconf.loadNotification;
  document.getElementById("pacErrorNotificationEnabled").checked = proxy.autoconf.errorNotification;
  document.getElementById("autoConfURLReloadEnabled").checked = proxy.autoconf.autoReload;
  document.getElementById("autoConfReloadFreq").value = proxy.autoconf.reloadFreqMins;

  _updateView();
  sizeToContent();
}

function trim(s) {
	return s.replace(/^\s*|\s*$/g, "");
}

function onOK() {
  var host = trim(document.getElementById("host").value),
    port = document.getElementById("port").value,
    name = trim(document.getElementById("proxyname").value);
  if (!name)
    name = host ? (host + ":" + port) : foxyproxy.getMessage("new.proxy");
  var enabled = document.getElementById("proxyenabled").checked,    
    url = trim(autoconfurl.value),
    reloadfreq = document.getElementById("autoConfReloadFreq").value;
  var mode = document.getElementById("mode").value;
  if (enabled) {
    if (mode == "auto") {
	    if (!_checkUri())
	    	return false;
    }
    else if (mode == "manual") {
    	if (!host) {
    		if (!port) {
			    foxyproxy.alert(this, foxyproxy.getMessage("nohostport.3"));
			    return false;
    		}
		    foxyproxy.alert(this, foxyproxy.getMessage("nohost.3"));
		    return false;
    	}
    	else if (!port) {
		    foxyproxy.alert(this, foxyproxy.getMessage("noport.3"));
		    return false;
		  }
		}
  }

  if (!foxyproxy.isFoxyProxySimple()) {
    // Don't do this for FoxyProxy Basic
  	if (!hasWhite() && !foxyproxy.warnings.showWarningIfDesired(window, [window.arguments[0].inn.torwiz ?
        "torwiz.nopatterns.3" : "no.white.patterns.3", name], "white-patterns"))
  	  return false;
  }
  
	var isSocks = document.getElementById("isSocks").checked;
	
	if (fpc.isThunderbird() && !isSocks && mode == "manual" && !foxyproxy.warnings.showWarningIfDesired(window, ["socksWarning"], "socks"))
	  return false;

  proxy.name = name;
  proxy.notes = document.getElementById("proxynotes").value;
  proxy.selectedTabIndex = document.getElementById("tabs").selectedIndex;
  proxy.autoconf.url = url;
  proxy.autoconf.loadNotification = document.getElementById("pacLoadNotificationEnabled").checked;
  proxy.autoconf.errorNotification = document.getElementById("pacErrorNotificationEnabled").checked;
	proxy.autoconf.autoReload = document.getElementById("autoConfURLReloadEnabled").checked;
	proxy.autoconf.reloadFreqMins = reloadfreq;

  proxy.mode = mode; // set this first to control PAC loading
  proxy.enabled = enabled;
  proxy.manualconf.host = host;
  proxy.manualconf.port = port;
  proxy.manualconf.isSocks = isSocks;
  proxy.manualconf.socksversion = document.getElementById("socksversion").value;
  proxy.animatedIcons = document.getElementById("animatedIcons").checked;
  proxy.includeInCycle = document.getElementById("cycleEnabled").checked;
  var color = new RGBColor(document.getElementById("color").value); // NEW SVG
  if(color.ok) {
    proxy.color = document.getElementById("color").value;
  } else {
    foxyproxy.alert(this, foxyproxy.getMessage("foxyproxy.invalidcolor.label"));
    return false;
  }
  proxy.proxyDNS = document.getElementById("proxyDNS").checked;
  proxy.afterPropertiesSet();
  window.arguments[0].out = {proxy:proxy};
  return true;
}

function hasWhite() {
  return proxy.matches.some(function(m){return m.enabled && !m.isBlackList;});
}

function _checkUri() {
	var url = trim(autoconfurl.value);
	if (url.indexOf("://") == -1) {
		// User didn't specify a scheme, so assume he means file:///
		url = url.replace(/\\/g,"/"); // replaces backslashes with forward slashes; probably not strictly necessary
		if (url[0] != "\\" && url[0] != "/") url="/"+url; // prepend a leading slash if necessary
		url="file:///" + (isWindows?"C:":"") + url;
		autoconfurl.value = url; // copy back to the UI
	}
	try {
    //return foxyproxy.newURI(url);
    return CC["@mozilla.org/network/io-service;1"]
      .getService(CI.nsIIOService).newURI(url, "UTF-8", null);
  }
  catch(e) {
    foxyproxy.alert(this, foxyproxy.getMessage("invalid.url"));
    return false;
  }
}

function onAddEditURLPattern(isNew) {
  var idx = urlsTree.currentIndex, m;
  if (isNew) {
    m = CC["@leahscape.org/foxyproxy/match;1"].createInstance().wrappedJSObject;
    idx = proxy.matches.length;
  }
  else if (idx == -1) return; // safety; may not be necessary anymore

  var params = {inn:{pattern: (isNew ? m : proxy.matches[idx]), superadd:false}, out:null};

  window.openDialog("chrome://foxyproxy/content/pattern.xul", "",
    "chrome, dialog, modal, resizable=yes", params).focus();

  if (params.out) {
    proxy.matches[idx] = params.out.pattern;
    _updateView();
    // Select item
	  urlsTree.view.selection.select(isNew?urlsTree.view.rowCount-1 : urlsTree.currentIndex);
  }
}

function setButtons(observerId, tree) {
  document.getElementById(observerId).setAttribute("disabled", tree.currentIndex == -1);
  onAutoConfUrlInput();
}

function getTextForCell(pat, col) {
  switch (col) {
    case "name":return pat.name;
    case "pattern":return pat.pattern;
    case "isRegEx":return foxyproxy.getMessage(pat.isRegEx ? "foxyproxy.regex.label" : "foxyproxy.wildcard.label");
    case "isBlackList":return foxyproxy.getMessage(pat.isBlackList ? "foxyproxy.blacklist.label" : "foxyproxy.whitelist.label");
    case "caseSensitive":return foxyproxy.getMessage(pat.caseSensitive ? "yes" : "no");
    case "temp":return foxyproxy.getMessage(pat.temp ? "yes" : "no");
  };
}

function _updateView() {
  // Redraw the trees
  urlsTree.view = makeView();

  function makeView() {
    return {
      rowCount : proxy.matches.length,
      getCellText : function(row, column) {
        return getTextForCell(proxy.matches[row], column.id ? column.id : column);
      },
      setCellValue: function(row, col, val) {proxy.matches[row].enabled = val;},
      getCellValue: function(row, col) {return proxy.matches[row].enabled;},
      isSeparator: function(aIndex) { return false; },
      isSorted: function() { return false; },
      isEditable: function(row, col) { return false; },
      isContainer: function(aIndex) { return false; },
      setTree: function(aTree){},
      getImageSrc: function(aRow, aColumn) {return null;},
      getProgressMode: function(aRow, aColumn) {},
      cycleHeader: function(aColId, aElt) {},
      getRowProperties: function(aRow, aColumn, aProperty) {},
      getColumnProperties: function(aColumn, aColumnElement, aProperty) {},
      getCellProperties: function(aRow, aProperty) {},
      getLevel: function(row){ return 0; }

    };
  }
  setButtons("urls-tree-row-selected", urlsTree);
}

function onRemoveURLPattern() {
  // Store cur selection
  var sel = urlsTree.currentIndex;
  proxy.removeURLPattern(proxy.matches[sel]);
  _updateView();
  // Reselect the next appropriate item
	urlsTree.view.selection.select(sel+1>urlsTree.view.rowCount ? urlsTree.view.rowCount-1:sel);
}

function onCopyURLPattern() {
  // Get current selection
  var currentMatch = proxy.matches[urlsTree.currentIndex];
  // Make new match
  var m = CC["@leahscape.org/foxyproxy/match;1"].createInstance().wrappedJSObject,
    idx = proxy.matches.length,  
    dom = currentMatch.toDOM(document, true);
  m.fromDOM(dom, true);
  
  proxy.matches[idx] = m;
  _updateView();

  // Select new item
  urlsTree.view.selection.select(urlsTree.view.rowCount-1);
}

function toggleMode(mode) {
  // Next line--buggy in FF 1.5.0.1--makes fields enabled but readonly
  // document.getElementById("disabled-broadcaster").setAttribute("disabled", mode == "auto" ? "true" : "false");
  // Call removeAttribute() instead of setAttribute("disabled", "false") or setAttribute("disabled", false);
  // Thanks, Andy McDonald.
  if (mode == "auto") {
    document.getElementById("autoconf-broadcaster1").removeAttribute("disabled");
		document.getElementById("disabled-broadcaster").setAttribute("disabled", "true");
		document.getElementById("direct-broadcaster").removeAttribute("disabled", "true");
		document.getElementById("proxyDNS").hidden = false;
		onAutoConfUrlInput();
  }
  else if (mode == "direct") {
    document.getElementById("disabled-broadcaster").setAttribute("disabled", "true");
		document.getElementById("autoconf-broadcaster1").setAttribute("disabled", "true");
		document.getElementById("direct-broadcaster").setAttribute("disabled", "true");
		document.getElementById("proxyDNS").hidden = true;
  }
  else {
    document.getElementById("disabled-broadcaster").removeAttribute("disabled");
    document.getElementById("autoconf-broadcaster1").setAttribute("disabled", "true");
    document.getElementById("direct-broadcaster").removeAttribute("disabled");
    document.getElementById("proxyDNS").hidden = false;
  }
}

function onHelp() {
  fpc.openAndReuseOneTabPerURL("http://getfoxyproxy.org/patterns.html");
}

function onViewAutoConf() {
  var w, p = _checkUri();
  if (p) {
    // This goes through currently configured proxies, unlike actually loading the PAC.
    // In that case, DIRECT (no proxy) is used.
    var url = p.spec + (p.spec.match(/\?/) == null ? "?" : "&") + (new Date()).getTime(); // bypass cache
		w = open("view-source:" + url, "", "scrollbars,resizable,modal,chrome,dialog=no,width=450,height=425").focus();
    if (w) w.windowtype="foxyproxy-options"; // set windowtype so it's forced to close when last browser closes
  }
}

function onTestAutoConf() {
	if (_checkUri()) {
	  try {
		  CC["@leahscape.org/foxyproxy/autoconf;1"].createInstance().wrappedJSObject.testPAC(autoconfurl.value);
      foxyproxy.alert(this, foxyproxy.getMessage("autoconfurl.test.success"));
	  }
	  catch (e) {
	    foxyproxy.alert(this, foxyproxy.getMessage("autoconfurl.test.fail2", [e.message]));
	  }
	}
}

function onAutoConfUrlInput() {
  // setAttribute("disabled", true) buggy in FF 1.5.0.4 for the way i've setup the cmd
  // so must use removeAttribute()
	var b = document.getElementById("autoconf-broadcaster2");
  if (autoconfurl.value.length > 0)
    b.removeAttribute("disabled");
  else
    b.setAttribute("disabled", "true");
}

function onSelectAutoConf() {
  const nsIFilePicker = CI.nsIFilePicker;
  var p = CC["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  p.init(window, foxyproxy.getMessage("pac.select"), nsIFilePicker.modeOpen);
  p.appendFilters(nsIFilePicker.filterAll);
  p.appendFilter(foxyproxy.getMessage("pac.files"), "*.pac");
  p.defaultExtension = "pac";
  if (p.show() != nsIFilePicker.returnCancel) {
  	autoconfurl.value = foxyproxy.transformer(p.file, "uri-string");
  	onAutoConfUrlInput();
  }
}

function onTreeMenuPopupShowing(enabledMenuItem, pats, tree) {
  if (tree.currentIndex == -1) return;
	enabledMenuItem.setAttribute("checked", pats[tree.currentIndex].enabled);
}

function toggleEnabled(pats, tree) {
	pats[tree.currentIndex].enabled = !pats[tree.currentIndex].enabled;
  _updateView();
}

function onWildcardReference(popupId, btnId) {
	document.getElementById(popupId).showPopup(document.getElementById(btnId), -1, -1, 'popup', 'bottomleft', 'topleft');
}

function pickcolor(scolor) {
	document.getElementById("color").value=scolor;
}

function customcolor(scolor) {
	var color = new RGBColor(scolor);
	if(color.ok) {
		document.getElementById("colorpicker").color=scolor;
		document.getElementById("colorfalse").setAttribute("hidden", "true");
		document.getElementById("colortrue").setAttribute("hidden", "false");
	} else {
		document.getElementById("colorfalse").setAttribute("hidden", "false");
		document.getElementById("colortrue").setAttribute("hidden", "true");
	}
}

function getTextForBoolean(b) {
  return foxyproxy.getMessage(b ? "yes" : "no");
}

/**
 * TODO: See if there's any way to generalize this function with sortlog() in options.xul to prevent code duplication
 */ 
function sort(columnId) {
  // determine how the urlsTree is currently sorted (ascending/decending) and by which column (sortResource)
  var order = urlsTree.getAttribute("sortDirection") == "ascending" ? 1 : -1;
  // if the column is passed and it's already sorted by that column, reverse sort
  if (columnId) {
    if (urlsTree.getAttribute("sortResource") == columnId) {
      order *= -1;
    }
  } else {
    columnId = urlsTree.getAttribute("sortResource");
  }
  
  //prepares an object for easy comparison against another. for strings, lowercases them
  function prepareForComparison(o) {
    if (typeof o == "string") {
      return o.toLowerCase();
    }
    return o;
  }
  
  function columnSort(a, b) {
    // Sort on the displayed text, not the underlying data. The underlying data can be true/false
    // for some columns while the displayed text can be, for example, "Whitelist/Blacklist" or "yes/no"
    // or "Wildcards/Regular Expression" 
    
    var c, d;
    if (columnId == "enabled") {
      if (a.enabled) return -1 * order;
      if (b.enabled) return order;
    }
    else {
      c = getTextForCell(a, columnId);
      d = getTextForCell(b, columnId);
    }
    
    if (prepareForComparison(c) > prepareForComparison(d)) return order;
    if (prepareForComparison(c) < prepareForComparison(d)) return -1 * order;
    // tie breaker: enabled ascending is the second level sort
    if (columnId != "enabled") {
      if (a.enabled) return 1;
      if (b.enabled) return -1;
    }
    return 0;
  }
  proxy.matches.sort(columnSort);
  
  // setting these will make the sort option persist
  urlsTree.setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
  urlsTree.setAttribute("sortResource", columnId);
  
  // set the appropriate attributes to show to indicator
  var cols = urlsTree.getElementsByTagName("treecol");
  for (var i = 0; i < cols.length; i++) {
    cols[i].removeAttribute("sortDirection");
  }
  document.getElementById(columnId).setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
  
  _updateView();
}
 
/**
 * If the user enters the port as part of the hostname, parse it and put it into the port field automatically.
 * Thanks, Sebastian Lisken <Sebastian dot Lisken at gmx dot net>
 */
function onHostChange(hostInput) {
  var portInput = document.getElementById("port");
  hostInput.value = hostInput.value.replace(/^\s*(.*?)\s*$/, "$1");
  var match = hostInput.value.match(/^(.*?)(?:\s*:\s*|\s+)([0-9]+)$/);
  if (match) {
    var port = match[2] - 0;
    if (port < 0x10000) {
      hostInput.value = match[1];
      portInput.value = port;
    }
  }
}