var req = {
  noncestr: Math.random().toString(),
  url: location.href.split('#')[0]
}

if(!window.request) {
  window.request = function(type, url, body, callback) {
    var xhr = new XMLHttpRequest()
    xhr.open(type, url)
    if (type === "POST" || type === 'post') xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    xhr.send(JSON.stringify(body))

    xhr.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        callback(JSON.parse(this.response))
      }
    }
  }
}

request("POST", "http://localhost:3000/share", req, function (response) {
  wx.config({
    // debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
    appId: 'wx2fadc57dc23ce39b', // 必填，公众号的唯一标识
    timestamp: response.timestamp, // 必填，生成签名的时间戳
    nonceStr: response.noncestr, // 必填，生成签名的随机串
    signature: response.sign,// 必填，签名，见附录1
    jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
  })
})

wx.ready(function () {
  console.log('share')
  var title = '我的2017配件报告出来啦!'
  var desc = '刚刚通过"零零汽"看到我的2017年配件报告,相当精彩,不容错过!恭喜发财!新年旺旺~'
  var link = 'https://007vin.com/activity/activity_page?activity_code=2017myreports'
  var img = 'https://007vin.com/activity/GreetingCard/static/img/share_logo.png'
  // link = 'https://test.007vin.com/activity/activity_page?activity_code=2017myreports'
  // img = 'https://test.007vin.com/activity/GreetingCard/static/img/share_logo.png'

  wx.onMenuShareTimeline({
    title: title, // 分享标题
    link: link + "&auth=" + auth, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
    imgUrl: img, // 分享图标
    success: function () {
      // 用户确认分享后执行的回调函数
      // alert('分享成功')
    },
    cancel: function () {
      // 用户取消分享后执行的回调函数
      // alert('取消分享')
    }
  })
  wx.onMenuShareAppMessage({
    title: title, // 分享标题
    desc: desc, // 分享描述
    link: link + "&auth=" + auth, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
    imgUrl: img, // 分享图标
    success: function () {
      // 用户确认分享后执行的回调函数
      // alert('分享成功')
    },
    cancel: function () {
      // 用户取消分享后执行的回调函数
      // alert('取消分享')
    }
  })
})