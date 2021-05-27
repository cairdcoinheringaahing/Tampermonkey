// ==UserScript==
// @name         Chat Commands
// @namespace    http://tampermonkey.net/
// @version      0.3.0
// @description  Add some simple ascii art commands.
// @author       Teh Flamin' Taco
// @include *://chat.meta.stackoverflow.com/rooms/*
// @include *://chat.meta.stackexchange.com/rooms/*
// @include *://chat.stackexchange.com/rooms/*
// @include *://chat.stackoverflow.com/rooms/*
// @include *://chat.askubuntu.com/rooms/*
// @include *://chat.serverfault.com/rooms/*
// @updateURL   https://rawgit.com/TehFlaminTaco/TacosUserscripts/blob/master/chatcommands.user.js
// @run-at document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var codes = {
        shrug: "¯\\\\_(ツ)_/¯",
        tableflip: "(ノ°Д°）ノ︵ ┻━┻",
        "o(_+)o": "ಠ$1ಠ",
        disapprove: "ಠ_ಠ",
        like: "\\(•◡•)/",
        unflip: "┬─┬ ノ( ゜-゜ノ)",
        why: "ლ(ಠ益ಠლ)",
        sunglasses: '(•_•) / ( •_•)>⌐■-■ / (⌐■_■)',
        "O_O": "https://i.stack.imgur.com/qFaUr.png",
        strike: '`---strikethrough---` ---strikethrough---',
        rickroll: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        userscripts: 'https://github.com/RedwolfPrograms/userscripts https://github.com/TehFlaminTaco/TacosUserscripts https://github.com/cairdcoinheringaahing/Tampermonkey',
        rscripts: 'https://github.com/RedwolfPrograms/userscripts',
        tscripts: 'https://github.com/TehFlaminTaco/TacosUserscripts',
        cscripts: 'https://github.com/cairdcoinheringaahing/Tampermonkey'
        acronyms: 'https://codegolf.meta.stackexchange.com/questions/12537/what-are-our-specific-abbreviations-and-terms',
        sandbox: 'https://codegolf.meta.stackexchange.com/questions/2140/sandbox-for-proposed-challenges',
        iodefaults: 'https://codegolf.meta.stackexchange.com/questions/2447/default-for-code-golf-input-output-methods',
        welcome: 'https://codegolf.meta.stackexchange.com/questions/20861/welcome-to-code-golf-and-coding-challenges-stack-exchange',
        tio: 'https://tio.run',
        jelly: 'https://tio.run/#jelly',
    };

    setInterval(function() {
        var x;

        for (var code in codes) {

            x = document.getElementById("input");

            x.value = x.value.replace(new RegExp("(?:\\s|^)/" + code), function(m){
                var s = m.match(/^(\s*)\/(.*)/)
                return s[1]+s[2].replace(new RegExp(code), codes[code])
            });
        }
    }, 300);
})();
