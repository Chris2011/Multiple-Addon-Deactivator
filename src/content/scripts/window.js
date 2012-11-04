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
         //addonGrid: null, // TODO: use a private variable to set it with document.getElementById("addonTree");
         order: 1,

         extensionCounter: {
            allAddons: 0,
            activatedAddons: 0,
            deactivatedAddons: 0,
            incompatibleAddons: 0,
            restartlessAddons: 0
         },

         fillTreeView: function(extensionModel)
         {
            var treeView = {
               rowCount: extensionModel.length,

               getCellText: function(row, column)
               {
                  return (column.id === "addonName") ? "  "+extensionModel[row].addonName : "  "+extensionModel[row].addonVersion;
               },

               getCellValue: function(row, column)
               {
                  var returnValue = null;
                  if(column.id === "checkboxes")
                  {
                     returnValue =  extensionModel[row].isSelected;
                  }

                  return returnValue;
               },

               setTree: function(){},
               isContainer: function(){},
               isSeparator: function(){},
               isSorted: function(){},
               isEditable: function(){},
               getLevel: function(){},

               getImageSrc: function(row, column)
               {
                  var addonIcon = '';

                  if(column.id === "addonName")
                  {
                     if(extensionModel[row].addonIcon)
                     {
                        addonIcon = extensionModel[row].addonIcon;
                     }
                     else
                     {
                        addonIcon = "chrome://{appname}/skin/images/defaultIcon.png";
                     }
                  }

                  if(column.id === "addonVersion")
                  {
                     if(extensionModel[row].isRestartless)
                     {
                        addonIcon = "chrome://{appname}/skin/images/star.png";
                     }
                  }

                  return addonIcon;
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

            document.getElementById("addonTree").view = treeView;
         },

         toBool: function(boolParam)
         {
            return "true" === boolParam;
         },

         sortFunc: function(firstObj, nextObj)
         {
               var firstAddonName = firstObj.addonName.toLowerCase(),
                     nextAddonName = nextObj.addonName.toLowerCase();

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

         checkAll: function(imageControl, boolValue, picture, column, checkAll, addonState)
         {
            var addonTree = document.getElementById("addonTree"),
                  checkAllActivated = document.getElementById("checkAllActivated"),
                  checkAllDeactivated = document.getElementById("checkAllDeactivated"),
                  checkAllActivatedRestartless = document.getElementById("checkAllActivatedRestartless"),
                  checkAllDeactivatedRestartless = document.getElementById("checkAllDeactivatedRestartless"),
                  rows = addonTree.view.rowCount;

            var actionCounter = function(counterVar)
            {
                  if(!privates.extensions[counterVar].isDeactivated && addonState == publics.addonStateEnum.activated)
                  {
                     addonTree.view.setCellValue(counterVar, column, boolValue);
                  }
                  else if(privates.extensions[counterVar].isDeactivated && addonState == publics.addonStateEnum.deactivated)
                  {
                    addonTree.view.setCellValue(counterVar, column, boolValue);
                  }
                  else if(!privates.extensions[counterVar].isDeactivated && privates.extensions[counterVar].isRestartless && addonState == publics.addonStateEnum.activatedRestartless)
                  {
                     addonTree.view.setCellValue(counterVar, column, boolValue);
                  }
                  else if(privates.extensions[counterVar].isDeactivated && privates.extensions[counterVar].isRestartless && addonState == publics.addonStateEnum.deactivatedRestartless)
                  {
                     addonTree.view.setCellValue(counterVar, column, boolValue);
                  }
            }

            if(checkAll)
            {
               checkAllActivated.disabled = boolValue;
               checkAllDeactivated.disabled = boolValue;
               checkAllActivatedRestartless.disabled = boolValue;
               checkAllDeactivatedRestartless.disabled = boolValue;

               checkAllActivated.checked = false;
               checkAllDeactivated.checked = false;
               checkAllActivatedRestartless.checked = false;
               checkAllDeactivatedRestartless.checked = false;

               imageControl.src = picture;
            }

            for(var i = 0; i < rows; i++)
            {
               if(checkAll)
               {
                  addonTree.view.setCellValue(i, column, boolValue);
               }
               else
               {
                  actionCounter(i);
               }
            }
         },

         stdAddonAction: function(activateAddon)
         {
            var addonTree = document.getElementById("addonTree");
            var rows = addonTree.view.rowCount;
            var prefs = privates.Cc["@mozilla.org/preferences-service;1"].getService(privates.Ci.nsIPrefService)
                                           .getBranch("extensions.multiple-addon-deactivator.ChrisLE@mozilla.org.");
            var prefValue = prefs.getBoolPref("excludeMAD");

            var actionCounter = function(counterVar)
            {
               AddonManager.getAddonByID(privates.extensions[counterVar].addonId, function(addon)
               {
                  if(activateAddon === null)
                  {
                     if(privates.toBool((addonTree.view.getCellValue(counterVar, addonTree.view.selection.tree.columns[0]))))
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

            for(var i = 0; i < rows; i++)
            {
               actionCounter(i);
            }
         }
      };

      var publics = {
         addonActionEnum: {
            deactivateAll: 0,
            activateAll: 1,
            actionForMarkedEntry: 2
         },

         addonStateEnum: {
            activated: 0,
            deactivated: 1,
            activatedRestartless: 2,
            deactivatedRestartless: 3
         },

         init: function(callback)
         {
            Components.utils.import("resource://gre/modules/AddonManager.jsm");

            Application.getExtensions(function(addons)
            {
               privates.extensionCounter.allAddons = addons.all.length;
               var counter = 0;

               for(var addon in addons.all)
               {
                  AddonManager.getAddonByID(addons.all[addon].id, function(addonObj)
                  {
                     if(!addonObj.userDisabled)
                     {
                        privates.extensionCounter.activatedAddons++;
                     }
                     else if(addonObj.appDisabled)
                     {
                        privates.extensionCounter.incompatibleAddons++;
                     }
                     else
                     {
                        privates.extensionCounter.deactivatedAddons++;
                     }

                     if(!addonObj.operationsRequiringRestart)
                     {
                        privates.extensionCounter.restartlessAddons++;
                     }

                     callback(addonObj, ++counter);
                  });
               }
            });
         },

         fillExtensionArr: function(controlObj, addon, counter)
         {
            //privates.addonGrid = controlObj.addonTree; // TODO: use a private variable to set it with document.getElementById("addonTree");
            controlObj.activatedAddons.value = privates.extensionCounter.activatedAddons;
            controlObj.deactivatedAddons.value = privates.extensionCounter.deactivatedAddons;
            controlObj.incompatibleAddons.value = privates.extensionCounter.incompatibleAddons;
            controlObj.totalAddons.value = privates.extensionCounter.allAddons;
            controlObj.restartlessAddons.value = privates.extensionCounter.restartlessAddons;

            privates.extensions.push({
               addonId: addon.id,
               addonName: addon.name,
               addonVersion: addon.version,
               addonIcon: addon.iconURL,
               isSelected: false,
               isDeactivated: addon.userDisabled,
               isIncompatible: addon.appDisabled,
               isRestartless: !addon.operationsRequiringRestart
            });

            privates.extensions.sort(privates.sortFunc);

            if(counter == controlObj.totalAddons.value)
            {
               privates.fillTreeView(privates.extensions);
            }
         },

         sort: function(column)
         {
            var columnName;
            var addonTree = document.getElementById("addonTree"); // TODO: use a private variable to set it with document.getElementById("addonTree");
            privates.order = addonTree.getAttribute("sortDirection") === "ascending" ? 1 : -1;

            //if the column is passed and it's already sorted by that column, reverse sort
            if(column)
            {
               columnName = column.id;
               privates.order *= (addonTree.getAttribute("sortResource") === columnName) ? -1 : null;
            }
            else
            {
               columnName = addonTree.getAttribute("sortResource");
            }

            privates.extensions.sort(privates.sortFunc);
            // Setting these will make the sort option persist.
            addonTree.setAttribute("sortDirection", privates.order === 1 ? "ascending" : "descending");
            addonTree.setAttribute("sortResource", columnName);

            // Set the appropriate attributes to show to indicator.
            var cols = addonTree.getElementsByTagName("treecol");
            var colLength = cols.length;

            for(var i = 0; i < colLength; i++)
            {
               cols[i].removeAttribute("sortDirection");
            }

            document.getElementById(columnName).setAttribute("sortDirection", privates.order === 1 ? "ascending" : "descending");
         },

         onRowClick: function()
         {
            var addonTree = document.getElementById("addonTree");
            var cellVal = !privates.toBool((addonTree.view.getCellValue(addonTree.view.selection.currentIndex, addonTree.view.selection.tree.columns[0])));

            addonTree.view.setCellValue(addonTree.view.selection.currentIndex, addonTree.view.selection.tree.columns[0], cellVal);
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

         checkAddons: function(addonState)
         {
            var imageControl = document.getElementById("checkAll");

            if(addonState === publics.addonStateEnum.activated)
            {
               privates.checkAll(imageControl, document.getElementById("checkAllActivated").checked, null,
                                           document.getElementById("addonTree").view.selection.tree.columns[0], false, addonState);
            }
            else if(addonState === publics.addonStateEnum.deactivated)
            {
               privates.checkAll(imageControl, document.getElementById("checkAllDeactivated").checked, null,
                                           document.getElementById("addonTree").view.selection.tree.columns[0], false, addonState);
            }
            else if(addonState === publics.addonStateEnum.activatedRestartless)
            {
               privates.checkAll(imageControl, document.getElementById("checkAllActivatedRestartless").checked, null,
                                           document.getElementById("addonTree").view.selection.tree.columns[0], false, addonState);
            }
            else if(addonState === publics.addonStateEnum.deactivatedRestartless)
            {
               privates.checkAll(imageControl, document.getElementById("checkAllDeactivatedRestartless").checked, null,
                                           document.getElementById("addonTree").view.selection.tree.columns[0], false, addonState);
            }
         },

         restartFirefox: function()
         {
            if(window.confirm(privates.propertyStrings.getString("restartFirefoxMessage")))
            {
               const nsIAppStartup = privates.Ci.nsIAppStartup;

               // Notify all windows that an application quit has been requested.
               var os = privates.Cc["@mozilla.org/observer-service;1"].getService(privates.Ci.nsIObserverService);
               var cancelQuit = privates.Cc["@mozilla.org/supports-PRBool;1"].createInstance(privates.Ci.nsISupportsPRBool);

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

               privates.Cc["@mozilla.org/toolkit/app-startup;1"].getService(nsIAppStartup).quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);
            }
         },

         uninit: function()
         {
            document.getElementById("addonTree").view = null; // TODO: use a private variable to set it with document.getElementById("addonTree");
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
      incompatibleAddons: document.getElementById("incompatibleAddons"),
      totalAddons: document.getElementById("totalAddons"),
      restartlessAddons: document.getElementById("restartlessAddons")
      //addonTree: document.getElementById("addonTree") // TODO: use a private variable to set it with document.getElementById("addonTree");
   };

   madExt.init(function(addonObj, counterVar)
   {
      madExt.fillExtensionArr(controls, addonObj, counterVar);
   });

   document.getElementById("addonName").onclick = function()
   {
      madExt.sort(this);
   };

   document.getElementById("treechildren").onclick = madExt.onRowClick;
};