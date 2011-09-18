var {appname} = {
   Cc: Components.classes,
   Ci: Components.interfaces,
   onLoad: function()
   {
      // Initialization code.
      this.initialized = true;
      this.gfiltersimportexportBundle = Cc["@mozilla.org/intl/stringbundle;1"]
                                          .getService(Ci.nsIStringBundleService);
      this.mystrings = this.gfiltersimportexportBundle
                           .createBundle("chrome://{appname}/locale/overlay.properties");
   },

   onToolbarButtonCommand: function(event)
   {
      window.open("chrome://{appname}/content/window.xul", "",
                  "chrome, titlebar, toolbar, centerscreen, resizable=yes, modal");
   },

   onMenuItemCommand: function(event)
   {
      window.open("chrome://{appname}/content/window.xul", "",
                  "chrome, titlebar, toolbar, centerscreen, resizable=yes, modal");
   }
};

window.addEventListener("load", function(e)
{
   {appname}.onLoad(e);
}, false);