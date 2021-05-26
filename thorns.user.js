// ==UserScript==
// @name         Þe best userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Þorns everywhere!
// @author       You
// @match        https://*/*
// @grant        none
// ==/UserScript==

(function() {

    new MutationObserver(_=>(r=n=>n.nodeType===3?n.textContent=n.textContent.replace(/th/gi,d=>d[0]==d[0].toLowerCase()?"þ":"Þ"):[...n.childNodes].map(r))(document.body)).observe(document,{attributes:0,childList:1,subtree:1})
})();