// ==UserScript==
// @name         Sandbox Viewer
// @namespace    https://github.com/vihanb/PPCG-SandboxViewer
// @version      2.7
// @description  PPCG Sandbox Viewer
// @author       Downgoat
// @match        *://*.stackexchange.com/*
// @grant        GM_xmlhttpRequest
// @connect      codegolf.meta.stackexchange.com
// @updateURL    https://rawgit.com/vihanb/PPCG-SandboxViewer/master/viewer.v2.user.js
// ==/UserScript==

function InjectSandboxScript() {

  console.log("PPCG Sandbox Viewer Running");

  var OPENED = false;
  $("body").prepend('<div id="SandboxViewer" style="display:none; width: inherit; height: inherit;"></div>');
  $("body").prepend('<div id="SandboxPopdisp" style="display: none; z-index: 5; position: fixed; background: rgba(0, 0, 0, 0.75); color: white; top: 50%; left: 50%; line-height: 70px; text-align: center; font-size: 36px; font-weight: bold; height: 70px; width: 120px; border-radius: 8px; -webkit-transform: translateY(-50%) translateX(-50%); transform: translateY(-50%) translateX(-50%);"></div>');
  $('#SandboxViewer').prepend('<div id="SandboxBlur" style="position: fixed;z-index:3000;width:100%;height:100%;background:rgba(0,0,0,0.5)"></div>');
  $('#SandboxViewer').append('<div id="SandboxContent" style="position: fixed; overflow: scroll; z-index: 3001; width: 100%; height: 100%;box-sizing:border-box;top: 50%;left: 50%;-webkit-transform: translateY(-50%) translateX(-50%);transform: translateY(-50%) translateX(-50%);background: #FAFAFA;padding: 1.2em;display: -webkit-flex;display: flex;"><div style="color: gray;position: fixed;cursor: pointer;top: 0px;left: 5px;font-size: 14px;" id="closeviewer">x</div><span id="USERLOAD">Loading...</span></div>');

  $(".top-bar .-secondary").append('<li><a id="SandboxViewerToggle" class="topbar-icon yes-hover" style="z-index:1;background-repeat: no-repeat;display:block;height: 36px;width: 36px; background-image: url(https://i.stack.imgur.com/lBskr.png); background-size: 19px 19px; background-position: 8px 7px"></a></li>');

  var POSTCOUNTER = 0;

  var ALLPOSTS = null;

  function PopupDisplay(text) {
    $("#SandboxPopdisp").html(text);
    $("#SandboxPopdisp").fadeIn(200, function () {
      $(this).delay(1000).fadeOut(200);
    });
  }

  function VotePost(post, state) {
    // States:
    // 2 - Upvote
    // 3 - Downvote
    // 10- Delete
    // Post: https://<site>.com/posts/<post_id>/vote/<state>
    GM_xmlhttpRequest({
      method: "POST",
      data: "fkey=" + StackExchange.options.user.fkey,
      url: post+"/vote/"+state,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      onload:function(response) {
      }
    });
  }
  function PostPost(title, body, id) {
    console.log(title, body);
    GM_xmlhttpRequest({
      method: "POST",
      data:"qualityBanWarningShown=False&priorAttemptCount=0&title="+title+"&post-text="+encodeURIComponent(body)+"&fkey=" + StackExchange.options.user.fkey + "&author=&wmd-input-42=&tagnames=" + body.match(/\[tag:[^\]]+/g).map(function(l){return l.slice(5);}).join(","),
      url: "https://codegolf.stackexchange.com/questions/ask/submit/",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      onload:function(response){
        var url  = (response.responseText.match(/<meta property="og:url" content="([^"]+)/)||[])[1];
        var title= $(response.responseText).find("title").text();
        var win = window.open(url, title || "Post From the Sandbox");
        VotePost("https://codegolf.meta.stackexchange.com/posts/" + id, 10);
        win.document.write(response.responseText);
      }
    });
    /*
qualityBanWarningShown=False
priorAttemptCount=0
title=Title
post-text=Post Text
&fkey=6ee389d149f11254dcdb48f1951bde39
author=
N/A - i1l=paJXO3BPSH4DO0J6scE0O0t++dqGmOIuxSBMxRqy4Gs=
tagnames=discussion,code-golf
wmd-input-42=
*/
  }

  function ConstructPost(post) {
    $(".FVoteActive").removeClass("FVoteActive");
    $(".FVoteUp").attr('src', 'https://i.stack.imgur.com/EQ1ko.png');
    $(".FVoteDown").attr('src', 'https://i.stack.imgur.com/OwtQb.png');
    return '<div>' + post.body + '</div>';
  }

  function UpdatePreviewComments(posts) {
    var Comments = GetComments([posts[POSTCOUNTER]]).reverse();
	  console.log("obtained comments: ", Comments);
    var LIMIT = 2;
    var a = false;
    if (Comments.length > LIMIT) a = true;
    $("#SandboxPreviewComments").html( (a ? '<div style="padding: 5px 2px; border-bottom: 1px solid #DDD; margin-bottom: 3px;"><a id="SPshow">(show all)</a></div>' : "") + Comments.map(function(comment,index,a) {
      return '<div class="'+(a.length-index>LIMIT?"SPrevH":"")+'" style="'+(a.length-index>LIMIT?"display:none;":"")+'padding: 5px 2px; border-bottom: 1px solid #DDD; margin-bottom: 3px;">'+
        '<a href="https://codegolf.stackexchange.com/users/'+comment.userid+'">' + comment.user +
        '</a>: <span>'+comment.text+'</span> &mdash; <a href="'+comment.link+'">'+
        TimeSince(comment.timestamp)+'</a> </div>'
    }).join("\n") + "<div><textarea id=\"FCText\" placeholder=\"Comment...\" style=\"height: 30px;width: 80%;outline: none;border-radius: 2px;\"></textarea><button id=\"FComment\" style=\"vertical-align: top;max-width: 20%;margin-left: 8px;\">Post</button></div>");
    $('#FCText').keyup(function (e) {
      if ( (e.keyCode || e.which) === 13 ) $("#FComment").click();
    });
    $(document).on('click', "#SPshow", function() {
      $(".SPrevH").show();
      $("#SPshow").html("(hide some comments)");
      $("#SPshow").attr("id", "SPhide");
    });

    $(document).on('click', "#SPhide", function() {
      $(".SPrevH").hide();
      $("#SPhide").html("(show all comments)");
      $("#SPhide").attr("id", "SPshow");
    });
  }

  function INITVIEWER(posts) {

    ALLPOSTS = posts;

    function CommentPost(post, comment) {
		console.log(post + "/comments/", "fkey=" + StackExchange.options.user.fkey + "&comment=" + encodeURIComponent(comment));
      GM_xmlhttpRequest({
        method: "POST",
        data: "fkey=" + StackExchange.options.user.fkey + "&comment=" + encodeURIComponent(comment),
        url: post+"/comments/",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        onload:function(response){
		  if (response.status === 500) {
			  alert("Error posting. Is your comment > 15 chars?");
		  } else {
			  PopupDisplay(" &nbsp;Posted. &nbsp;");
			  UpdatePreviewComments(posts);
		  }
        }
      });
    }

    var HTML = "";
    HTML += '<div><div style="text-align: left; float: left; margin-bottom: 10px;">'+
      '<button class="FLink">See in Sandbox</button><button id="FBOwnerBack" style="display: none">Back</button><br>'+
      '<button id="FPREV" disabled>Previous Challenge</button> <button class="sandboxbtn FNEXT">Next</button><button id="FHIDE">Don\'t show this again</button></div>'+
      '<div id="FBWrapper" style="text-align: right; float: right; margin-top: 15px;">' +

      '<img style="height: 40px; cursor: pointer" src="https://i.stack.imgur.com/EQ1ko.png" class="FVoteUp">' +
      '<img style="height: 40px; cursor: pointer" src="https://i.stack.imgur.com/OwtQb.png" class="FVoteDown">'+
      '</div></div>'+

      '<div id="FBOwner" style="display: none"></div>' +

      '<div id="SandboxChallengePreview" style="width: 100%;flex: 1;overflow: scroll; box-shadow: 0px 0px 2px #CCC inset; padding: 12px;">' + ConstructPost(posts[POSTCOUNTER]) + '</div><div id="SandboxPreviewComments"></div>';

    $("#SandboxContent").append('<div style="width: 63%; margin-left: 2%; -webkit-flex-direction: column; flex-direction: column; display: flex;">' + HTML + '</div>');
    UpdatePreviewComments(posts);
    $(".sandboxbtn").click(function() {
      $("#SandboxChallengePreview, #SandboxPreviewComments").fadeTo(100, 0, function() {
        setTimeout(function() {
          $("#SandboxChallengePreview").html(ConstructPost(posts[++POSTCOUNTER]));
          UpdatePreviewComments(posts);
          $("#SandboxChallengePreview, #SandboxPreviewComments").fadeTo(100, 1);
          if(POSTCOUNTER === 0) $("#FPREV").prop('disabled', true);
          else $("#FPREV").prop('disabled', false);
        }, 200);
      });
    });
    $("#FPREV").click(function(){
      $("#SandboxChallengePreview, #SandboxPreviewComments").fadeTo(100, 0, function() {
        setTimeout(function() {
          $("#SandboxChallengePreview").html(ConstructPost(posts[--POSTCOUNTER]));
          UpdatePreviewComments(posts);
          $("#SandboxChallengePreview, #SandboxPreviewComments").fadeTo(100, 1);
          if(POSTCOUNTER === 0) $("#FPREV").prop('disabled', true);
          else $("#FPREV").prop('disabled', false);
        }, 200);
      });
    });
    $("#FHIDE").click(function() {
      var H=JSON.parse(localStorage.getItem("FHIDE") || '[]');
      H.push(posts[POSTCOUNTER].id);
      localStorage.setItem("FHIDE", JSON.stringify(H));
      $(".FNEXT").click();
    });
    $(document).on('click', ".FVoteUp:not(.FVoteActive)", function() {
      VotePost("https://codegolf.meta.stackexchange.com/posts/" + posts[POSTCOUNTER].id, 2);
      // PopupDisplay("+1'd"); 
      $(".FVoteActive").removeClass("FVoteActive");
      $(".FVoteDown").attr('src', 'https://i.stack.imgur.com/OwtQb.png');
      $(".FVoteUp").attr('src', 'https://i.stack.imgur.com/iu7y5.png');
      $(".FVoteUp").addClass("FVoteActive");
    });
    $(document).on('click', ".FVoteDown:not(.FVoteActive)", function() {
      VotePost("https://codegolf.meta.stackexchange.com/posts/" + posts[POSTCOUNTER].id, 3);
      // PopupDisplay("-1'd"); 
      $(".FVoteActive").removeClass("FVoteActive");
      $(".FVoteUp").attr('src', 'https://i.stack.imgur.com/EQ1ko.png');
      $(".FVoteDown").attr('src', 'https://i.stack.imgur.com/LyK6V.png');
      $(".FVoteDown").addClass("FVoteActive");
    });
    $(document).on('click', ".FVoteActive", function() {
      VotePost("https://codegolf.meta.stackexchange.com/posts/" + posts[POSTCOUNTER].id, 0);
      // PopupDisplay("&plusmn;0");
      $(".FVoteActive").removeClass("FVoteActive");
      $(".FVoteUp").attr('src', 'https://i.stack.imgur.com/EQ1ko.png');
      $(".FVoteDown").attr('src', 'https://i.stack.imgur.com/OwtQb.png');
    });
    $(document).on('click', "#FComment", function() {
      CommentPost("https://codegolf.meta.stackexchange.com/posts/" + posts[POSTCOUNTER].id, $("#FCText").val());
    });
    $(".FLink").click(function(){ window.open(posts[POSTCOUNTER].url, "_blank"); });
    $(".Fmtom").click(function(){ Request("GET", "https://api.stackexchange.com/2.2/answers/"+$(this).data('postid')+"?order=desc&sort=activity&key=Ccn4VoktkZPX*Haf3)iubw((&site=meta.codegolf&filter=!GeEyUcJFJeRCA", function(response) {
      var res = JSON.parse(response.responseText).items[0].body_markdown;
      PostPost(GetPostTitle(res), res, $(this).data('postid'));
    }); });
  }

  $(document).on('click', "#SandboxViewerToggle", function() {
    $('#SandboxViewer').fadeIn(100);
    if (OPENED === false) {
      OPENED = true;
      $("#SandboxViewerToggle").css("background-image", "url(https://i.stack.imgur.com/lBskr.png)");
      GetChallenges(StackExchange.options.user.userId, function(posts, anposts) {
        var HTML = "";
        HTML += '<h1>Your Sandboxed Posts</h1><div><ul>' + (posts.map(function(post, index) {
          return '<li><b><a class="OPENPOST" data-idn="' + index + '">' + post.title + '</a></b>' +
            '<br><span>score: <span style="color: green;">+' + post.score.up + '</span>'+
            ' <span style="color: red">-' + post.score.down + '</span></span>' +
            '<br><span>active: ' + TimeSince( post.active ) + '</span>'
          // + '<br><a class="Fmtom" data-postid="'+post.id+'">Post to main</a></li>';
        }).join("\n") || "</ul><div>You currently have no Sandboxed posts</div><ul>") + '</ul></div>';

        $(document).on('click', ".OPENPOST", function() {
          var POST = posts[$(this).data('idn')];
          var PID  = +$(this).data('idn');
          if (POST) {
            var NOWRITEC = Number(POSTCOUNTER);

            $("#SandboxChallengePreview, #SandboxPreviewComments").fadeTo(100, 0, function() {
              setTimeout(function() {
                $("#SandboxChallengePreview").html(ConstructPost(POST));
                POSTCOUNTER = PID;
                UpdatePreviewComments(posts);
                $("#SandboxChallengePreview, #SandboxPreviewComments").fadeTo(100, 1);
                $("#FBOwnerBack").show();
                if(POSTCOUNTER === 0) $("#FPREV").prop('disabled', true);
                else $("#FPREV").prop('disabled', false);
              }, 200);
            });

            $(document).on('click', "#FBOwnerBack", function() {
              $("#SandboxChallengePreview, #SandboxPreviewComments").fadeTo(100, 0, function() {
                setTimeout(function() {
                  console.log(posts[NOWRITEC], posts, NOWRITEC, PID, POST, POSTCOUNTER);
                  $("#SandboxChallengePreview").html(ConstructPost(anposts[NOWRITEC]));
                  POSTCOUNTER = NOWRITEC;
                  UpdatePreviewComments(anposts);
                  $("#SandboxChallengePreview, #SandboxPreviewComments").fadeTo(100, 1);
                  $("#FBOwnerBack").hide();
                  if(POSTCOUNTER === 0) $("#FPREV").prop('disabled', true);
                  else $("#FPREV").prop('disabled', false);
                }, 200);
              });
            });
          } else {
            if (!PID) {
              alert("An error occured identifying this sandbox post.");
            } else if (POST) {
              alert("This post is too old to load.");
            }
          }
        });

        HTML += '<h1>Latest Activity</h1><div>' + (GetComments(posts).map(function(comment, i, a) {
          return '<div '+
            (i == a.length - 1 ? "" : ' style="border-bottom: 1px solid #DDD; padding-bottom: 8px; margin-bottom: 8px"')+'><b><a href="' + comment.postlink + '">' + comment.post + '</a></b>, <a href="https://codegolf.stackexchange.com/users/' + comment.userid + '">' + comment.user + '</a>: ' + comment.text + " - <a href=\"" + comment.link + "\">" + TimeSince(comment.timestamp) + "</a></div>";
        }).join("") || "<div>You currently have no Sandboxed posts</div>") + '</div>';
        $("#SandboxContent").prepend('<div style="width: 33%; -webkit-flex-direction: column; flex-direction: column; overflow: auto;">' + HTML + "</div>");
      });
      GetChallenges("*nofilter*", INITVIEWER);
      $("#USERLOAD").remove();
    }
  });

  $('#SandboxBlur, #closeviewer').click(function() {
    $('#SandboxViewer').fadeOut(100);
  });

  /*== Functions ==*/
  function FormatDate(d) {
    return [d.getMonth() + 1, d.getDate(), d.getYear()+1900].join('/') + ' ' +
      [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()].join(':');
  }

  function TimeSince(d) {
    var s = Math.floor((new Date() - new Date(+(d+'e3'))) / 1000);
    var interval = Math.floor(s / 31536000);
    if (interval > 1) return interval + " years ago";
    interval = Math.floor(s / 2592000);
    if (interval > 1) return interval + " months ago";
    interval = Math.floor(s / 86400);
    if (interval > 1) return interval + " days ago";
    interval = Math.floor(s / 3600);
    if (interval > 1) return interval + " hours ago";
    interval = Math.floor(s / 60);
    if (interval > 1) return interval + " minutes ago";
    return Math.floor(s) + " seconds ago";
  }

  function GetComments(posts) {
    return posts.reduce(function(data, post) {
      var comments = post.comments || [];
      comments.forEach(function(cm) {
        data.push({
          timestamp: cm.creation_date,
          user: cm.owner.display_name,
          userid: cm.owner.user_id,
          postlink: post.post.link,
          link: cm.link,
          text: cm.body,
          post: GetPostTitle(post.post.body_markdown)
        });
      });
      data.sort(function(a, b) {
        return b.timestamp - a.timestamp;
      });
      return data;
    }, []);
  }

  function GetPostTitle(markdown) {
    return (markdown.match(/(?:\n|^)#+(.+)/) || ["", "Unknown Title"])[1];
  }

  function GetPostData(p) {
    return {
      title: GetPostTitle(p.body_markdown),
      score: {
        up: p.up_vote_count,
        down: p.down_vote_count
      },
      url: p.link,
      comments: p.comments,
      id: p.answer_id,
      body: p.body,
      post: p,
      active: p.last_activity_date
    };
  }

  function GetChallenges(userid, callback) {
    GetUserPosts(userid, function(posts, all) {
      if (all) callback(posts.map(GetPostData), all.map(GetPostData));
      else callback(posts.map(GetPostData));
    });
  }

  function OpenSockets() {
    var ws = new WebSocket("wss://qa.sockets.stackexchange.com/");
    ws.onmessage = function(e) {
      // If this shows up then it's good
      console.log("Hi, you must be looking at your console wondering what the heck this message means. It means you should be happy that this message is being logged otherwise something very wrong happened");
      try {
        var wsd = JSON.parse(JSON.parse(e.data).data);
        if (wsd.a === "answer-add") {
          // answer added
          $("#SandboxViewerToggle").css("background-image", "url(https://i.stack.imgur.com/COtrF.png)");
        }
      } catch(e) {
        console.log("error during websocket update");
      }
    };
    ws.onopen = function() {
      ws.send("202-question-2140");
    }
  }

  if (true) OpenSockets(); // Use WS?

  function GetUserPosts(userid, callback) {
    ///
    var hideitem = JSON.parse(localStorage.getItem("FHIDE") || '[]');
    if (userid === "*nofilter*") {
      Request("GET", "https://api.stackexchange.com/2.2/questions/2140/answers?order=desc&sort=activity&key=Ccn4VoktkZPX*Haf3)iubw((&site=meta.codegolf&filter=!-2qNq(tTGQYRU3SZ87hedUU)5htvSK6RNae3(IkBC-M8i", function(req) {
        var items = JSON.parse(req.response).items;
        callback(items.filter(function(item) {
          return !~hideitem.indexOf(item.answer_id) && item.owner.user_id !== StackExchange.options.user.userId;
        }));
      });
    } else {
      Request("GET", "https://api.stackexchange.com/2.2/search/excerpts?order=desc&sort=activity&title=Sandbox%20for%20Proposed%20Challenges&user="+StackExchange.options.user.userId+"&site=meta.codegolf", function(data) {
        var items = JSON.parse(data.response).items;
        function Loop(i, a) {
          if (i > items.length - 1) {
            GetUserPosts("*nofilter*", function (nonposts) {
              callback(a, nonposts);
            });
          } else {
            Request("GET", 'https://api.stackexchange.com/2.2/answers/'+items[i].answer_id+'?pagesize=100&order=desc&sort=activity&site=meta.codegolf&filter=!-2qNq(tTGQYRU3SZ87hedUU)5htvSK6RNae3(IkBC-M8i', function(r) {
              a.push(JSON.parse(r.response).items[0]);
              Loop(i + 1, a);
            });
          }
        }
        Loop(0, []);
      });
    }
  }

  function Request(type, url, callback) {
    var r = new XMLHttpRequest();
    r.onreadystatechange = function() {
      if (r.readyState === 4)
        if (r.status === 200) callback(r);
    };
    r.open(type, url);
    if (type.toUpperCase() === "POST") r.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    r.send();
  }
}

InjectSandboxScript();


