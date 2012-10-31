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
         order: 1,

         extensionVars: {
            allAddons: 0,
            activatedAddons: 0,
            deactivatedAddons: 0
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

               setTree: function(treebox)
               {
                  this.treebox = treebox;
               },

               isContainer: function(){},
               isSeparator: function(){},
               isSorted: function(){},
               isEditable: function(){},
               getLevel: function(){},

               getImageSrc: function(row, column)
               {
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
                        privates.checkAll(headerImage, true, imagePath+"selected.png", column, true, null);
                     }
                     else
                     {
                        privates.checkAll(headerImage, false, imagePath+"unselected.png", column, true, null);
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
               var atomService = privates.Cc["@mozilla.org/atom-service;1"].getService(privates.Ci.nsIAtomService);
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
         },

         toBool: function(boolParam)
         {
            return "true" === boolParam;
         },

         sortFunc: function(firstObj, nextObj)
         {
               var firstAddonName = firstObj.addonName.toLowerCase( ),
                     nextAddonName = nextObj.addonName.toLowerCase( );

               if(firstAddonName < nextAddonName)
               {
                  return -1 * privates.order
               }

               if(firstAddonName > nextAddonName)
               {
                  return 1 * privates.order;
               }

               return 0;
         },

         checkAll: function(imageControl, boolValue, picture, column, checkAll, checkActivated)
         {
            var addonTree = document.getElementById("addonTree");
            var rows = addonTree.view.rowCount;

            for(var i = 0; i < rows; i++)
            {
               if(checkAll)
               {
                  addonTree.view.setCellValue(i, column, boolValue);
               }
               else
               {
                  AddonManager.getAddonByID(privates.extensions[i].addonId, function(addon)
                  {
                     if(!addon.userDisabled && checkActivated)
                     {
                        addonTree.view.setCellValue(i, column, boolValue);
                     }

                     if(addon.userDisabled && !checkActivated)
                     {
                        addonTree.view.setCellValue(i, column, boolValue);
                     }
                  });
               }
            }

            if(checkAll)
            {
               document.getElementById("checkAllActivated").disabled = boolValue;
               document.getElementById("checkAllDeactivated").disabled = boolValue;
               document.getElementById("checkAllActivated").checked = false;
               document.getElementById("checkAllDeactivated").checked = false;

               imageControl.src = picture;
            }
         },

         stdAddonAction: function(activateAddon)
         {
            var prefs = privates.Cc["@mozilla.org/preferences-service;1"].getService(privates.Ci.nsIPrefService)
                                                                                                            .getBranch("extensions.multiple-addon-deactivator.ChrisLE@mozilla.org.");
            var prefValue = prefs.getBoolPref("excludeMAD");
            var rows = privates.addonGrid.view.rowCount;

            for(var i = 0; i < rows; i++)
            {
                  AddonManager.getAddonByID(privates.extensions[i].addonId, function(addon)
                  {
                     if(activateAddon === null)
                     {
                        if(privates.toBool((privates.addonGrid.view.getCellValue(i,
                                   privates.addonGrid.view.selection.tree.columns[0]))))
                        {
                           addon.userDisabled = !addon.userDisabled;
                        }
                     }
                     else
                     {
                        if((!addon.userDisabled && activateAddon))
                        {
                           if(!prefValue || (prefValue && addon.id !== "ChrisLE@mozilla.org"))
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
         }
      };

      var publics = {
         addonActionEnum: {
            deactivateAll: 0,
            activateAll: 1,
            actionForMarkedEntry: 2
         },

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

            privates.extensions.sort(privates.sortFunc);

            privates.fillTreeView(privates.extensions);
         },

         sort: function(column)
         {
            var columnName;
            privates.order = privates.addonGrid.getAttribute("sortDirection") === "ascending" ? 1 : -1;

            //if the column is passed and it's already sorted by that column, reverse sort
            if(column)
            {
               columnName = column.id;
               privates.order *= (privates.addonGrid.getAttribute("sortResource") === columnName) ? -1 : null;
            }
            else
            {
               columnName = privates.addonGrid.getAttribute("sortResource");
            }

            privates.extensions.sort(privates.sortFunc);
            // Setting these will make the sort option persist.
            privates.addonGrid.setAttribute("sortDirection", privates.order === 1 ? "ascending" : "descending");
            privates.addonGrid.setAttribute("sortResource", columnName);

            // Set the appropriate attributes to show to indicator.
            var cols = privates.addonGrid.getElementsByTagName("treecol");
            var colLength = cols.length;

            for(var i = 0; i < colLength; i++)
            {
               cols[i].removeAttribute("sortDirection");
            }

            document.getElementById(columnName).setAttribute("sortDirection", privates.order === 1 ? "ascending" : "descending");
         },

         onRowClick: function()
         {
            var cellVal = !privates.toBool((privates.addonGrid.view.getCellValue(privates.addonGrid.view.selection.currentIndex, privates.addonGrid.view.selection.tree.columns[0])));

            privates.addonGrid.view.setCellValue(
            privates.addonGrid.view.selection.currentIndex,
            privates.addonGrid.view.selection.tree.columns[0], cellVal);
         },

         setActionForAddons: function(addonAction)
         {
            if(addonAction === publics.addonActionEnum.deactivateAll)
            {
               privates.stdAddonAction(true);
               alert(privates.propertyStrings.getString("allDeactivatedMessage"));
            }
            else if(addonAction === publics.addonActionEnum.activateAll)
            {
               privates.stdAddonAction(false);
               alert(privates.propertyStrings.getString("allActivatedMessage"));
            }
            else if(addonAction === publics.addonActionEnum.actionForMarkedEntry)
            {
               privates.stdAddonAction(null);
               alert(privates.propertyStrings.getString("executeActionMessage"));
            }
         },

         checkAddons: function(checkActivated)
         {
            var checkboxColumn = document.getElementById("checkAll");

            privates.checkAll(checkboxColumn, checkActivated
                     ? (document.getElementById("checkAllActivated").checked)
                     : (document.getElementById("checkAllDeactivated").checked), null,
                     privates.addonGrid.view.selection.tree.columns[0], false, checkActivated);
         },

         restartFirefox: function()
         {
            if(window.confirm(privates.propertyStrings.getString("restartFirefoxMessage")))
            {
               const nsIAppStartup = privates.Ci.nsIAppStartup;

               // Notify all windows that an application quit has been requested.
               var os = privates.Cc["@mozilla.org/observer-service;1"]
                          .getService(privates.Ci.nsIObserverService);
               var cancelQuit = privates.Cc["@mozilla.org/supports-PRBool;1"]
                                  .createInstance(privates.Ci.nsISupportsPRBool);
               os.notifyObservers(cancelQuit, "quit-application-requested", null);

               // Something aborted the quit process.
               if(cancelQuit.data)
               {
                  return;
               }

               // Notify all windows that an application quit has been granted.
               os.notifyObservers(null, "quit-application-granted", null);

               // Enumerate all windows and call shutdown handlers.
               var wm = privates.Cc["@mozilla.org/appshell/window-mediator;1"]
                          .getService(privates.Ci.nsIWindowMediator);
               var windows = wm.getEnumerator(null);
               while(windows.hasMoreElements())
               {
                  var win = windows.getNext();
                  if(("tryToClose" in win) && !win.tryToClose())
                  {
                     return;
                  }
               }

               privates.Cc["@mozilla.org/toolkit/app-startup;1"]
                 .getService(nsIAppStartup)
                 .quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);
            }
         },

         uninit: function()
         {
            privates.addonGrid.view = null;
         }
      };

      return publics;
   };

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

   document.getElementById("addonName").onclick = function()
   {
      madExt.sort(this);
   };

   document.getElementById("treechildren").onclick = madExt.onRowClick;

   document.getElementById("checkAllActivated").onclick = function()
   {
      madExt.checkAddons(true);
   };
};

window.onunload = madExt.uninit();