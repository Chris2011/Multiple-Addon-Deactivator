/**
  FoxyProxy
  Copyright (C) 2006-2010 Eric H. Jung and LeahScape, Inc.
  http://getfoxyproxy.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/gpl.txt
**/
var exampleURL, pattern, generatedPattern, caseSensitive, fpc, isSuperAdd;
function onLoad() {
  var m = window.arguments[0].inn.pattern;
  document.getElementById("enabled").checked = m.enabled;
  document.getElementById("name").value = m.name;
  document.getElementById("pattern").value = m.pattern;
  document.getElementById("matchtype").selectedIndex = m.isRegEx ? 1 : 0;
  document.getElementById("whiteblacktype").selectedIndex = m.isBlackList ? 1 : 0;
  document.getElementById("caseSensitive").checked = m.caseSensitive;
  document.getElementById("temp").checked = m.temp;
  isSuperAdd = window.arguments[0].inn.superadd;
  if (isSuperAdd) {
    document.getElementById("superadd").setAttribute("hidden", false);
    document.getElementById("not-superadd").setAttribute("hidden", true);
  }
  else {
    enabled = m.enabled;
    document.getElementById("superadd").setAttribute("hidden", true);
    document.getElementById("not-superadd").setAttribute("hidden", false);
  }
  exampleURL = document.getElementById("exampleURL");
  pattern = document.getElementById("pattern");
  generatedPattern = document.getElementById("generatedPattern");
  caseSensitive = document.getElementById("caseSensitive");
  fpc = Components.classes["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject;
  updateGeneratedPattern();
  sizeToContent();
}

function onOK() {
  var r = document.getElementById("matchtype").value == "r";
  var p = Components.classes["@leahscape.org/foxyproxy/common;1"].getService()
      .wrappedJSObject.validatePattern(window, r, generatedPattern.value);
  if (p) {
    var ret = Components.classes["@leahscape.org/foxyproxy/match;1"].createInstance().wrappedJSObject;
    //order is (enabled, name, pattern, temp, isRegEx, caseSensitive, isBlackList, isMultiLine)
    ret.init(document.getElementById("enabled").checked,
      document.getElementById("name").value, pattern.value,
      document.getElementById("temp").checked, r,
      caseSensitive.checked, document.getElementById("whiteblacktype").value == "b", false);
    window.arguments[0].out = {pattern:ret};
    return true;
  }
  return false;
}

function updateGeneratedPattern() {
  generatedPattern.value = fpc.applyTemplate(exampleURL.value, pattern.value, caseSensitive.checked);
}