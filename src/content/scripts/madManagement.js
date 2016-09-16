(function()
{
   "use strict";

   var madManagement = function()
   {
      Components.utils.import("resource://gre/modules/Sqlite.jsm");

      var privates = {
         Cc: Components.classes,
         Ci: Components.interfaces,
         //dbFile: FileUtils.getFile("MadDB", ["database/MadDb.sqlite"]),
         extensions: [],
         extensionCounter: {
            allAddons: 0,
            activatedAddons: 0,
            deactivatedAddons: 0,
            incompatibleAddons: 0,
            restartlessAddons: 0
         },
         fillTreeView: function()
         {
            var treeView = {
               rowCount: privates.extensions.length,
               getCellText: function(row, column)
               {
                  return (column.id === "addonName") ? "  " + privates.extensions[row].addonName : "  "
                  + privates.extensions[row].addonVersion;
               },
               getCellValue: function(row, column)
               {
                  var returnValue = null;
                  if(column.id === "checkboxes")
                  {
                     returnValue = privates.extensions[row].isSelected;
                  }

                  return returnValue;
               },
               setTree: function(){
               },
               isContainer: function(){
               },
               isSeparator: function(){
               },
               isSorted: function(){
               },
               isEditable: function(){
               },
               getLevel: function(){
               },
               getImageSrc: function(row, column)
               {
                  var addonIcon = '';

                  if(column.id === "addonName")
                  {
                     if(privates.extensions[row].addonIcon)
                     {
                        addonIcon = privates.extensions[row].addonIcon;
                     }
                     else
                     {
                        addonIcon = "chrome://{appname}/skin/images/defaultIcon.png";
                     }
                  }

                  if(column.id === "addonVersion")
                  {
                     if(privates.extensions[row].isRestartless)
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
               getColumnProperties: function(){
               },
               cycleCell: function(){
               },
               cycleHeader: function(column)
               {
//                  if(column.id === "checkboxes")
//                  {
//                     var headerImage = document.getElementById("checkAll");
//                     var imagePath = "../skin/images/";
//
//                     if(headerImage.src === imagePath + "unselected.png")
//                     {
//                        privates.checkAll(headerImage, true, imagePath + "selected.png", column, true, null);
//                     }
//                     else
//                     {
//                        privates.checkAll(headerImage, false, imagePath + "unselected.png", column, true, null);
//                     }
//                  }
               },
               setCellValue: function(row, column, cellValue)
               {
                  if(!privates.extensions[row].isIncompatible)
                  {
                     if(column.id === "checkboxes")
                     {
                        privates.extensions[row].isSelected = cellValue;
                     }
                  }
               },
               setCellText: function(){
               }
            },
            setNewStyle = function(props, status)
            {
               var atomService = privates.Cc["@mozilla.org/atom-service;1"].getService(privates.Ci.nsIAtomService),
               style = null;

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
            },
            setStyle = function(row, props)
            {
               if(privates.extensions[row].isDeactivated)
               {
                  setNewStyle(props, "deactivated");
               }
               else
               {
                  setNewStyle(props, "activated");
               }

               if(privates.extensions[row].isIncompatible)
               {
                  setNewStyle(props, "incompatible");
               }
            };

            document.getElementById("addonTree").view = treeView;
         },
         order: 1,
         sortFunc: function(firstObj, nextObj)
         {
            var firstAddonName = firstObj.addonName.toLowerCase(),
            nextAddonName = nextObj.addonName.toLowerCase();

            if(firstAddonName < nextAddonName)
            {
               return -1 * privates.order;
            }

            if(firstAddonName > nextAddonName)
            {
               return 1 * privates.order;
            }

            return 0;
         }
      },
      publics = {
         db: {
            dbPath: "MadDb.sqlite",
            sharedMemoryCache: false,
            //dbConnection: Services.storage.openDatabase(privates.dbFile),
            getAddons: function()
            {

                        //            for(var row in result)
                        //            {
                        //               print(result[row].getResultByIndex(0));
                        //               print(result[row].length === 0 ? "Kann Daten in DB eintragen." : "Nee is schon was drin");
                        //            }
            },
            saveAddons: function()
            {
               try
               {
                  // Doesnt work.
//                  Task.spawn(function demoDatabase()
//                  {
//                     var connection = Sqlite.openConnection({path: "MadDb.sqlite"});
//
//                     try
//                     {
//                        var result = connection.execute("SELECT AddonId FROM Addon"); // Connection.execute is undefined.
//
//                        if(result.length === 0)
//                        {
//                           for(var i = 0, extLen = privates.extensions.length; i < extLen; i++)
//                           {
//                              connection.executeCached("INSERT INTO"+
//                                                          "Addon(AddonId, AddonGroupId)"+
//                                                       "VALUES"+
//                                                          "(:addonId, 1)", privates.extensions[i].addonId);
//                           }
//                        }
//                     }
//                     catch(e)
//                     {
//                       alert(e);
//                     }
//                   });


                  Sqlite.openConnection({
                     path: publics.db.dbPath,
                     sharedMemoryCache: publics.db.sharedMemoryCache
                  }).then(function onConnection(connection)
                  {
                     connection.execute("SELECT AddonId FROM Addon").then(function onStatementComplete(result)
                     {
                        if(result.length === 0)
                        {
                           for(var i = 0, extLen = privates.extensions.length; i < extLen; i++)
                           {
                              connection.executeCached("INSERT INTO"+
                                                          "Addon(AddonId, AddonGroupId)"+
                                                       "VALUES"+
                                                          "(:addonId, 1)", privates.extensions[i].addonId);
                           }
                        }
                     });

                     connection.close(function onClose()
                     {
                        alert("We are done!");
                     });
                  },
                  function onError(error)
                  {
                     alert(error);
                  });
               }
               catch(e)
               {
                  Components.utils.reportError(e); // report the error and continue execution
               }
            },
            deleteAddons: function()
            {
            }
         },
         init: function(isWindow)
         {
            Components.utils.import("resource://gre/modules/AddonManager.jsm");
            AddonManager.getAllAddons(function(addonArr)
            {
               var addonLength = addonArr.length,
               counter = 0,
               controls = {
                  activatedAddons: document.getElementById("activatedAddons"),
                  deactivatedAddons: document.getElementById("deactivatedAddons"),
                  incompatibleAddons: document.getElementById("incompatibleAddons"),
                  totalAddons: document.getElementById("totalAddons"),
                  restartlessAddons: document.getElementById("restartlessAddons")
               };

               for(var i = 0; i < addonLength; i++)
               {
                  // TODO: Theme and plugin support maybe later.
                  if(addonArr[i].type === "extension") // i = 3
                  {
                     if(addonArr[i].isActive)
                     {
                        privates.extensionCounter.activatedAddons++;
                     }
                     else if(addonArr[i].appDisabled)
                     {
                        privates.extensionCounter.incompatibleAddons++;
                     }
                     else
                     {
                        privates.extensionCounter.deactivatedAddons++;
                     }

                     if(!addonArr[i].operationsRequiringRestart)
                     {
                        privates.extensionCounter.restartlessAddons++;
                     }

                     privates.extensions.push({
                        addonId: addonArr[i].id,
                        addonName: addonArr[i].name,
                        addonVersion: addonArr[i].version,
                        addonIcon: addonArr[i].iconURL,
                        isSelected: false,
                        isDeactivated: !addonArr[i].isActive,
                        isIncompatible: addonArr[i].appDisabled,
                        isRestartless: !addonArr[i].operationsRequiringRestart
                     });

                     ++counter;
                  }
               }

               privates.extensions.sort(privates.sortFunc);

               if(isWindow)
               {
                  controls.activatedAddons.value = privates.extensionCounter.activatedAddons;
                  controls.deactivatedAddons.value = privates.extensionCounter.deactivatedAddons;
                  controls.incompatibleAddons.value = privates.extensionCounter.incompatibleAddons;
                  controls.totalAddons.value = counter;
                  controls.restartlessAddons.value = privates.extensionCounter.restartlessAddons;

                  privates.fillTreeView();
               }
               else
               {
                  publics.db.saveAddons();
               }
            });
         },
         sort: function(column)
         {
            var columnName,
            addonTree = document.getElementById("addonTree");
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
            var cols = document.getElementsByTagName("treecol");
            var colLength = cols.length;

            for(var i = 0; i < colLength; i++)
            {
               cols[i].removeAttribute("sortDirection");
            }

            document.getElementById(columnName).setAttribute("sortDirection", privates.order === 1 ? "ascending"
            : "descending");
         }
      };

      return publics;
   };

   window.madManagement = madManagement();
}());