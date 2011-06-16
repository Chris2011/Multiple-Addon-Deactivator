var MAD  = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.gfiltersimportexportBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    this.mystrings = this.gfiltersimportexportBundle.createBundle("chrome://MAD/locale/overlay.properties");
},
  onToolbarButtonCommand: function() {
      window.open("chrome://MAD/content/window.xul", "", "chrome,titlebar,toolbar,centerscreen,modal");
  },
  
  onMenuItemCommand: function(event) {
      window.open("chrome://MAD/content/window.xul", "", "chrome,titlebar,toolbar,centerscreen,modal");
  }
};

window.addEventListener("load", function(e) { MAD.onLoad(e); }, false);