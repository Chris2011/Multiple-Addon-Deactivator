var {appname}  = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.gfiltersimportexportBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    this.mystrings = this.gfiltersimportexportBundle.createBundle("chrome://{appname}/locale/overlay.properties");
},
  onToolbarButtonCommand: function() {
      window.open("chrome://{appname}/content/window.xul", "", "chrome,titlebar,toolbar,centerscreen,modal");
  },
  
  onMenuItemCommand: function(event) {
      window.open("chrome://{appname}/content/window.xul", "", "chrome,titlebar,toolbar,centerscreen,modal");
  }
};

window.addEventListener("load", function(e) { {appname}.onLoad(e); }, false);