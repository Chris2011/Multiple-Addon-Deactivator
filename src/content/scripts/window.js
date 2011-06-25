(function()
{
   var Cc = Components.classes;
   var Ci = Components.interfaces;
   var propertyStrings = document.getElementById("string-bundle");
   var extensions = [];
   var allExtensions = null;
   var extensionVars = {
      allAddons: 0,
      activatedAddons: 0,
      deactivatedAddons: 0
   };

   this.addonTree = null;
   this.addonActionEnum =
   {
      deactivateAll: 0,
      activateAll: 1,
      actionForMarkedEntry: 2
   };

   function getExtensions(callback)
   {
//      var info = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
//      var appVer = info.version.slice(0, info.version.indexOf('.'));
//
//      if (appVer < 4)
//      {
//         // TODO: implement logic for Gecko Version < 2
//      }
//      else
//      {
         // Gecko Engine Version and later
         Components.utils.import("resource://gre/modules/AddonManager.jsm");
         Application.getExtensions(function(addons)
         {
            allExtensions = addons.all;
            extensionVars.allAddons = addons.all.length;

            for (var i = 0; i < extensionVars.allAddons; ++i)
            {
               extensions.push(
               {
                     addonId: allExtensions[i].id,
                     addonName: allExtensions[i].name,
                     addonVersion: allExtensions[i].version,
                     addonIcon: '',
                     isSelected: false,
                     isDeactivated: false,
                     isIncompatible: false
               });
               countFunction = function(counter)
               {
                  AddonManager.getAddonByID(allExtensions[counter].id, function(addon)
                  {
                     extensions[counter].addonIcon = addon.iconURL;
                     extensions[counter].isDeactivated = addon.userDisabled;
                     extensions[counter].isIncompatible = addon.appDisabled;
                  });
               }

               countFunction(i);

               if(addons.get(extensions[i].addonId).enabled)
               {
                  ++extensionVars.activatedAddons;
               }
               else
               {
                  ++extensionVars.deactivatedAddons;
               }
            }

            callback();
            fillTreeView(extensions);
         });
      //}
   };

   function fillTreeView(extensionModel)
   {
      var treeView =
      {
         originalData: null,
         data: extensionModel,
         treeBox: null,
         sorted: false,
         rowCount: extensionModel.length,
         getCellText: function(row, column)
         {
            return (column.id == "addonName") ? "  "+extensionModel[row].addonName
                                              : extensionModel[row].addonVersion;
         },
         getCellValue: function(row, column)
         {
            return (column.id == "checkboxes") ? extensionModel[row].isSelected : null;
         },
         setTree: function(tree)
         {
            if(tree)
            {
               // initialize view
               this.treeBox = tree;
            }
            else
            {
               // finalize view
               this.treeBox = null;
               this.data = null;
            }
         },
         isContainer: function(row){return false;},
         isEditable: function(row, column){return true},
         isSeparator: function(row)
         {
            return this.data[row] == null;
         },
         isSorted: function()
         {
            return this.sorted;
         },
         getLevel: function(row){return 0;},
         getImageSrc: function(row, column)
         {
            return (column.id == "addonName") ? ((extensionModel[row].addonIcon)
                                              ? extensionModel[row].addonIcon
                                              : "chrome://{appname}/skin/images/defaultIcon.png") : '';
         },
         getRowProperties: function(row, props)
         {
            if(extensionModel[row].isDeactivated)
            {
               setNewStyle(props, "deactivated");
            }
            if (extensionModel[row].isIncompatible)
            {
               setNewStyle(props, "incompatible")
            }
         },
         getCellProperties: function(row, col, props)
         {
            if(extensionModel[row].isDeactivated)
            {
               setNewStyle(props, "deactivated");
            }
            if(extensionModel[row].isIncompatible)
            {
               setNewStyle(props, "incompatible");
            }
         },
         getColumnProperties: function(colid, col, props){},
         cycleCell: function(row, column){},
         cycleHeader: function(column)
         {
            if(column.id == "checkboxes")
            {
               var headerImage = document.getElementById("checkAll");
               var imagePath = "../skin/images/";

               if (headerImage.src == imagePath+"unselected.png")
               {
                  checkAll(headerImage, true, imagePath+"selected.png",
                           column, this.rowCount);
               }
               else
               {
                  checkAll(headerImage, false, imagePath+"unselected.png",
                           column, this.rowCount);
               }
            }
            else if(column.id == "addonName")
            {
               // TODO: implement sort function
            }
         },
         setCellValue: function(row, column, cellValue)
         {
            if(!extensionModel[row].isIncompatible)
            {
               extensionModel[row].isSelected = (column.id == "checkboxes") ? cellValue : null;
            }
         },
         setCellText: function(){}
      };

      function checkAll(imageControl, boolValue, picture, column, rows)
      {
         imageControl.src = picture;
         for(var i = 0; i < rows; i++)
         {
            treeView.setCellValue(i, column, boolValue);
         }
      };

      function setNewStyle(props, status)
      {
         var atomService = Cc["@mozilla.org/atom-service;1"]
                             .getService(Ci.nsIAtomService);
         var style = null;

         if (status == "deactivated")
         {
            style = atomService.getAtom("isDeactivatedStyle");
         }
         else
         {
            style = atomService.getAtom("isIncompatibleStyle");
         }
         props.AppendElement(style);
      };

      document.getElementById("addonTree").view = treeView;
   };

   this.uninit = function()
   {
      document.getElementById("addonTree").view = null;
   };

   this.toBool = function(boolParam)
   {
      return "true" == boolParam;
   };

   this.onRowClick = function()
   {
      var cellVal = !toBool((addonTree.view.getCellValue(
                             addonTree.view.selection.currentIndex,
                             addonTree.view.selection.tree.columns[0])));

      addonTree.view.setCellValue(
      addonTree.view.selection.currentIndex,
      addonTree.view.selection.tree.columns[0], cellVal);
   };

   this.setActionForAddons = function(addonAction)
   {
      if(addonAction == addonActionEnum["deactivateAll"])
      {
         stdAddonAction(true);
         alert(propertyStrings.getString("allDeactivatedMessage"));
      }
      else if(addonAction == addonActionEnum["activateAll"])
      {
         stdAddonAction(false);
         alert(propertyStrings.getString("allActivatedMessage"));
      }
      else if(addonAction == addonActionEnum["actionForMarkedEntry"])
      {
         stdAddonAction(null);
         alert(propertyStrings.getString("executeActionMessage"));
      }
   };

   this.restartFirefox = function()
   {
      if(window.confirm(propertyStrings.getString("restartFirefoxMessage")))
      {
         const nsIAppStartup = Components.interfaces.nsIAppStartup;

         // Notify all windows that an application quit has been requested.
         var os = Cc["@mozilla.org/observer-service;1"]
                    .getService(Ci.nsIObserverService);
         var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"]
                            .createInstance(Ci.nsISupportsPRBool);
         os.notifyObservers(cancelQuit, "quit-application-requested", null);

         // Something aborted the quit process.
         if(cancelQuit.data)
         {
            return;
         }

         // Notify all windows that an application quit has been granted.
         os.notifyObservers(null, "quit-application-granted", null);

         // Enumerate all windows and call shutdown handlers
         var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Ci.nsIWindowMediator);
         var windows = wm.getEnumerator(null);
         while(windows.hasMoreElements())
         {
            var win = windows.getNext();
            if(("tryToClose" in win) && !win.tryToClose())
            {
               return;
            }
         }
         Cc["@mozilla.org/toolkit/app-startup;1"]
           .getService(nsIAppStartup)
           .quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);
      }
   };

   function stdAddonAction(activateAddon)
   {
      var prefs = Cc["@mozilla.org/preferences-service;1"]
                    .getService(Ci.nsIPrefService)
                    .getBranch("multiple-addon-deactivator.ChrisLE@mozilla.org.");

      var prefValue = prefs.getBoolPref("excludeMAD");
      var rows = addonTree.view.rowCount;

      for(var i = 0; i < rows; ++i)
      {
         actionCounter = function(counterVar)
         {
            AddonManager.getAddonByID(extensions[counterVar].addonId, function(addon)
            {
               if(activateAddon == null)
               {
                  var isChecked = toBool((addonTree.view.getCellValue(counterVar, addonTree.view.selection.tree.columns[0])));

                  if(isChecked)
                  {
                     addon.userDisabled = !addon.userDisabled;
                  }
               }
               else
               {
                  if((!addon.userDisabled && activateAddon))
                  {
                     if(!prefValue || (prefValue && addon.id != "ChrisLE@mozilla.org"))
                     {
                        addon.userDisabled = activateAddon;
                     }
                  }
                  else if(addon.userDisabled && !activateAddon)
                  {
                     addon.userDisabled = activateAddon;
                  }
               }
            });
         }

         actionCounter(i);
      }
   };

   setTimeout(function()
   {
      var activatedAddons = document.getElementById("activatedAddons");
      var deactivatedAddons = document.getElementById("deactivatedAddons");
      var totalAddons = document.getElementById("totalAddons");

      getExtensions(function()
      {
         activatedAddons.value = extensionVars.activatedAddons;
         deactivatedAddons.value = extensionVars.deactivatedAddons;
         totalAddons.value = extensionVars.allAddons;
      });

      addonTree = document.getElementById("addonTree");
   }, 1);
})();