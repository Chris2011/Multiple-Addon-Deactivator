(function()
{
   "use strict";

   var madExt = function()
   {
      var privates = {
         Cc: Components.classes,
         Ci: Components.interfaces,
         propertyStrings: document.getElementById("string-bundle"),
         ext: {
            groups: [
               ["Web", true, false],
               ["Security", true, false],
               ["Video", true, false]
            ],
            childData: [{
                  groupName: "Web",
                  addonId: "&4Xc5fv67bn(",
                  addonName: "Firebug",
                  addonVersion: "12",
                  addonIcon: "icon.png",
                  isSelected: false,
                  isDeactivated: false,
                  isIncompatible: false,
                  isRestartless: false
               }, {
                  groupName: "Security",
                  addonId: "etzuj45feg",
                  addonName: "Acunetix",
                  addonVersion: "2",
                  addonIcon: "icon.png",
                  isSelected: false,
                  isDeactivated: false,
                  isIncompatible: false,
                  isRestartless: false
               }]
         },
         toBool: function(boolParam)
         {
            return "true" === boolParam;
         },
         checkAll: function(imageControl, boolValue, picture, column, checkAll, addonState)
         {
            var addonTree = document.getElementById("addonTree"),
            checkAllActivated = document.getElementById("checkAllActivated"),
            checkAllDeactivated = document.getElementById("checkAllDeactivated"),
            checkAllActivatedRestartless = document.getElementById("checkAllActivatedRestartless"),
            checkAllDeactivatedRestartless = document.getElementById("checkAllDeactivatedRestartless"),
            rows = addonTree.view.rowCount,
            actionCounter = function(counterVar)
            {
               if(!privates.extensions[counterVar].isDeactivated && addonState === publics.addonStateEnum.activated)
               // TODO: Prüfen.
               // if(!privates.extensions[counterVar].isDeactivated && addonState == publics.addonStateEnum.activated)
               {
                  addonTree.view.setCellValue(counterVar, column, boolValue);
               }
               else if(privates.extensions[counterVar].isDeactivated &&
               addonState === publics.addonStateEnum.deactivated)
               // TODO: Prüfen.
               // else if(privates.extensions[counterVar].isDeactivated && addonState == publics.addonStateEnum.deactivated)
               {
                  addonTree.view.setCellValue(counterVar, column, boolValue);
               }
               else if(!privates.extensions[counterVar].isDeactivated &&
               privates.extensions[counterVar].isRestartless &&
               addonState === publics.addonStateEnum.activatedRestartless)
               // TODO: Prüfen.
               //  else if(!privates.extensions[counterVar].isDeactivated && privates.extensions[counterVar].isRestartless && addonState == publics.addonStateEnum.activatedRestartless)
               {
                  addonTree.view.setCellValue(counterVar, column, boolValue);
               }
               else if(privates.extensions[counterVar].isDeactivated && privates.extensions[counterVar].isRestartless
               && addonState === publics.addonStateEnum.deactivatedRestartless)
               // TODO: Prüfen.
               // else if(privates.extensions[counterVar].isDeactivated && privates.extensions[counterVar].isRestartless && addonState == publics.addonStateEnum.deactivatedRestartless)
               {
                  addonTree.view.setCellValue(counterVar, column, boolValue);
               }
            };

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
            var addonTree = document.getElementById("addonTree"),
            rows = addonTree.view.rowCount,
            prefs = privates.Cc["@mozilla.org/preferences-service;1"].getService(privates.Ci.nsIPrefService)
            .getBranch("extensions.multiple-addon-deactivator.ChrisLE@mozilla.org."),
            prefValue = prefs.getBoolPref("excludeMAD"),
            actionCounter = function(counterVar)
            {
               AddonManager.getAddonByID(privates.extensions[counterVar].addonId, function(addon)
               {
                  if(activateAddon === null)
                  {
                     if(privates.toBool((addonTree.view.getCellValue(counterVar,
                     addonTree.view.selection.tree.columns[0]))))
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
            };

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
         onRowClick: function()
         {
            var addonTree = document.getElementById("addonTree"),
            cellVal = !privates.toBool((addonTree.view.getCellValue(addonTree.view.selection.currentIndex,
            addonTree.view.selection.tree.columns[0])));

            addonTree.view.setCellValue(addonTree.view.selection.currentIndex,
            addonTree.view.selection.tree.columns[0], cellVal);
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

               // Notify all windows that an application quit has been requested.
               var nsIAppStartup = privates.Ci.nsIAppStartup,
               os = privates.Cc["@mozilla.org/observer-service;1"].getService(privates.Ci.nsIObserverService),
               cancelQuit = privates.Cc["@mozilla.org/supports-PRBool;1"].createInstance(
               privates.Ci.nsISupportsPRBool);

               os.notifyObservers(cancelQuit, "quit-application-requested", null);

               // Something aborted the quit process.
               if(cancelQuit.data)
               {
                  return;
               }

               // Notify all windows that an application quit has been granted.
               os.notifyObservers(null, "quit-application-granted", null);

               // Enumerate all windows and call shutdown handlers.
               var wm = privates.Cc["@mozilla.org/appshell/window-mediator;1"].getService(
               privates.Ci.nsIWindowMediator),
               windows = wm.getEnumerator(null);
               while(windows.hasMoreElements())
               {
                  var win = windows.getNext();
                  if(("tryToClose" in win) && !win.tryToClose())
                  {
                     return;
                  }
               }

               privates.Cc["@mozilla.org/toolkit/app-startup;1"].getService(nsIAppStartup).quit(nsIAppStartup.eRestart
               | nsIAppStartup.eAttemptQuit);
            }
         },
         uninit: function()
         {
            document.getElementById("addonTree").view = null;
         }
      };

      return publics;
   };

   window.madExt = madExt();
}());

window.onload = function()
{
   madManagement.init(true);

   document.getElementById("addonName").onclick = function()
   {
      madManagement.sort(this);
   };

   document.getElementById("treechildren").onclick = madExt.onRowClick;
};