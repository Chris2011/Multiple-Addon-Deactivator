(function()
{
   "use strict";

   var madExt = function()
   {
      var privates = {
         Cc: Components.classes,
         Ci: Components.interfaces,
         propertyStrings: document.getElementById("string-bundle"),
         extensions: [],
         addonGrid: null,

         extensionVars: {
            allAddons: 0,
            activatedAddons: 0,
            deactivatedAddons: 0
         },

         addonActionEnum: {
            deactivateAll: 0,
            activateAll: 1,
            actionForMarkedEntry: 2
         },

         fillTreeView: function(extensionModel)
         {
            var treeView = {
               rowCount: extensionModel.length,

               getCellText: function(row, column)
               {
                  return (column.id === "addonName") ? "  "+extensionModel[row].addonName : extensionModel[row].addonVersion;
               },

               getCellValue: function(row, column)
               {
                  return (column.id === "checkboxes") ? extensionModel[row].isSelected : null;
               },

               setTree: function(/*treebox*/)
               {
                  //this.treebox = treebox;
               },

               isContainer: function(){},
               isSeparator: function(){},
               isSorted: function(){},
               isEditable: function(){},
               getLevel: function(){},

               getImageSrc: function(row, column)
               {
//                  if(column.id === "addonName")
//                     {
//                        return extensionModel[row].addonIcon;
//                     }
//
                  return (column.id === "addonName") ? ((extensionModel[row].addonIcon)
                                                                                 ? extensionModel[row].addonIcon : "chrome://{appname}/skin/images/defaultIcon.png")
                                                                             : '';
               },

               getRowProperties: function(row, props)
               {
                  setStyle(row, props);
               },

               getCellProperties: function(row, column, props)
               {
                  setStyle(row, props);
               },

               getColumnProperties: function(){},
               cycleCell: function(){},

               cycleHeader: function(column)
               {
                  if(column.id === "checkboxes")
                  {
                     var headerImage = document.getElementById("checkAll");
                     var imagePath = "../skin/images/";

                     if (headerImage.src === imagePath+"unselected.png")
                     {
                        checkAll(headerImage, true, imagePath+"selected.png", column, true, null);
                     }
                     else
                     {
                        checkAll(headerImage, false, imagePath+"unselected.png", column, true, null);
                     }
                  }
               },

               setCellValue: function(row, column, cellValue)
               {
                  if(!extensionModel[row].isIncompatible)
                  {
                     if(column.id === "checkboxes")
                     {
                         extensionModel[row].isSelected = cellValue
                     }
                  }
               },

               setCellText: function(){}
            };

            var setStyle = function(row, props)
            {
               if(extensionModel[row].isDeactivated)
               {
                  setNewStyle(props, "deactivated");
               }
               else
               {
                  setNewStyle(props, "activated");
               }

               if(extensionModel[row].isIncompatible)
               {
                  setNewStyle(props, "incompatible");
               }
            };

            var setNewStyle = function(props, status)
            {
               var atomService = Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);
               var style = null;

               if(status === "deactivated")
               {
                  style = atomService.getAtom("isDeactivatedStyle");
               }
               else
               {
                style = atomService.getAtom("isActivatedStyle");
               }

               if(status === "incompatible")
               {
                  style = atomService.getAtom("isIncompatibleStyle");
               }

               props.AppendElement(style);
            };

            privates.addonGrid.view = treeView;
         }
      };

      var publics = {
         init: function(callback)
         {
            Components.utils.import("resource://gre/modules/AddonManager.jsm");

            Application.getExtensions(function(addons)
            {
               privates.extensionVars.allAddons = addons.all.length;

               for(var addon in addons.all)
               {
                  AddonManager.getAddonByID(addons.all[addon].id, function(addonObj)
                  {
                     callback(addonObj);
                  });

                  addons.get(addons.all[addon].id).enabled ? ++privates.extensionVars.activatedAddons : ++privates.extensionVars.deactivatedAddons;
               }
            });
         },

         fillExtensionArr: function(controlObj, addon)
         {
            privates.addonGrid = controlObj.addonTree;

            controlObj.activatedAddons.value = privates.extensionVars.activatedAddons;
            controlObj.deactivatedAddons.value =privates.extensionVars.deactivatedAddons;
            controlObj.totalAddons.value = privates.extensionVars.allAddons;

            privates.extensions.push({
               addonId: addon.id,
               addonName: addon.name,
               addonVersion: addon.version,
               addonIcon: addon.iconURL,
               isSelected: false,
               isDeactivated: addon.userDisabled,
               isIncompatible: addon.appDisabled
            });

            privates.extensions.sort(function(firstObj, nextObj)
            {
                  var firstAddonName = firstObj.addonName.toLowerCase( ),
                        nextAddonName = nextObj.addonName.toLowerCase( );

                  if(firstAddonName < nextAddonName)
                  {
                     return -1;
                  }

                  if(firstAddonName > nextAddonName)
                  {
                     return 1;
                  }

                  return 0;
            });

            privates.fillTreeView(privates.extensions);
         },

         uninit: function()
         {
            document.getElementById("addonTree").view = null;
         }
      };

      return publics;
   };

//   var checkAll = function(imageControl, boolValue, picture, column, checkAll, checkActivated)
//   {
//      var addonTree = document.getElementById("addonTree");
//      var rows = addonTree.view.rowCount;
//
//      actionCounter = function(counterVar)
//      {
//         AddonManager.getAddonByID(extensions[counterVar].addonId, function(addon)
//         {
//            if(!addon.userDisabled && checkActivated)
//            {
//               addonTree.view.setCellValue(counterVar, column, boolValue);
//            }
//            if(addon.userDisabled && !checkActivated)
//            {
//              addonTree.view.setCellValue(counterVar, column, boolValue);
//            }
//         });
//      }
//
//      if(checkAll)
//      {
//         document.getElementById("checkAllActivated").disabled = boolValue;
//         document.getElementById("checkAllDeactivated").disabled = boolValue;
//         document.getElementById("checkAllActivated").checked = false;
//         document.getElementById("checkAllDeactivated").checked = false;
//
//         imageControl.src = picture;
//      }
//
//      for(var i = 0; i < rows; i++)
//      {
//         if(checkAll)
//         {
//            addonTree.view.setCellValue(i, column, boolValue);
//         }
//         else
//         {
//            actionCounter(i);
//         }
//      }
//   };

   var prepareForComparison = function(o)
   {
      return (typeof o === "string") ? o.toLowerCase() : o;
   };

   var sort = function(column)
   {
      var addonTree = document.getElementById("addonTree");
      var columnName;
      var order = addonTree.getAttribute("sortDirection") === "ascending" ? 1 : -1;

      //if the column is passed and it's already sorted by that column, reverse sort
      if(column)
      {
         columnName = column.id;
         order *= (addonTree.getAttribute("sortResource") === columnName) ? -1 : null;
      }
      else
      {
         columnName = addonTree.getAttribute("sortResource");
      }

      var columnSort = function(a, b)
      {
         if(prepareForComparison(a[columnName]) > prepareForComparison(b[columnName]))
         {
            return 1 * order;
         }
         if(prepareForComparison(a[columnName]) < prepareForComparison(b[columnName]))
         {
            return -1 * order;
         }

         return 0;
      };

      extensions.sort(columnSort);
      // Setting these will make the sort option persist.
      addonTree.setAttribute("sortDirection", order === 1 ? "ascending" : "descending");
      addonTree.setAttribute("sortResource", columnName);

      // Set the appropriate attributes to show to indicator.
      var cols = addonTree.getElementsByTagName("treecol");
      var colLength = cols.length;

      for(var i = 0; i < colLength; i++)
      {
         cols[i].removeAttribute("sortDirection");
      }
      document.getElementById(columnName).setAttribute("sortDirection", order === 1 ? "ascending" : "descending");
   };

//   var toBool = function(boolParam)
//   {
//      return "true" === boolParam;
//   };

//   var checkAddons = function(checkActivated)
//   {
//      var addonTree = document.getElementById("addonTree");
//      var checkboxColumn = document.getElementById("checkAll");
//
//      checkAll(checkboxColumn, checkActivated
//               ? (document.getElementById("checkAllActivated").checked)
//               : (document.getElementById("checkAllDeactivated").checked), null,
//               addonTree.view.selection.tree.columns[0], false, checkActivated);
//   };

//   var onRowClick = function()
//   {
//      var addonTree = document.getElementById("addonTree");
//      var cellVal = !toBool((addonTree.view.getCellValue(addonTree.view.selection.currentIndex, addonTree.view.selection.tree.columns[0])));
//
//      addonTree.view.setCellValue(
//      addonTree.view.selection.currentIndex,
//      addonTree.view.selection.tree.columns[0], cellVal);
//   };

//   var setActionForAddons = function(addonAction)
//   {
//      if(addonAction === addonActionEnum.deactivateAll)
//      {
//         stdAddonAction(true);
//         alert(propertyStrings.getString("allDeactivatedMessage"));
//      }
//      else if(addonAction === addonActionEnum.activateAll)
//      {
//         stdAddonAction(false);
//         alert(propertyStrings.getString("allActivatedMessage"));
//      }
//      else if(addonAction === addonActionEnum.actionForMarkedEntry)
//      {
//         stdAddonAction(null);
//         alert(propertyStrings.getString("executeActionMessage"));
//      }
//   };

//   var restartFirefox = function()
//   {
//      if(window.confirm(propertyStrings.getString("restartFirefoxMessage")))
//      {
//         const nsIAppStartup = Components.interfaces.nsIAppStartup;
//
//         // Notify all windows that an application quit has been requested.
//         var os = Cc["@mozilla.org/observer-service;1"]
//                    .getService(Ci.nsIObserverService);
//         var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"]
//                            .createInstance(Ci.nsISupportsPRBool);
//         os.notifyObservers(cancelQuit, "quit-application-requested", null);
//
//         // Something aborted the quit process.
//         if(cancelQuit.data)
//         {
//            return;
//         }
//
//         // Notify all windows that an application quit has been granted.
//         os.notifyObservers(null, "quit-application-granted", null);
//
//         // Enumerate all windows and call shutdown handlers.
//         var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
//                    .getService(Ci.nsIWindowMediator);
//         var windows = wm.getEnumerator(null);
//         while(windows.hasMoreElements())
//         {
//            var win = windows.getNext();
//            if(("tryToClose" in win) && !win.tryToClose())
//            {
//               return;
//            }
//         }
//
//         Cc["@mozilla.org/toolkit/app-startup;1"]
//           .getService(nsIAppStartup)
//           .quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);
//      }
//   };

//   var stdAddonAction = function(activateAddon)
//   {
//      var addonTree = document.getElementById("addonTree");
//      var prefs = Cc["@mozilla.org/preferences-service;1"]
//                    .getService(Ci.nsIPrefService)
//                    .getBranch("extensions.multiple-addon-deactivator.ChrisLE@mozilla.org.");
//      var prefValue = prefs.getBoolPref("excludeMAD");
//
//      for(var i = 0, rows = addonTree.view.rowCount; i < rows; i++)
//      {
//         actionCounter = function(counterVar)
//         {
//            AddonManager.getAddonByID(extensions[counterVar].addonId, function(addon)
//            {
//               if(activateAddon === null)
//               {
//                  if(toBool((addonTree.view.getCellValue(counterVar,
//                             addonTree.view.selection.tree.columns[0]))))
//                  {
//                     addon.userDisabled = !addon.userDisabled;
//                  }
//               }
//               else
//               {
//                  if((!addon.userDisabled && activateAddon))
//                  {
//                     if(!prefValue || (prefValue && addon.id !== "ChrisLE@mozilla.org"))
//                     {
//                        addon.userDisabled = activateAddon;
//                     }
//                  }
//                  else if(addon.userDisabled && !activateAddon)
//                  {
//                     addon.userDisabled = activateAddon;
//                  }
//               }
//            });
//         }
//
//         actionCounter(i);
//      }
//   };

   //window.checkAddons = checkAddons;
   //window.onRowClick = onRowClick;
   //window.setActionForAddons = setActionForAddons;
   //window.restartFirefox = restartFirefox;
   window.sort = sort;
   window.madExt = madExt();
}());

window.onload = function()
{
   var controls = {
      activatedAddons: document.getElementById("activatedAddons"),
      deactivatedAddons: document.getElementById("deactivatedAddons"),
      totalAddons: document.getElementById("totalAddons"),
      addonTree: document.getElementById("addonTree")
   };

   madExt.init(function(addonObj)
   {
      madExt.fillExtensionArr(controls, addonObj);
   });
};

//window.onunload = madExt.uninit();