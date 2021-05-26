// ==UserScript==
// @name        Review Stalker Reloaded
// @namespace   com.tuggy.nathan
// @description Reloads specified Stack Exchange review pages, opening tasks as they show up
// @include     https://*.stackexchange.com/review*
// @include     /^https://[^/]*\.?stackoverflow\.com/review/
// @include     /^https://[^\.]*\.?serverfault\.com/review/
// @include     /^https://[^\.]*\.?superuser\.com/review/
// @include     /^https://[^\.]*\.?askubuntu\.com/review/
// @include     /^https://[^\.]*\.?mathoverflow\.net/review/
// @include     https://stackapps.net/review/*
// @exclude     //stats$/
// @exclude     //history($|\?.+$)/
// @version     1.9.06
// @grant       GM_openInTab
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_getResourceURL
// @grant       GM_getResourceText
// @grant       GM_info
// @grant       GM_addStyle
// @resource    icon lens.png
// @resource    CSSConfig config.css
// @require     https://openuserjs.org/src/libs/sizzle/GM_config.js
// ==/UserScript==

/* Copyright Nathan Tuggy 2016-2019
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const HrefBlankFavicon = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const LDomNoChildMeta = ["stackapps.net", "meta.stackexchange.com"];
const NamTempBase = "__RSR_TEMP__";
const MsiQueueStatus = 0.25 * 1000, MsiHeartbeat = 10 * 1000;

const ModeNever = 'Never', ModeMetaOnly = 'Only on child meta sites', ModeAlways = 'Always';
const PatQueueIgnoreEntry = /(?:(?:[^./]+\.)?(?:meta\.)?stackexchange.com|(?:[a-z]{2}\.)?(?:meta\.)?stackoverflow.com|(?:meta\.)?(?:(?:(?:[a-z]{2}\.)?stackoverflow|stackapps|askubuntu|superuser|serverfault)\.com|mathoverflow\.net))\/review\/[a-z-]+(?:,\s*(?=\S))?/g;

function CommaSplit(S) {
  if (0 === S.length) return [];
  return S.split(",");
}

var LDomSites = CommaSplit(GM_getValue("LDomSites", "")), BDeduped = false;
for (var i = 0; i < LDomSites.length - 1; i++) {
  for (let j = 0; j < LDomSites.length; j++) {
    if (j === i) continue;
    if (LDomSites[j].replace("meta.", "") === LDomSites[i].replace("meta.", "")) {
      LDomSites.splice(j, 1);
      BDeduped = true;
    }
  }
}
if (BDeduped) GM_setValue("LDomSites", LDomSites.join(","));

GM_config.init({
  id: 'RSR',
  title: "Settings for Review Stalker Reloaded",
  fields: {
    NNavLoadMeta: {
      label: "Number of rounds between checking per-site meta queues",
      type: 'unsigned int',
      default: 12
    },
    NTotalNavRecycleTab: {
      label: "Number of pages in tab history before recycling the tab",
      type: 'int',
      default: 500,
      title: "Set to -1 to disable feature"
    },
    ModeTabForQueue: {
      label: "Open all queues in new tabs without reusing current one",
      type: 'select',
      options: [ModeNever, ModeMetaOnly, ModeAlways],
      default: ModeMetaOnly
    },
    ModeSurge: {
      label: "Check next site immediately if no reviews found",
      type: 'select',
      options: [ModeNever, ModeMetaOnly, ModeAlways],
      default: ModeMetaOnly,
      title: "Will wait at last site in rotation for full inter-round delay"
    },
    BForceSingleTab: {
      label: "Load all reviews in same tab sequentially",
      type: 'checkbox',
      default: false,
      title: "Fetches each queue's next item separately in background, then switches to next available queue when current is empty"
    },
    SiRoundReload: {
      section: ["Intervals", "All times to millisecond precision"],
      label: "Seconds for a full round of checks",
      type: 'unsigned float',
      default: 5 * 60,
      title: "RSR will not continuously load new checks faster than the empty queue setting no matter how many sites or how small the overall time set"
    },
    SiReloadInQueue: {
      label: "Seconds between checks to move on from an empty queue",
      type: 'unsigned float',
      default: 15
    },
    MiReloadStale: {
      label: "Minutes before moving on from stale preloaded review item",
      type: 'unsigned float',
      default: 60
    },
    ValLQueueIgnore: {
      type: 'hidden',
      section: ['Current Sites', LDomSites.join(', ')]
    },
    UnvalLQueueIgnore: {
      label: "Queues to ignore on specific sites:",
      type: 'textarea',
      title: "Format is '<domain>/review/<queue>' for each entry, comma separated, no HTTP/HTTPS protocol",
      save: false
    }
  },
  events: {
    close: function() {
      location.reload();
    },
    init: function() {
      GM_config.fields.UnvalLQueueIgnore.value = GM_config.fields.ValLQueueIgnore.value;
    },
    open: function(doc, win, fra) {
      BPaused = true;
      GM_config.fields.ModeTabForQueue.node.disabled = !!GM_config.get('BForceSingleTab');
      
      GM_config.fields.UnvalLQueueIgnore.node.addEventListener('change', function () {
        var UnvalLQueueIgnore = GM_config.fields.UnvalLQueueIgnore.toValue();

        // Only save validated
        var leftover = UnvalLQueueIgnore.replace(PatQueueIgnoreEntry, '');
        if (0 === leftover.length) {
          GM_config.fields.ValLQueueIgnore.node.value = UnvalLQueueIgnore;
        } else alert('List of review queues to ignore is invalid!');
      }, false);
      
      GM_config.fields.BForceSingleTab.node.addEventListener('change', function () {
        GM_config.fields.ModeTabForQueue.node.disabled = !!GM_config.fields.BForceSingleTab.toValue();
      }, false);
    }
  },
  css: GM_getResourceText("CSSConfig")
});
var NNavLoadMeta = GM_config.get("NNavLoadMeta"),
    NTotalNavRecycleTab = GM_config.get("NTotalNavRecycleTab"),
    BTabForQueue,
    BSurge,
    BForceSingleTab = GM_config.get("BForceSingleTab"),
    MsiRoundReload = GM_config.get("SiRoundReload") * 1000,
    MsiReloadInQueue = GM_config.get("SiReloadInQueue") * 1000,
    MsiReloadStale = GM_config.get("MiReloadStale") * 60 * 1000,
    ValLQueueIgnore = GM_config.get("ValLQueueIgnore").split(/,\s*/);

(function () {
  if (!document.querySelectorAll("link[rel='stylesheet'][href^='https://use.fontawesome.com/releases/']").length) {
    let ElemFALink = document.createElement("link");
    ElemFALink.rel = "stylesheet";
    ElemFALink.href = "https://use.fontawesome.com/releases/v5.1.0/css/all.css";
    document.head.appendChild(ElemFALink);
  }
})();
GM_addStyle(".RSR_header { float: right; margin-top: 1em; margin-left: 1em; } .sr-only { display: none; }");

var NNavLoad = GM_getValue("NNavLoad", 1);

var ElemSystemMessage = document.getElementById('system-message');
var BSiteReadOnly = ElemSystemMessage && ElemSystemMessage.textContent.contains('read-only');

var DomLoadStarted = GM_getValue("DomLoadStarted", "");
GM_setValue("DomLoadStarted", "");          // Should be empty most of the time

var StHrefQueueHead = CommaSplit(GM_getValue("StHrefQueueHead", ""));
var StHrefQueueFetch = CommaSplit(GM_getValue("StHrefQueueFetch", ""));

function QueueFromUrl(Url) {
  var Match = /[^/]+\.[a-z]+\/review\/[^/]+/.exec(Url);
  if (!Match) {
    return;       // Documentation won't work, brutally ignore
  }
  for (let QueueIgnoreEntry of ValLQueueIgnore) {
    if (Match[0] == QueueIgnoreEntry) {
      return;
    }
  }
  return Match[0];
}

const SttHead = 0, SttFetch = 1;
function IdxQueueInStHref(StHref, Href) {
  var Queue = QueueFromUrl(Href);
  for (let i = 0; i < StHref.length; i++) {
    let QueueExisting = QueueFromUrl(StHref[i]);
    if (QueueExisting && Queue && QueueExisting == Queue) {
      return i;
    }
  }
}
function EnqueueStHref(Stt, Href, BBeginning) {
  var StHref    = SttHead === Stt ?  StHrefQueueHead  :  StHrefQueueFetch ;
  var NamStHref = SttHead === Stt ? "StHrefQueueHead" : "StHrefQueueFetch";
  var Queue = PatQueueIgnoreEntry.exec(Href);
  if (IdxQueueInStHref(StHref, Href) > -1) return;
  var ret = BBeginning ? StHref.unshift(Href) : StHref.push(Href);
  GM_setValue(NamStHref, StHref.join(","));
  return ret;
}
function DequeueStHref(Stt, BBeginning) {
  var StHref    = SttHead === Stt ?  StHrefQueueHead  :  StHrefQueueFetch ;
  var NamStHref = SttHead === Stt ? "StHrefQueueHead" : "StHrefQueueFetch";
  var ret = BBeginning ? StHref.shift() : StHref.pop();
  GM_setValue(NamStHref, StHref.join(","));
  return ret;
}
function PeekStHref(Stt) {
  var StHref = SttHead === Stt ? StHrefQueueHead : StHrefQueueFetch;
  return StHref[StHref.length - 1];
}
function PokeStHref(Stt, Href, BBeginning) {
  var StHref    = SttHead === Stt ?  StHrefQueueHead  :  StHrefQueueFetch ;
  var NamStHref = SttHead === Stt ? "StHrefQueueHead" : "StHrefQueueFetch";
  for (let i; (i = IdxQueueInStHref(StHref, Href)) > -1;) {
    StHref.splice(i, 1);     // Move to whichever end is now desired to have this
  }
  var ret = BBeginning ? StHref.unshift(Href) : StHref.push(Href);
  GM_setValue(NamStHref, StHref.join(","));
  return ret;
}
function BStackPresent(Stt) {
  var StHref = SttHead === Stt ? StHrefQueueHead : StHrefQueueFetch;
  return StHref.length > 0;
}

var BInQueue = /\/review\/.+/.test(location.href);
var DomMain = location.hostname;
function BHasChildMeta(Dom) {
  return LDomNoChildMeta.indexOf(Dom) === -1;
}
var BChildMeta = BHasChildMeta(DomMain) && DomMain.indexOf("meta.") > -1;
function BuildMain(Dom) {
  return Dom.replace("meta.", "");
}
if (BChildMeta) { DomMain = BuildMain(DomMain); }
var BDomInL = LDomSites.indexOf(DomMain) > -1;
function BFromMetaMode(Mode) {
  if (ModeNever === Mode) return false;
  if (ModeAlways === Mode) return true;
  return BChildMeta;
}
BTabForQueue = BFromMetaMode(GM_config.get("ModeTabForQueue"));
var BEndOfRound = LDomSites.indexOf(DomMain) >= LDomSites.length - 1;
BSurge = BFromMetaMode(GM_config.get("ModeSurge"));
function BuildChildMeta(DomMain) {
  if (DomMain.endsWith(".stackexchange.com")) {
    return DomMain.replace(".stackexchange.com", ".meta.stackexchange.com");
  }
  else if (DomMain.endsWith(".stackoverflow.com")) {
    return DomMain.replace(".stackoverflow.com", ".meta.stackoverflow.com");
  }
  else {
    return "meta." + DomMain;
  }
}
function CheckNextPage() {
  var BRecycleTab = history.length >= NTotalNavRecycleTab && NTotalNavRecycleTab != -1;
  var i = LDomSites.indexOf(DomMain) + 1, DomNext = LDomSites[i % LDomSites.length];
  if (window.name.startsWith(NamTempBase)) {
    window.close();
    return;
  }
  if (LDomSites.length === 0) {
    // Nowhere to go
    return;
  }
  
  var HrefNext;
  if (BStackPresent(SttFetch)) {        // Doesn't check BForceSingleTab, as it may have changed under us but we still need to get rid of these
    HrefNext = PeekStHref(SttFetch);
    DomNext = "";
  }
  else if (BStackPresent(SttHead)) {
    HrefNext = PeekStHref(SttHead);
    DomNext = "";
  }
  else {
    if (BEndOfRound) {
      NNavLoad = (NNavLoad % NNavLoadMeta) + 1;
      GM_setValue("NNavLoad", NNavLoad);
    }
    
    if (NNavLoad >= NNavLoadMeta && BHasChildMeta(DomNext)) {
      DomNext = BuildChildMeta(DomNext);
    }
    HrefNext = "https://" + DomNext + "/review";
  }
  
  if (BRecycleTab && DomNext) {       // Recycling to a fetch/head stack tends to result in tab closure
    GM_setValue("DomLoadStarted", DomNext);
    GM_openInTab(HrefNext);
    window.close();
  }
  else {
    GM_setValue("DomLoadStarted", DomNext);
    location.assign(HrefNext);
    // If it can't load the page in the next minute, it's probably had a network error, so recover if possible without messing up site list
    window.setTimeout(function () { GM_setValue("DomLoadStarted", ""); }, 60 * 1000);
  }
}

var HrefOriginalFavicon;
function SetFavicon(HrefIcon) {
  var NlLinkIcon = document.querySelectorAll("link[rel*='icon']");
  for (let N of NlLinkIcon) {
    if (!HrefOriginalFavicon) HrefOriginalFavicon = N.href;
    // Remove even the mobile stuff; no, that doesn't get replaced yet
    N.remove();
  }
  var ElemLinkIcon = document.createElement("link");
  ElemLinkIcon.rel = "icon";
  ElemLinkIcon.type = "image/x-icon";
  ElemLinkIcon.href = HrefIcon;
  document.head.appendChild(ElemLinkIcon);
}

function BElemInstrMatches(ElemInstr, Text) {
  return ElemInstr && ElemInstr.textContent.trim().startsWith(Text);
}
function BCapped(ElemInstr) {
  return BElemInstrMatches(ElemInstr, "Thank you for reviewing ");
}
function BEmpty(ElemInstr) {
  return BElemInstrMatches(ElemInstr, "This queue has been cleared!") ||
         BElemInstrMatches(ElemInstr, "There are no items for you to review, matching the filter");
}
function BLoading() {
  return !!document.querySelector(".review-actions .ajax-loader");
}
function BProcessed(ElemInstr) {
  //alert("'" + ElemInstr.textContent + "'");
  return BElemInstrMatches(ElemInstr, "Review completed") ||
         BElemInstrMatches(ElemInstr, "You have already reviewed this item.") ||
         BElemInstrMatches(ElemInstr, "Your suggested edit is pending review.");
}
function BError() {
  if (document.querySelector(".error-page-text")) return true;
  let ElemHeader = document.querySelector(".grid--cell > h1.fs-headline1");
  return !!ElemHeader;    // TODO: Also check text?
}

var BPaused = false, TitleBase = document.title, TmrQueueStatus, TmrHeartbeat, BDequeued = false;
var IdCurLoaded, DtLoaded = new Date();
function MarkQueueFinished(Additional) {
  if (BDequeued) return;
  BDequeued = true;
  BPaused = false;
  if (BStackPresent(SttHead)) {
    DequeueStHref(SttHead);
  }
  if (typeof Additional === "function") Additional();
  clearInterval(TmrQueueStatus);
}
function CheckQueueStatus() {
  let status = document.querySelector("div.review-status");
  let instr = document.querySelector(".review-instructions.infobox");
  let ResId = /\/(\d+)$/.exec(location.href);
  if (!QueueFromUrl(location.href)) {
    // Throw away ignored queues
    MarkQueueFinished();
  }
  else if (status) {
    //alert("Found .review-status");
    MarkQueueFinished(function () {
      document.title = TitleBase;
      BPaused = true;
    })
  }
  else if (BCapped(instr) || BError()) {
    MarkQueueFinished();
  }
  else if (BLoading()) {
    document.title = "… " + TitleBase;
    BPaused = true;
  }
  else if (BEmpty(instr)) {
    MarkQueueFinished(function() {
      document.title = "∅ " + TitleBase;
      SetFavicon(HrefBlankFavicon);
    });
  }
  else if (BProcessed(instr)) {
    MarkQueueFinished(function() {
      document.title = TitleBase;
      SetFavicon(HrefBlankFavicon);
      BPaused = true;
    });
  }
  else if (BStackPresent(SttFetch) && ResId) {
    if (BStackPresent(SttHead)) {
      PokeStHref(SttHead, location.href);
    }
    clearInterval(TmrQueueStatus);
    CheckNextPage();
  }
  else if ((new Date()).valueOf() - DtLoaded.valueOf() < MsiReloadStale) {
    if (ResId && ResId[1] != IdCurLoaded) {
      IdCurLoaded = ResId[1];
      DtLoaded = new Date();
      document.title = "🔎 " + TitleBase;
      SetFavicon(HrefOriginalFavicon);
      if (BStackPresent(SttHead)) {
        PokeStHref(SttHead, location.href);
      }
      BPaused = true;
    }
  }
  else {
    // Let an aged-out review item go; if it comes back, that's fine
    MarkQueueFinished(function () { while (BStackPresent(SttHead)) { DequeueStHref(SttHead); } });
  }
}
function SetHeartbeat() {
  var Queue = QueueFromUrl(location.href);
  if (!Queue) {
    clearInterval(TmrHeartbeat);
    return;
  }
  GM_setValue(Queue, (new Date()).valueOf());
}

var NlNumAvailable = document.querySelectorAll("div:not(.o30) > .fs-subheading[title]");
var NNumAll = document.querySelectorAll(".fs-subheading[title]").length;
function GetLHrefToOpen() {
  var LHref = [];
Q:for (let NNumAvailable of NlNumAvailable) {
    let SNumAvailable = NNumAvailable.title;
    if (0 === Number.parseInt(SNumAvailable)) continue;
    let NLnkAvailable = NNumAvailable.parentNode.parentNode.querySelector(".fs-subheading > a");
    let Queue = QueueFromUrl(NLnkAvailable && NLnkAvailable.href);
    if (!Queue) continue;
    let MsaHeartbeat = new Date() - new Date(GM_getValue(Queue, 0));
    if (MsaHeartbeat < 2 * MsiHeartbeat) continue;        // Avoid opening duplicate tab
    if (IdxQueueInStHref(StHrefQueueHead, Queue) > -1) {  // Also ignore entries in queue head stack
      continue Q;
    }
    LHref.push(NLnkAvailable.href);
  }
  return LHref;
}

var ElemHeader, ElemOptionsButton;
function CreateHeaderElement(NamElem, NamFA, Extra, Title) {
  var Elem = document.createElement(NamElem), ElemInner = document.createElement("span");
  Elem.className = "RSR_header";
  if (Title) Elem.title = Title;
  ElemInner.className = "fas fa-lg " + NamFA;
  ElemInner.setAttribute('aria-hidden', 'true');
  Elem.appendChild(ElemInner);
  ElemInner.outerHTML += Extra;
  return Elem;
}
function CreateHeaders() {
  ElemHeader = document.querySelector("#content > div:first-of-type");
  
  ElemOptionsButton = CreateHeaderElement("a", "fa-sliders-h", "", "Settings");
  ElemOptionsButton.href = "#";
  ElemOptionsButton.ariaLabel = "Settings";
  ElemOptionsButton.addEventListener("click", function (e) {
    GM_config.open();
    if (e) e.preventDefault();
    return false;
  });

  ElemHeader.appendChild(CreateHeaderElement("span", "", GM_info.script.name + " v" + GM_info.script.version));
  
  if (NTotalNavRecycleTab != -1) {
    ElemHeader.appendChild(CreateHeaderElement("span", "fa-recycle", "<span class='sr-only'>tab recycle:</span> " + history.length + "/" + NTotalNavRecycleTab, "Tab Recycle"));
  }
  
  ElemHeader.appendChild(CreateHeaderElement("span", "fa-question-circle", "<span class='sr-only'>meta load:</span> " + NNavLoad + "/" + NNavLoadMeta, "Meta Load"));

  ElemHeader.appendChild(ElemOptionsButton);
}

function AddSite(Dom) {
  if (LDomSites.indexOf(Dom) > -1) return false;
  LDomSites.push(Dom);
  if (!LDomSites[0]) LDomSites = LDomSites.slice(1);
  let SLDomSitesNew = LDomSites.join(",");
  GM_setValue("LDomSites", SLDomSitesNew);
  return true;
}
function RemoveSite(Dom) {
  let i = LDomSites.indexOf(Dom);
  if (i > -1) {
    LDomSites.splice(i, 1);
    let SLDomSitesNew = LDomSites.join(",").replace(/^,|,,|,$/, '');
    GM_setValue("LDomSites", SLDomSitesNew);
    return true;
  }
  else {
    console.log("Unable to find site " + Dom + " to remove it in '" + LDomSites.join(",") + "'!");
    return false;
  }
}
function CheckSiteMembership(NQueueAvailable, ElemHeader) {
  var Status;
  if (BChildMeta) return;
  if (DomLoadStarted && DomMain != DomLoadStarted && RemoveSite(DomLoadStarted)) {
    // We didn't end up where we wanted, probably because it's gone
    Status = DomLoadStarted + " missing!";
    BPaused = true;
  }
  else if (NQueueAvailable > 0 && AddSite(DomMain)) {
    Status = "site added!";
  }
  else if (0 === NQueueAvailable && RemoveSite(DomMain)) {
    Status = "site removed!";
    BPaused = true;
  }
  else if (!BDomInL) {
    ElemHeader.parentNode.removeChild(ElemHeader);
    BPaused = true;
  }
  
  if (Status) {
    ElemHeader.appendChild(CreateHeaderElement("span", BPaused ? "fa-exclamation-triangle" : "fa-plus-square", Status));
  }
}

var LHrefToOpen = [];
if (BInQueue) {
  if (1 === history.length) {
    window.name = NamTempBase + Math.round(Math.random() * 1000);
  }
  
  TitleBase = document.title.replace(/^Review /, "");
  TmrQueueStatus = setInterval(CheckQueueStatus, MsiQueueStatus);
  TmrHeartbeat = setInterval(SetHeartbeat, MsiHeartbeat);
  
  if (BForceSingleTab && BStackPresent(SttFetch)) {
    DequeueStHref(SttFetch);
    EnqueueStHref(SttHead, location.href);
  }
}
else {
  SetFavicon(GM_getResourceURL("icon"));
  LHrefToOpen = GetLHrefToOpen();
  if (NNumAll > 0) {
    CreateHeaders();
    if (!BSiteReadOnly) CheckSiteMembership(NlNumAvailable.length, ElemHeader);
  }
}

function AddPauseButton(ElemMarker) {
  var ElemPause = CreateHeaderElement("a", "pause-circle", ""), ElemPauseIcon = ElemPause.firstElementChild;
  var Cls = function () { return "fas fa-lg fa-" + (BPaused ? "play-circle" : "pause-circle"); };
  var Aria = function () { return BPaused ? "Resume" : "Pause"; };
  ElemPause.href = "#";
  ElemPause.className = "RSR_header"
  ElemPauseIcon.className = Cls();
  ElemPauseIcon.ariaLabel = Aria();
  
  ElemPause.addEventListener("click", function (e) {
      BPaused = !BPaused;
      ElemPauseIcon.className = Cls();
      ElemPauseIcon.ariaLabel = Aria();
      if (e) e.preventDefault();
      return false;
    });
  if (ElemMarker.parentNode) ElemMarker.parentNode.appendChild(ElemPause);
}
function Msi() {
  if (BInQueue || BStackPresent(SttFetch) || BStackPresent(SttHead) || (BSurge && !BEndOfRound)) {
    return MsiReloadInQueue;
  }
  else if (BEndOfRound && BSurge) {
    return 1;     // Yes, immediately
  }
  else {
    return Math.max(MsiRoundReload / LDomSites.length, MsiReloadInQueue);
  }
}
if (LHrefToOpen.length > 0 && BForceSingleTab) {
  // TODO: Convert to function-handling?
  StHrefQueueFetch = LHrefToOpen;
  // Ensure LQP gets processed last so it will be the first to be handled
  let ILQP = StHrefQueueFetch.indexOf(location.href + "/low-quality-posts");
  if (ILQP > -1) {
    StHrefQueueFetch.unshift(StHrefQueueFetch.splice(ILQP, 1)[0]);
  }
  GM_setValue("StHrefQueueFetch", StHrefQueueFetch.join(","));
  CheckNextPage();
}
else if (LHrefToOpen.length > 0) {
  for (let i = BTabForQueue ? 0 : 1; i < LHrefToOpen.length; i++) {
    GM_openInTab(LHrefToOpen[i]);
  }
  if (BTabForQueue) {
    CheckNextPage();
  }
  else {
    location.href = LHrefToOpen[0];
  }
}
else {
  if (!BInQueue) {
    AddPauseButton(ElemOptionsButton);
  }
  
  let TmrNav = setInterval(function() {
    if (!BPaused) {
      clearInterval(TmrNav);
      CheckNextPage();
    }
  }, Msi());
}
 