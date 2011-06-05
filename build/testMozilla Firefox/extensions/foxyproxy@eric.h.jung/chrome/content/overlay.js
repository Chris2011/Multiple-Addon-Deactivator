/**
  FoxyProxy
  Copyright (C) 2006-2010 Eric H. Jung and LeahScape, Inc.
  http://getfoxyproxy.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/gpl.txt
**/

var foxyproxy = {
  fp : Components.classes["@leahscape.org/foxyproxy/service;1"].getService().wrappedJSObject,
  fpc : Components.classes["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject,
  statusText : null,
  notes: ["foxyproxy-statusbar-icon","foxyproxy-statusbar-text","foxyproxy-statusbar-width","foxyproxy-toolsmenu",
    "foxyproxy-contextmenu","foxyproxy-mode-change","foxyproxy-throb","foxyproxy-updateviews","foxyproxy-autoadd-toggle"],

  alert : function(wnd, str) {
    Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService)
      .alert(wnd?wnd:null, this.fp.getMessage("foxyproxy"), str);
  },

  // thanks, mzz
  updateCheck : {
    timer : null,
    first : false,
    usingObserver : true,
    check : function() {
      const CC = Components.classes, CI = Components.interfaces;
      var vc = CC["@mozilla.org/xpcom/version-comparator;1"].getService(CI.nsIVersionComparator),
        lastVer, curVer = CC["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject.getVersion();
      try {
        lastVer = foxyproxy.fp.getPrefsService("extensions.foxyproxy.").getCharPref("last-version");
        if (vc.compare(curVer, lastVer) > 0)
          p(this);
      }
      catch(e) {
        this.first = true;
        p(this);
      }
      function p(o) {
        var appInfo = CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULAppInfo);
        if(vc.compare(appInfo.version, "3.0") < 0) {
          // sessionstore-windows-restored notification not supported; just do it now
          o.usingObserver = false;
          o.installTimer();
        }
        else
          CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService)
             .addObserver(o, "sessionstore-windows-restored", false);
      }
    },

    notify : function() {
      if (this.usingObserver)
        Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
          .removeObserver(this, "sessionstore-windows-restored");

      // Probably not necessary, but does not hurt
      this.timer = null;
      var fpc = Components.classes["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject;
      if (this.first)
        x(foxyproxy.fp.isFoxyProxySimple() ? "http://getfoxyproxy.org/basic/help.html" : "http://getfoxyproxy.org/help.html");
      else
        x(foxyproxy.fp.isFoxyProxySimple() ? "http://getfoxyproxy.org/basic/releasenotes.html" :
          "http://getfoxyproxy.org/releasenotes.html");      
      function x(url) {
        fpc.openAndReuseOneTabPerURL(url);
        // Do this last so we try again next time if we failed to display now
        foxyproxy.fp.getPrefsService("extensions.foxyproxy.").setCharPref("last-version", fpc.getVersion());
      }
    },

    observe : function(s, topic) {
      if (topic == "sessionstore-windows-restored") {
        // If we show the tab now, the tab isn't guaranteed to be topmost
        // (in Firefox 3.0b5). So use a timer.
        this.installTimer();
      }
    },

    installTimer : function() {
      this.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
      this.timer.initWithCallback(this, 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    }
  },
  
  observe: function(subj, topic, str) {
    var e;
    try {
      e = subj.QueryInterface(Components.interfaces.nsISupportsPRBool).data;
    }
    catch(e) {}
    switch (topic) {
      case "foxyproxy-throb":
        this.svgIcons.throb(subj);
        break;
      case "foxyproxy-statusbar-icon":
        this.toggleStatusBarIcon(e);
        break;
      case "foxyproxy-statusbar-text":
        this.toggleStatusBarText(e);
        break;
      case "foxyproxy-statusbar-width":
        this.toggleStatusBarWidth(e);
        break;
      case "foxyproxy-autoadd-toggle":
        this.checkPageLoad();
        break;
      case "foxyproxy-mode-change":
        this.setMode(str);
        this.checkPageLoad();
        break;
      case "foxyproxy-toolsmenu":
        this.toggleToolsMenu(e);
        break;
      case "foxyproxy-contextmenu":
        this.toggleContextMenu(e);
        break;
      case "foxyproxy-updateviews":
        this.updateViews(false, false);
        break;
    }
  },
  
  findToolbarIcon : function() {
    if (typeof(gNavToolbox) == "undefined")
      return; /* We're on Tbird or another platform which doesn't have this */
    var toolbox = gNavToolbox ? gNavToolbox.customizeChange /* 3.5+ */ : getNavToolbox().customizeChange /* 3.0.x */;
    /* Save the original function, prefixed with our name in case other addons are doing the same thing */
    getNavToolbox().foxyproxyCustomizeChange = getNavToolbox().customizeChange;
    /* Overwrite the property with our function */
    getNavToolbox().customizeChange = function() {
      /* Our toolbar icon was added or removed to/from the toolbar. Recalc the svgicon arrays */
      foxyproxy.svgIcons.init();
      if (document.getElementById("fp-toolbar-icon-3")) {
        /* Our toolbar icon was added. Apply the proper icon coloring to the toolbar icon by setting the mode again */
        foxyproxy.setMode(foxyproxy.fp.mode);
      }
      /* Call the original function. note that |this| is getNavToolbox(), not foxyproxy */
      this.foxyproxyCustomizeChange();
    }    
  },

  onLoad : function() {
    this.svgIcons.init();
    this.statusText = document.getElementById("foxyproxy-status-text");
    setTimeout(this.findToolbarIcon, 100);
    
    var obSvc = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    for (var i in this.notes) {
      obSvc.addObserver(this, this.notes[i], false);
    }
    this.toggleToolsMenu(this.fp.toolsMenu);
    this.toggleContextMenu(this.fp.contextMenu);
    this.checkPageLoad();
    this.toggleStatusBarIcon(this.fp.statusbar.iconEnabled);
    this.toggleStatusBarText(this.fp.statusbar.textEnabled);    
    this.toggleStatusBarWidth(this.fp.statusbar.width);
    this.setMode(this.fp.mode);
    this.updateCheck.check();
    // if os/x add label to FoxyProxy Tools menu.
    if (Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS == "Darwin") {
/*! begin-foxyproxy-simple
      document.getElementById("foxyproxyMenu").setAttribute("label", this.fp.getMessage("foxyproxy.basic.label"));
end-foxyproxy-simple !*/

/*! begin-foxyproxy-standard !*/
      document.getElementById("foxyproxyMenu").setAttribute("label", this.fp.getMessage("foxyproxy.standard.label"));
/*! end-foxyproxy-standard !*/
    }
  },

  toggleToolsMenu : function(e) {
    document.getElementById("foxyproxyMenu").hidden = !e;
  },

  toggleContextMenu : function(e) {
    document.getElementById("foxyproxy-contextmenu-icon").hidden = !e;
  },
  
  torWizard : function() {
    var owner = foxyproxy._getOptionsDlg(),
      withoutPrivoxy = this.ask(owner,
      this.fp.getMessage("torwiz.with.without.privoxy"),
      this.fp.getMessage("torwiz.without"),
      this.fp.getMessage("torwiz.with"));
    var input = {value:withoutPrivoxy?"9050":"8118"};
    var ok, title = this.fp.getMessage("foxyproxy"),
      portMsg = this.fp.getMessage("torwiz.port", [this.fp.getMessage(withoutPrivoxy?"tor":"privoxy")]);
    do {
      ok = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
        .getService(Components.interfaces.nsIPromptService)
        .prompt(owner, title, portMsg, input, null, {});
      if (ok) {
        if (isNaN(input.value) || input.value == "") {
          foxyproxy.alert(owner, this.fp.getMessage("torwiz.nan"));
          ok = false;
        }
      }
      else
        break;
    } while (!ok);
    if (ok) {
      // Prompt use about proxying DNS queries, but only if another proxy
      // isn't already set for that
      var p = Components.classes["@leahscape.org/foxyproxy/proxy;1"]
        .createInstance(Components.interfaces.nsISupports).wrappedJSObject;
      p.name = this.fp.getMessage("tor");
      p.notes = this.fp.getMessage("torwiz.proxy.notes");
      p.proxyDNS = true;
      var match = Components.classes["@leahscape.org/foxyproxy/match;1"]
        .createInstance(Components.interfaces.nsISupports).wrappedJSObject;
      match.name = this.fp.getMessage("torwiz.google.mail");
      match.pattern = this.fp.getMessage("torwiz.pattern");
      p.matches.push(match);        
      p.mode = "manual";
      if (withoutPrivoxy) {
        p.manualconf.host="127.0.0.1";
        p.manualconf.port=9050;
        p.manualconf.isSocks=true;
      }
      else {
        p.manualconf.host="127.0.0.1";
        p.manualconf.port=8118;
        p.manualconf.isSocks=false;
      }
      p.manualconf.socksversion=5;
      p.autoconf.url = "";
      
      // Open the patterns dialog only if FP Standard
      if (this.fp.isFoxyProxySimple()) {
        p.selectedTabIndex = 1;
        _congrats(p);
      }
      else {
        p.selectedTabIndex = 2;
        var params = {inn:{isNew:true, proxy:p, torwiz:true}, out:null}, win = owner?owner:window;
        win.openDialog("chrome://foxyproxy/content/addeditproxy.xul", "",
          "chrome,dialog,modal,resizable=yes,center", params).focus();
        if (params.out)
          _congrats(params.out.proxy);
        else
          ok = false;
      }
    }
    !ok && foxyproxy.alert(owner, this.fp.getMessage("torwiz.cancelled"));
    function _congrats(p) {
      foxyproxy.fp.proxies.push(p);
      foxyproxy.updateViews(true);
      foxyproxy.alert(owner, foxyproxy.fp.getMessage("torwiz.congratulations"));
    }
  },

  /**
   * Open or focus the main window/dialog
   */
  onOptionsDialog : function() {
    this.onDialog("foxyproxy-options", "chrome://foxyproxy/content/options.xul", null, null, "foxyproxy-superadd");
  },

  onDialog : function(id, xulFile, args, parms, idToClose) {
    // If there's a window/dialog already open, just focus it and return.
    var wnd = foxyproxy.findWindow(id);
    if (wnd) {
      try {
        wnd.focus();
      }
      catch (e) {
        // nsIFilePicker dialog is open. Best we can do is flash the window.
        wnd.getAttentionWithCycleCount(4);
      }
    }
    else {
      if (idToClose) {
        var wnd = foxyproxy.findWindow(idToClose); // close competing dialog to minimize synchronization issues between the two
        wnd && wnd.close();
      }
      window.openDialog(xulFile, "", "minimizable,dialog,chrome,resizable=yes" + (args?(","+args):""), parms).focus();
    }
  },

  onQuickAddDialog : function(evt) {
  if (this.fp.mode != "disabled") {
      if (!this.fp.quickadd.enabled) {
        this.fp.notifier.alert(this.fp.getMessage("foxyproxy"), this.fp.getMessage("quickadd.disabled"));
        return;
      }
      if (!evt.view || !evt.view.content || !evt.view.content.document || !evt.view.content.document.location) {
        this.fp.notifier.alert(this.fp.getMessage("foxyproxy"), this.fp.getMessage("quickadd.nourl"));
        return;
      }
    this.fp.quickadd.onQuickAdd(window, evt.view.content.document);
    }
  },

  onPageLoad : function(evt) {
    var doc = evt.originalTarget; // doc is document that triggered "onload" event
    if (doc && doc.location)
      foxyproxy.fp.autoadd.onAutoAdd(window, doc); // can't use |this.fp| because this isn't |foxyproxy|
  },
  
  updateViews : function(writeSettings, updateLogView) {
    // Update view if it's open
    var optionsDlg = foxyproxy._getOptionsDlg();
    optionsDlg && optionsDlg._updateView(false, updateLogView); // don't write settings here because optionsDlg mayn't be open
    writeSettings && this.fp.writeSettings();
  },

  _getOptionsDlg : function() {
    return Components.classes["@mozilla.org/appshell/window-mediator;1"]
      .getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("foxyproxy-options");
  },

  /**
   * Find and return the dialog/window if it's open (or null if it's not)
   */
  findWindow : function(id) {
    // Same as _getOptionsDlg() but we need a windowManager for later
    var windowManager =
      Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
    var win0 =
      windowManager.getMostRecentWindow(id);

    if (win0) {
      var enumerator = windowManager.getEnumerator(null);
      while (enumerator.hasMoreElements()) {
        var win1 = enumerator.getNext();
        var winID = win1.document.documentElement.id;
        if (winID == "commonDialog" && win1.opener == win0)
          return win1;
      }
      return win0;
    }
    return null;
  },

  /**
   * Function for displaying dialog box with yes/no buttons (not OK/Cancel buttons),
   * or any arbitrary button labels. If btn1Text or btn2Text is null, yes/no values are assumed for them.
   * btn3Text can be null, in which case no 3rd button is displayed.
   * Return values: if btn3Text isn't specified, then true/false is returned
   * corresponding to whether yes (or btn1Text), 1 == no (or btn2Text) was clicked.
   * if btn3Text is specified, return value is 0, 1, or 2 of the clicked button. Specifically:
   * 0 == yes (or btn1Text), 1 == no (or btn2Text), 2 == btn3Text.
   */
  ask : function(parent, text, btn1Text, btn2Text, btn3Text) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService);
    !btn1Text && (btn1Text = this.fp.getMessage("yes"));
    !btn2Text && (btn2Text = this.fp.getMessage("no"));
    if (btn3Text == null)
      return prompts.confirmEx(parent, this.fp.getMessage("foxyproxy"), text,
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_0 +
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1,
      btn1Text, btn2Text, null, null, {}) == 0; // 0 means first button ("yes") was pressed
    else { 
      // No longer displays in proper order and no longer returns proper values on FF 3.0.x. (and maybe above?)
      // Insists that 2nd displayed button (1-index) is BUTTON_POS_2 (0-indexed)
      /*var ret = prompts.confirmEx(parent, this.fp.getMessage("foxyproxy"), text,
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_0 +
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1 +
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_2,
        btn1Text, btn2Text, btn3Text, null, {});*/
      var p = {inn:{title: text, btn1Text: btn1Text, btn2Text: btn2Text, btn3Text: btn3Text}, out:null},
        w = parent.openDialog ? parent : window;
      w.openDialog("chrome://foxyproxy/content/triquestion.xul", "",
        "chrome, dialog, modal, resizable=yes, centerscreen=yes", p).focus();
      return p.out ? p.out.value : null;
    }
  },

  checkPageLoad : function() {
    var listen = this.fp.mode != "disabled" && this.fp.autoadd.enabled;
    var appcontent = document.getElementById("appcontent");
    if (appcontent) {
      appcontent.removeEventListener("load", this.onPageLoad, true); // safety
      if (listen) {
        appcontent.addEventListener("load", this.onPageLoad, true);
      }
      else {
        appcontent.removeEventListener("load", this.onPageLoad, true);
      }
    }
  },
    

  ///////////////// icons \\\\\\\\\\\\\\\\\\\\\
  svgIcons : {
    
    angle : 4,
    runners : 0,
    icons : null,
    iconColorNodes : null,
    iconDisabledMask : null,
    
    init : function() {
      this.icons = [document.getElementById("fp-statusbar-icon-wrapper"),
        document.getElementById("fp-contextmenu-icon-wrapper"), document.getElementById("fp-toolsmenu-icon-wrapper")];
      
      if (document.getElementById("fp-toolbar-icon-wrapper")) { /* null if user isn't using our toolbar icon */
        this.icons.push(document.getElementById("fp-toolbar-icon-wrapper"));
      }
      
      this.iconColorNodes = [document.getElementById("fp-statusbar-icon-3"),        
        document.getElementById("fp-contextmenu-icon-3"), document.getElementById("fp-toolsmenu-icon-3")];
      
      if (document.getElementById("fp-toolbar-icon-3")) /* null if user isn't using our toolbar icon */
        this.iconColorNodes.push(document.getElementById("fp-toolbar-icon-3"));

      this.iconDisabledMask = [document.getElementById("fp-statusbar-disabled-wrapper"),        
        document.getElementById("fp-contextmenu-disabled-wrapper"), document.getElementById("fp-toolsmenu-disabled-wrapper")];
      
      if (document.getElementById("fp-toolbar-disabled-wrapper")) /* null if user isn't using our toolbar icon */
        this.iconDisabledMask.push(document.getElementById("fp-toolbar-disabled-wrapper"));
    },
    
    animate : function() {
      if (this.runners > 8) return; // reached the max spin rate
      this.runners++;
      this.animate_runner();
    },

    animate_runner : function() {
      for (var i in this.icons)
        this.icons[i].setAttribute("transform", "rotate("+(this.angle/2)+", 8, 8)");
      this.angle += 6;
      if (this.angle > 720) {
        this.angle = 4;
        for (var i in this.icons)
          this.icons[i].setAttribute("transform", "rotate(0, 8, 8)");
        this.runners--;
        if (this.runners == 0) {
          var modeAsText = foxyproxy.getModeAsText(foxyproxy.fp.mode);
          foxyproxy.setStatusText(modeAsText);          
          foxyproxy.fp.resetIconColors && this.resetIconColors(modeAsText);
        }
        return;
      }
      window.setTimeout("foxyproxy.svgIcons.animate_runner()", 10);
    },

    throb : function(mp) {
      for (var i in this.iconColorNodes)
        this.iconColorNodes[i].setAttribute("style", "fill: "+mp.wrappedJSObject.color+";");
      foxyproxy.statusText.setAttribute("style", "color: "+mp.wrappedJSObject.color+";");    
      if (mp.wrappedJSObject.animatedIcons)
        this.animate();
      foxyproxy.setStatusText(mp.wrappedJSObject.name);
      setTimeout(this.unthrob, 800, mp);
    },
    
    resetIconColors : function(modeAsText) {
      // Reset the icon color back to what it should be
      if (modeAsText != "static") {
        for (var i in this.iconColorNodes) {
          this.iconColorNodes[i].removeAttribute("style");
          this.iconColorNodes[i].setAttribute("mode", modeAsText);
        }
        foxyproxy.statusText.removeAttribute("style");
        foxyproxy.statusText.setAttribute("mode", modeAsText);            
      }
    },

    unthrob : function(mp) {
      if (!mp.wrappedJSObject.animatedIcons) {
        var modeAsText = foxyproxy.getModeAsText(foxyproxy.fp.mode);
        foxyproxy.setStatusText(modeAsText);
        foxyproxy.fp.resetIconColors && foxyproxy.svgIcons.resetIconColors(modeAsText);
      }
    },
    
    set color(c) {
      if (c)
        for (var i in this.icons) this.icons[i].setAttribute("style", "fill: " + c);
      else
        for (var i in this.icons) this.icons[i].removeAttribute("style");
    },
    
    set mode(m) {
      if (m == "static") {
        var color = foxyproxy.fp._selectedProxy.color;
        foxyproxy.statusText.setAttribute("style", "color: " + color);
        for (var i in this.iconColorNodes)
          this.iconColorNodes[i].setAttribute("style", "fill: "+color+";");        
      }
      else
        this.resetIconColors(m);
      
      for (var i in this.iconDisabledMask) {
        this.iconDisabledMask[i].removeAttribute("style");
        this.iconDisabledMask[i].setAttribute("mode", m);
      }
    }
  },
  
  toggleStatusBarIcon : function(e) {
    document.getElementById("foxyproxy-statusbar-icon").hidden = !e;
  },

  toggleStatusBarText : function(e) {
    var s=document.getElementById("foxyproxy-status-text");
    // Statusbars don't exist on all windows (e.g,. View Source) so check for existence first,
    // otherwise we get a JS error.
    s && (s.hidden = !e);
  },
  
  toggleStatusBarWidth : function(w) {
    var s=document.getElementById("foxyproxy-status-text");
    // Statusbars don't exist on all windows (e.g,. View Source) so check for existence first,
    // otherwise we get a JS error.
    if (!s) return;
    var w = this.fp.statusbar.width; 
    if (w > 0)
      s.width = w;
    else {
      s.width = "";
      // Work-around weird FF 2.0.x bug whereby statusbarpanel doesn't fit-to-size
      // when width is the empty string; hide then show the statusbarpanel.
      if (!s.hidden) {
        s.hidden = true;
        s.hidden = false;
      }     
    }    
  },

  // Set toolbar, statusbar, and context menu text and icon colors
  setMode : function(mode) {
    var m = this.getModeAsText(mode);
    this.svgIcons.mode = m;  
    this.setStatusText(m);
  },

  getModeAsText : function(mode) {
    return mode != "patterns" && mode != "disabled" && mode != "random" && mode != "roundrobin" ? "static" : mode;
  },

  setStatusText : function(m) {
    switch(m) {
      case "patterns":
        m = this.fp.getMessage("foxyproxy.tab.patterns.label");
        break;
      case "disabled":
        m = this.fp.getMessage("disabled");
        break;
      case "random":
        m = this.fp.getMessage("random");
        break;
      case "roundrobin":
        m = this.fp.getMessage("roundrobin");
        break;
      case "static":
        m = this.fp._selectedProxy.name;
    };
    this.statusText.setAttribute("label", this.fp.useStatusBarPrefix ?
        this.fp.getMessage("foxyproxy") + ": " + m :
          m);
  },
  
  ///////////////// utilities \\\\\\\\\\\\\\\
  onTreeClick : function(e, tree) {
    var row = {}, col = {};
    tree.treeBoxObject.getCellAt(e.clientX, e.clientY, row, col, {});
    row.value > -1 && col.value && col.value.type == Components.interfaces.nsITreeColumn.TYPE_CHECKBOX && tree.view.selection.select(row.value);
  },

  ///////////////// menu \\\\\\\\\\\\\\\\\\\\\
  _cmd : "foxyproxy.fp.setMode(event.target.id, true);foxyproxy.updateViews(true);",
  _popupShowing : 0,

  onSBTBClick : function(e, o) {
    e.preventDefault(); // required in Firefox 4 to prevent default context-menu from appearing
    if (e.button==0) {
      _act(o.leftClick, e);
    }
    else if (e.button==1) {
      _act(o.middleClick, e);
    }
    else if (e.button==2) {
      _act(o.rightClick, e);
    }
    function _act(x, e) {
      var fp=foxyproxy.fp;
      switch (x) {
        case "options":
          foxyproxy.onOptionsDialog();
          break;
        case "cycle":
          fp.cycleMode();
          break;
        case "contextmenu":
          this._popupShowing = 0;
          document.getElementById("foxyproxy-statusbar-popup").showPopup(e.target, -1, -1, "popup", "bottomleft", "topleft");
          break;
        case "reloadcurtab":
          gBrowser.reloadTab(gBrowser.mCurrentTab);
          break;
        case "reloadtabsinbrowser":
          gBrowser.reloadAllTabs();
          break;
        case "reloadtabsinallbrowsers":
          for (var b, e = this.fpc.getEnumerator();
                  e.hasMoreElements();
                  (b = e.getNext().getBrowser()) && b.reloadAllTabs());
          break;
        case "removeallcookies":
          Components.classes["@mozilla.org/cookiemanager;1"].
            getService(Components.interfaces.nsICookieManager).removeAll();
          fp.notifier.alert(fp.getMessage("foxyproxy"), fp.getMessage("cookies.allremoved"));
          break;
        case "toggle":
          // Toggle between current mode and disabled
          fp.setMode(fp.mode == "disabled" ? "previous" : "disabled", true);
          break;
        case "quickadd":
          foxyproxy.onQuickAddDialog(e);
          break;
      }
    }
  },

  onPopupHiding : function() {
    this._popupShowing > 0 && this._popupShowing--;
  },

  onPopupShowing : function(menupopup, evt) {
    var isFoxyProxySimple = this.fp.isFoxyProxySimple();
    this._popupShowing++;
    if (this._popupShowing == 1) {
      while (menupopup.hasChildNodes()) {
        menupopup.removeChild(menupopup.firstChild);
      }
      /*var asb = document.createElement("arrowscrollbox");
      asb.setAttribute("style", "max-height: 400px;");
      asb.setAttribute("flex", "1");
      asb.setAttribute("orient", "vertical");*/
      
      var checkOne = [];
      if (!isFoxyProxySimple) {
        var itm = _createRadioMenuItem(menupopup,
          "patterns",
          this._cmd,
          this.fp.getMessage("mode.patterns.accesskey"),
          this.fp.getMessage("mode.patterns.label"),
          this.fp.getMessage("mode.patterns.tooltip"));
        itm.setAttribute("class", "orange");
        checkOne.push(itm);
      }
      for (var i=0; i<this.fp.proxies.length; i++) {
        var p = this.fp.proxies.item(i);
        var pName = p.name;
        // Set the submenu based on advancedMenus enabled/disabled
        var sbm = this.fp.advancedMenus ? _createMenu(menupopup, pName, pName.substring(0, 1), p.notes) : menupopup;
        var curProxy = "foxyproxy.fp.proxies.item(" + i + ").";

        if (this.fp.advancedMenus) {
          // Enable/disable checkbox for each proxy.
          // Don't provide enable/disable to lastresort proxy.
          !p.lastresort && _createCheckMenuItem(sbm,
            curProxy + "enabled=!" + curProxy + "enabled;",
            p.enabled,
            this.fp.getMessage("foxyproxy.enabled.accesskey"),
            this.fp.getMessage("foxyproxy.enabled.label"),
            this.fp.getMessage("foxyproxy.enabled.tooltip"));

          _createCheckMenuItem(sbm,
            curProxy + "animatedIcons=!" + curProxy + "animatedIcons;",
            p.animatedIcons,
            this.fp.getMessage("foxyproxy.animatedicons.accesskey"),
            this.fp.getMessage("foxyproxy.animatedicons.label"),
            this.fp.getMessage("foxyproxy.animatedicons.tooltip"));          
        }

        itm = _createRadioMenuItem(sbm,
          p.id,
          this._cmd,
          pName.substring(0, 1),
          this.fp.getMessage("mode.custom.label", [pName]), p.notes);
        itm.setAttribute("style", "color: " + p.color);
        checkOne.push(itm);

        if (this.fp.advancedMenus) {
          var numMatches = this.fp.proxies.item(i).matches.length;
          if (!p.lastresort && numMatches > 0) {
            // Don't provide patterns list to lastresort proxy
            // and proxies with no patterns
            var pmp = _createMenu(sbm,
              this.fp.getMessage("foxyproxy.tab.patterns.label"),
              this.fp.getMessage("foxyproxy.tab.patterns.accesskey"),
              this.fp.getMessage("foxyproxy.tab.patterns.tooltip"));

            for (var j=0; j<numMatches; j++) {
              var m = this.fp.proxies.item(i).matches[j];
              var curMatch = curProxy + "matches[" + j + "].";
              _createCheckMenuItem(pmp,
                curMatch + "enabled=!" + curMatch + "enabled;foxyproxy.fp.writeSettings();",
                m.enabled,
                m.pattern.substring(0, 1),
                m.pattern,
                m.name);
            }
          }     
        }
      }

      /*itm = _createRadioMenuItem(menupopup,
        "random",
        this._cmd,
        this.fp.getMessage("mode.random.accesskey"),
        this.fp.getMessage("mode.random.label"),
        this.fp.getMessage("mode.random.tooltip"));
      itm.setAttribute("style", "color: purple;");
      checkOne.push(itm); */

      itm = _createRadioMenuItem(menupopup,
        "disabled",
        this._cmd,
        this.fp.getMessage("mode.disabled.accesskey"),
        this.fp.getMessage("mode.disabled.label"),
        this.fp.getMessage("mode.disabled.tooltip"));
      itm.setAttribute("style", "color: red;");
      checkOne.push(itm);

      // Check the appropriate one
      for (var i=0; i<checkOne.length; i++) {
        if (checkOne[i].getAttribute("value") == this.fp.mode) {
          checkOne[i].setAttribute("checked", "true");
          //checkOne[i].parentNode.setAttribute("style", "font-weight: bold;");
          break;
        }
      }
      menupopup.appendChild(document.createElement("menuseparator"));
      
      /* add the option to "Set xx.xx.xx.xx:yyyy" as new host and port" if applicable selection is made */
      var sel = this.selection.parseSelection();
      if (sel.reason == 0) {
        var itm = _createMenuItem(menupopup,
          this.fp.getMessage("change.host.2", [sel.hostPort]),
          "foxyproxy.selection.onChangeHost();", this.fp.getMessage("change.host.accesskey"), null);
        menupopup.appendChild(document.createElement("menuseparator"));
        itm.setAttribute("key", "key_foxyproxychangeproxy");
      }      
      
      // Advanced menuing
      if (this.fp.advancedMenus) {
        var submenu = document.createElement("menu");
        submenu.setAttribute("label", this.fp.getMessage("more.label"));
        submenu.setAttribute("accesskey", this.fp.getMessage("more.accesskey"));
        submenu.setAttribute("tooltiptext", this.fp.getMessage("more.tooltip"));

        var submenupopup = document.createElement("menupopup");
        submenu.appendChild(submenupopup);

        var gssubmenupopup =
          _createMenu(submenupopup,
            this.fp.getMessage("foxyproxy.tab.global.label"),
            this.fp.getMessage("foxyproxy.tab.global.accesskey"),
            this.fp.getMessage("foxyproxy.tab.global.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.statusbar.iconEnabled=!foxyproxy.fp.statusbar.iconEnabled;foxyproxy.updateViews(false);",
          this.fp.statusbar.iconEnabled,
          this.fp.getMessage("foxyproxy.showstatusbaricon.accesskey"),
          this.fp.getMessage("foxyproxy.showstatusbaricon.label"),
          this.fp.getMessage("foxyproxy.showstatusbaricon.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.statusbar.textEnabled=!foxyproxy.fp.statusbar.textEnabled;foxyproxy.updateViews(false);",
          this.fp.statusbar.textEnabled,
          this.fp.getMessage("foxyproxy.showstatusbarmode.accesskey"),
          this.fp.getMessage("foxyproxy.showstatusbarmode.label"),
          this.fp.getMessage("foxyproxy.showstatusbarmode.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.toolsMenu=!foxyproxy.fp.toolsMenu;foxyproxy.updateViews(false);",
          this.fp.toolsMenu,
          this.fp.getMessage("foxyproxy.toolsmenu.accesskey"),
          this.fp.getMessage("foxyproxy.toolsmenu.label"),
          this.fp.getMessage("foxyproxy.toolsmenu.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.contextMenu=!foxyproxy.fp.contextMenu;foxyproxy.updateViews(false);",
          this.fp.contextMenu,
          this.fp.getMessage("foxyproxy.contextmenu.accesskey"),
          this.fp.getMessage("foxyproxy.contextmenu.label"),
          this.fp.getMessage("foxyproxy.contextmenu.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          // no need to write settings because changing the attribute makes the fp service re-write the settings
          "foxyproxy.fp.advancedMenus=!foxyproxy.fp.advancedMenus;foxyproxy.updateViews(false);",
          this.fp.advancedMenus,
          this.fp.getMessage("foxyproxy.advancedmenus.accesskey"),
          this.fp.getMessage("foxyproxy.advancedmenus.label"),
          this.fp.getMessage("foxyproxy.advancedmenus.tooltip"));

        if (!isFoxyProxySimple) {
          // No logging and quickadd for FoxyProxy Simple
          var logsubmenupopup =
            _createMenu(submenupopup,
            this.fp.getMessage("foxyproxy.tab.logging.label"),
            this.fp.getMessage("foxyproxy.tab.logging.accesskey"),
            this.fp.getMessage("foxyproxy.tab.logging.tooltip"));
  
          _createCheckMenuItem(logsubmenupopup,
            // no need to write settings because changing the attribute makes the fp service re-write the settings
            "foxyproxy.fp.logging=!foxyproxy.fp.logging;foxyproxy.updateViews(false);",
            foxyproxy.fp.logging,
            this.fp.getMessage("foxyproxy.enabled.accesskey"),
            this.fp.getMessage("foxyproxy.enabled.label"),
            this.fp.getMessage("foxyproxy.enabled.tooltip"));
  
          _createMenuItem(logsubmenupopup,
            this.fp.getMessage("foxyproxy.clear.label"),
            "foxyproxy.fp.logg.clear();foxyproxy.updateViews(false, true);",
            this.fp.getMessage("foxyproxy.clear.accesskey"),
            this.fp.getMessage("foxyproxy.clear.tooltip"));
  
         _createMenuItem(logsubmenupopup,
             this.fp.getMessage("foxyproxy.refresh.label"),
             // Need to refresh the log view so the refresh button is enabled/disabled appropriately
             "foxyproxy.updateViews(false, true);",
             this.fp.getMessage("foxyproxy.refresh.accesskey"),
             this.fp.getMessage("foxyproxy.refresh.tooltip"));
  
          itm =_createMenuItem(submenupopup,
              this.fp.getMessage("foxyproxy.quickadd.label"),
              "foxyproxy.onQuickAddDialog(event)",
              this.fp.getMessage("foxyproxy.quickadd.accesskey"),
              this.fp.getMessage("foxyproxy.quickadd.tooltip"));
            itm.setAttribute("key", "key_foxyproxyquickadd");
            itm.setAttribute("disabled", disableQuickAdd(this.fp));          
  
          _createCheckMenuItem(logsubmenupopup,
            // no need to write settings because changing the attribute makes the fp service re-writes the settings
            "foxyproxy.onToggleNoURLs();",
            foxyproxy.fp.logg.noURLs,
            this.fp.getMessage("foxyproxy.logging.noURLs.accesskey"),
            this.fp.getMessage("foxyproxy.logging.noURLs.label"),
            this.fp.getMessage("foxyproxy.logging.noURLs.tooltip"));
        }
        submenupopup.appendChild(document.createElement("menuseparator"));

        itm =_createMenuItem(submenupopup,
          this.fp.getMessage("foxyproxy.options.label"),
          "foxyproxy.onOptionsDialog();",
          this.fp.getMessage("foxyproxy.options.accesskey"),
          this.fp.getMessage("foxyproxy.options.tooltip"));
        itm.setAttribute("key", "key_foxyproxyfocus");

        if (!isFoxyProxySimple) {
          // No quickadd for FoxyProxy Simple
          itm =_createMenuItem(submenupopup,
            this.fp.getMessage("foxyproxy.quickadd.label"),
            "foxyproxy.onQuickAddDialog(event)",
            this.fp.getMessage("foxyproxy.quickadd.accesskey"),
            this.fp.getMessage("foxyproxy.quickadd.tooltip"));
          itm.setAttribute("key", "key_foxyproxyquickadd");
          itm.setAttribute("disabled", disableQuickAdd(this.fp));
        }
                  
        _createMenuItem(submenupopup,
          this.fp.getMessage("foxyproxy.help.label"),
          "foxyproxy.fpc.openAndReuseOneTabPerURL('http://getfoxyproxy.org/" + (isFoxyProxySimple ? "basic/" : "") + "help.html');",
          this.fp.getMessage("foxyproxy.help.accesskey"),
          this.fp.getMessage("foxyproxy.help.tooltip"));

        //menupopup.appendChild(asb);
        try {
          menupopup.appendChild(submenu);
        }
        catch (e) {
          // dunno why it throws
        }
      }
      else {
        // advanced menus are disabled
        itm = _createMenuItem(menupopup,
          this.fp.getMessage("foxyproxy.options.label"),
          "foxyproxy.onOptionsDialog();",
          this.fp.getMessage("foxyproxy.options.accesskey"),
          this.fp.getMessage("foxyproxy.options.tooltip"));
        itm.setAttribute("key", "key_foxyproxyfocus");

        
        /* Do the Set Host items. */
        /*var sel = foxyproxy.parseSelection(p),
            tmp = curProxy.substring(0, curProxy.length - 1); // because curProxy includes a final "."
          sbm.appendChild(document.createElement("menuseparator"));
          itm = _createMenuItem(sbm, this.fp.getMessage("change.host", [sel.selection]),
              "foxyproxy.changeHost({proxy:" + tmp + ", host:'" + sel.parsedSelection[0] + "', port:'" + sel.parsedSelection[1] + "', reloadcurtab:false});", null, null);
          itm.setAttribute("disabled", disabledSetHost);
          itm = _createMenuItem(sbm, this.fp.getMessage("change.host.reload", [sel.selection]),
              "foxyproxy.changeHost({proxy:" + tmp + ", host:'" + sel.parsedSelection[0] + "', port:'" + sel.parsedSelection[1] + "', reloadcurtab:true});", null, null);
          itm.setAttribute("disabled", sel.disabled);     
          */
        
        if (!isFoxyProxySimple) {
          // No quickadd for FoxyProxy Simple
          itm =_createMenuItem(menupopup,
            this.fp.getMessage("foxyproxy.quickadd.label"),
            "foxyproxy.onQuickAddDialog(event)",
            this.fp.getMessage("foxyproxy.quickadd.accesskey"),
            this.fp.getMessage("foxyproxy.quickadd.tooltip"));
          itm.setAttribute("key", "key_foxyproxyquickadd");
          itm.setAttribute("disabled", disableQuickAdd(this.fp));
        }
        
        _createCheckMenuItem(menupopup,
          "foxyproxy.fp.advancedMenus = true;foxyproxy.updateViews(false);",
          this.fp.advancedMenus,
          this.fp.getMessage("foxyproxy.advancedmenus.accesskey"),
          this.fp.getMessage("foxyproxy.advancedmenus.label"),
          this.fp.getMessage("foxyproxy.advancedmenus.tooltip"));
      }
    }
    
    function disableQuickAdd(fp) {
      return fp.mode == "disabled" || !fp.quickadd.enabled;
    }

    function _createMenu(menupopup, label, accesskey, tooltip) {
      var submenu = document.createElement("menu");
      submenu.setAttribute("label", label);
      submenu.setAttribute("accesskey", accesskey);
      submenu.setAttribute("tooltiptext", tooltip);
      var submenupopup = document.createElement("menupopup");
      submenu.appendChild(submenupopup);
      menupopup.appendChild(submenu);
      return submenupopup;
    }

    function _createMenuItem(menupopup, label, cmd, accesskey, tooltip) {
      var e = document.createElement("menuitem");
      e.setAttribute("label", label);
      e.setAttribute("oncommand", cmd);
      e.setAttribute("accesskey", accesskey);
      e.setAttribute("tooltiptext", tooltip);
      menupopup.appendChild(e);
      return e;
    }

    function _createRadioMenuItem(menupopup, id, cmd, accesskey, label, tooltip) {
      var e = document.createElement("menuitem");
      e.setAttribute("label", label);
      e.setAttribute("id", id);
      e.setAttribute("value", id);
      e.setAttribute("type", "radio");
      e.setAttribute("name", "foxyproxy-enabled-type");
      e.setAttribute("tooltiptext", tooltip);
      e.setAttribute("oncommand", cmd);
      e.setAttribute("accesskey", accesskey);
      menupopup.appendChild(e);
      return e;
    }

    function _createCheckMenuItem(menupopup, cmd, checked, accesskey, label, tooltip) {
      var e = document.createElement("menuitem");
      e.setAttribute("label", label);
      e.setAttribute("type", "checkbox");
      e.setAttribute("checked", checked);
      e.setAttribute("tooltiptext", tooltip);
      e.setAttribute("oncommand", cmd);
      e.setAttribute("accesskey", accesskey);
      menupopup.appendChild(e);
      return e;
    }
  },

  onToggleNoURLs : function(owner) {
    this.fp.logg.noURLs=!this.fp.logg.noURLs;
    if (this.fp.logg.noURLs && this.fp.logg.length > 0) {
      var q=this.ask(owner?owner:window, this.fp.getMessage("log.scrub"));
      if (q) {
        this.fp.logg.scrub();
        this.updateViews(false, true);
      }
    }
  }
};

///////////////////////////////////////////////////////

window.addEventListener("load", function(e) { foxyproxy.onLoad(e); }, false);
window.addEventListener("unload", function(e) {
  document.getElementById("appcontent") && document.getElementById("appcontent").removeEventListener("load", this.onPageLoad, true);
  var obSvc = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
  for (var i in foxyproxy.notes) {
    obSvc.removeObserver(foxyproxy, foxyproxy.notes[i]);
  }
}, false);
