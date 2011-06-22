/**
  FoxyProxy
  Copyright (C) 2006-2010 Eric H. Jung and LeahScape, Inc.
  http://getfoxyproxy.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/gpl.txt
**/

function onLoad() {
  var btn1 = document.getElementById("1");
  
  var inn = window.arguments[0].inn;
  document.getElementById("title").appendChild(document.createTextNode(inn.title));
  
  btn1.label = inn.btn1Text;
  document.getElementById("2").label = inn.btn2Text;
  document.getElementById("3").label = inn.btn3Text;
  btn1.focus();
	sizeToContent();
}

function onOK(v) {
  window.arguments[0].out = {value:v};
  close();
}