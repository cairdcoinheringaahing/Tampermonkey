// ==UserScript==
// @name         Insert thorns
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://chat.stackexchange.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setInterval(function() {
            var x = document.getElementById("input");
            x.value = x.value.replace("th", "þ");
            x.value = x.value.replace("Th", "Þ");
    }, 300);
})();