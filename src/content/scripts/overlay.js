var {appname} = {
   Cc: Components.classes,
   Ci: Components.interfaces,
   onLoad: function()
   {
      // initialization code
      this.initialized = true;
      this.gfiltersimportexportBundle = Cc["@mozilla.org/intl/stringbundle;1"]
                                          .getService(Ci.nsIStringBundleService);
      this.mystrings = this.gfiltersimportexportBundle
                           .createBundle("chrome://{appname}/locale/overlay.properties");
   },

   onToolbarButtonCommand: function(event)
   {
      if(event.button == 0)
      {
         window.open("chrome://{appname}/content/window.xul", "", "chrome,titlebar,toolbar,centerscreen,resizable=no,modal");
      }
      else if(event.button == 2)
      {
         // TODO: for rightclick, open a contextmenue to show an option-entry
         // to open the M.A.D. options.
      }
   },

   onMenuItemCommand: function(event)
   {
      window.open("chrome://{appname}/content/window.xul", "", "chrome,titlebar,toolbar,centerscreen,resizable=no,modal");
   }
};

window.addEventListener("load", function(e)
{
   {appname}.onLoad(e);
}, false);