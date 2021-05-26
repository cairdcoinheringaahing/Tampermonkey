// ==UserScript==
// @name         Reply to self
// @namespace    https://github.com/dzaima
// @version      0.1
// @description  reply to self
// @author       dzaima
// @match        https://chat.stackexchange.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  setInterval(() => {
    [...$(".message:not(.dParsed)")].map(c => {
      c.classList.add("dParsed");
      let mono = c.parentElement.parentElement;
      if (mono.classList.contains("mine")) {
        let meta = c.querySelector(".meta");
        let l = $('<span class="meta"/>');
        l.append($('<span class="newreply"/>').click(H).attr("title", "link my next chat message as a reply to this"));
        $(meta).replaceWith(l);
      }
      if (mono.classList.contains("user-319249")) {
        let rep = c.querySelector(".newreply");
        $(rep).click(IRC);
      }
    })
  }, 1000);
  function IRC(e) {
    let m = e.currentTarget.closest(".message");
    let name = m.querySelector(".content").innerText.match("<([^>]+)>")[1]; // errors when it's not an IRC message. ¯\_(ツ)_/¯
    let p = $("#input").focus().val().replace(/^:[0-9]+\s+([a-zA-Z_-]+:\s+)?/, "");
    r(name+": "+p)
  }
  function H(e) {
    let id = $(e.currentTarget.closest(".message")).messageId();
    let p = $("#input").focus().val().replace(/^:[0-9]+\s+([a-zA-Z_-]+:\s+)?/, "");
    r(":"+id+" "+p)
  }
  function r(e) {
    return $("#input").val(e).trigger("change").focus()
  }
  let st = document.createElement('style');
  st.type = 'text/css';
  st.innerHTML = ".timestamp:hover+div.message .meta, div.message:hover .meta { display: inline-block !important; }";
  document.head.appendChild(st);
})();