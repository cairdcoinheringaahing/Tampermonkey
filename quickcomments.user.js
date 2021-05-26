// ==UserScript==
// @name         Quick Comments
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Alt + Shift + [0-9] to paste any custom comment
// @author       RedwolfPrograms
// @match        https://codegolf.stackexchange.com/*
// @match        https://codegolf.meta.stackexchange.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const MAPPING = {
        "1": "[Welcome to Code Golf!](https://codegolf.meta.stackexchange.com/q/20861/66833) This site is for competitive programming challenges, not general issues. You may want to check out [Stack Overflow](https://stackoverflow.com), although be sure to read their [\"how to ask\"](https://stackoverflow.com/help/how-to-ask) page first.",
        "2": "[Welcome to Code Golf](https://codegolf.meta.stackexchange.com/q/20861/66833) and nice first question! For future reference, we recommend using the [Sandbox](https://codegolf.meta.stackexchange.com/questions/2140/sandbox-for-proposed-challenges) to get feedback on challenge ideas before posting them to main",
        "3": "[Welcome to Code Golf!](https://codegolf.meta.stackexchange.com/q/20861/66833) I've voted to close this question as unclear as it is missing some key details. For future reference, we recommend using the [Sandbox](https://codegolf.meta.stackexchange.com/questions/2140/sandbox-for-proposed-challenges) to get feedback on challenge ideas before posting them to main",
        "4": "I would highly recommend you start posting your challenge ideas to the [Sandbox](https://codegolf.meta.stackexchange.com/questions/2140/sandbox-for-proposed-challenges) first to get feedback",
        "5": "[Welcome to Code Golf](https://codegolf.meta.stackexchange.com/q/20861/66833), and nice first answer! Be sure to check out our [Tips for golfing in xxxxx]() page for ways you can golf your program",
        "6": "[Welcome to Code Golf](https://codegolf.meta.stackexchange.com/q/20861/66833), and nice first answer!",
        "7": "[Welcome to Code Golf!](https://codegolf.meta.stackexchange.com/q/20861/66833) This site is for competitive programming, so we require answers to have code.",
        "8": "[Welcome to Code Golf!](https://codegolf.meta.stackexchange.com/q/20861/66833) This site is for competitive programming, so we require answers to be a serious contender. Make sure to read our [tips](https://codegolf.stackexchange.com/questions/tagged/tips?tab=Votes) questions if you want some hints!",
        "9": "I've edited this down to a stub now that it's been posted to save space",
    };

    window.addEventListener("keydown", function(e) {
        if (e.code.match(/^Digit\d$/) && e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
            var box = document.activeElement;
            var original = box.selectionStart;

            console.log(MAPPING[e.code[5]]);

            box.value = box.value.slice(0, box.selectionStart) + (MAPPING[e.code[5]] || "") + box.value.slice(box.selectionEnd);
            box.selectionStart = box.selectionEnd = original + (MAPPING[e.code[5]] || "").length;
        }
    });
})();