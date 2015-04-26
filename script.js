(function(angular) {
  'use strict';
var app = angular.module('app', ['ngResource']);

app.controller('Ctrl', ['$scope','$resource','$http', function($scope,$resource,$http) {
  $scope.getTitles = function(sub) {
    $http.jsonp('http://www.reddit.com/r/'+sub+'.json?limit=100&jsonp=JSON_CALLBACK')
      .success(function(res) {
        $scope.titles = res.data.children
      })
  }

  if (typeof(Storage) != "undefined") {
    if (localStorage.getItem("firstTime") === null) {
      $scope.firstTime = true
      localStorage.setItem("firstTime", false);
    } else {
      $scope.firstTime = false
    }
  }
  $scope.continuous = true
  $scope.played = []
  $scope.curPlay = 0
  $scope.getComments = function (post) {
    $http.jsonp('http://www.reddit.com/comments/'+post+'.json?jsonp=JSON_CALLBACK')
      .success(function(res) {
        $scope.comments = res[1].data.children
        $scope.comments.unshift({data:{body:res[0].data.children[0].data.title+" \n "}})
        $scope.read(0,true)
      })
  }
  $scope.read = function(curIdx,clicked,curPlay) {
    if (clicked) {
      $scope.stopped = false
      $scope.curPlay +=1
      curPlay = $scope.curPlay
      $scope.played = []
      if (window.speechSynthesis !== undefined) {
        window.speechSynthesis.cancel()
      }
    }
    if (!$scope.stopped) {


      if ($scope.played.some(function(cur) {return cur === curIdx}) ||
        $scope.curPlay !== curPlay) {
          return
      } else {
        $scope.played.push(curIdx)
      }

      var comment = $scope.comments[curIdx].data.body
        .replace(/\b(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?\b/g,'link')
      if (window.speechSynthesis !== undefined) {
        if ($scope.continuous) {
          nativetts(comment,function(){
            setTimeout(function(){
              $scope.read(curIdx+1,false,curPlay)
              $scope.$apply()
            },1000)
            })
        } else {
          nativetts(comment)
        }

      } else {
        if (window['aud'+$scope.curPlay] !== undefined) {
          window['aud'+$scope.curPlay].pause()
        }
        if ($scope.continuous) {
          apitts(comment,function(){setTimeout(function(){$scope.read(curIdx+1,false,curPlay);$scope.$apply()},1000)})
        } else {
          apitts(comment)
        }

      }

    }
  }
  $scope.stop = function() {
    $scope.stopped = true
    ++$scope.curPlayed
    if (window.speechSynthesis !== undefined) {
      window.speechSynthesis.cancel()
    } else {
      window.aud.pause()
    }
  }

  function nativetts(txt,cb) {
    var arr = [];
    var element = this;
    while (txt.length > 0) {
        arr.push(txt.match(pattRegex)[0]);
        txt = txt.substring(arr[arr.length - 1].length);
    }
    $.each(arr, function () {
        var u = new SpeechSynthesisUtterance(this.trim())
        u.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Alex'; })[0];
        window.speechSynthesis.speak(u)
        u.onend = cb
    })

  }
  $scope.getLink = function(idx) {
    return 'http://reddit.com/'+$scope.titles[idx].data.permalink
  }
  $scope.custsub='askscience'
  $scope.getTitles('askscience')

}])
})(window.angular);
var chunkLength = 150;
var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
var u = new SpeechSynthesisUtterance()
u.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Alex'; })[0];

function apitts(txt,cb) {
  if (window.aud !== undefined && window.aud !== null) {window.aud.pause()}
  window.aud = new Audio("http://tts-api.com/tts.mp3?q=" + encodeURIComponent(txt))
  window.aud.play()
  window.aud.addEventListener('ended',cb, false)
}
