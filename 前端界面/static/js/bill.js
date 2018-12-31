'use strict';
function notNull(val) {
    if (!val) {
        return 0;
    } else {
        return val;
    }
}

/****
 * 钱格式化
 * @p aram n
 * @param x
 * @returns {string}
 */
Number.prototype.format = function (n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};


/***
 *  定义动画
 * @type {{}}
 */
var animation = {};
animation.initAnimationItems = function () {
    $('.animated').each(function () {
        var aniDuration, aniDelay;

        $(this).attr('data-origin-class', $(this).attr('class'));

        aniDuration = $(this).data('ani-duration');
        aniDelay = $(this).data('ani-delay');

        $(this).css({
            'visibility': 'hidden',
            'animation-duration': aniDuration,
            '-webkit-animation-duration': aniDuration,
            'animation-delay': aniDelay,
            '-webkit-animation-delay': aniDelay
        });
    });
};

animation.playAnimation = function (dom) {
    this.clearAnimation();

    var aniItems = $(dom).find('.animated');

    $(aniItems).each(function () {
        var aniName;
        $(this).css({'visibility': 'visible'});
        aniName = $(this).data('ani-name');
        $(this).addClass(aniName);
    });
};

animation.clearAnimation = function () {
    $('.animated').each(function () {
        $(this).css({'visibility': 'hidden'});
        $(this).attr('class', $(this).data('origin-class'));
    });
};

let chartdata=''
let bills={}
bills.initOther = function () {
    $('.loading-overlay').hide();
    //初始化，动画效果
    animation.initAnimationItems();
    //初始化画布
    $(".item").show();
    //初始化滚动效果
    fullscreen.init({
        'type': 2, 'useArrow': true,
        'useMusic':{src:"static/images/bill.mp3"},
        'pageShow': function (dom) {//页面出现时候
            animation.playAnimation(dom);
            console.log($(dom).index())
            if($(dom).index()==7){
                $('.overlay').hide();
            }
            if ($(dom).index() == 5 && myChart == null ) { //&& parseFloat($("#typeAmount").attr("data")) > 0
                //绘制饼图
                console.log(chartdata)
                var myChart = echarts.init(document.getElementById('piechart'));

                // 指定图表的配置项和数据
                var option = {
                    title: {
                        text: ''
                    },
                    tooltip: {},
                    legend: {
                        show:false,
                        orient: 'vertical',
                        x: 'right',
                        data:['IC消费','浴室','图书馆','医院','其他']
                    },
                    series: [{
                        name: '消费',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        label: {
                            normal:{
                                show:true,
                                color:'#fff'
                            },
                            emphasis: {
                                show: true,
                                textStyle: {
                                    fontSize: '30',
                                    fontWeight: 'bold'
                                }
                            }
                        },
                        labelLine: {
                            normal: {
                                show: true
                            }
                        },
                        data: [
                            {value:$('#yearEarnings').text()-chartdata.IC-chartdata.shawer-chartdata.libary-chartdata.hostipal, name:'其他',itemStyle:{color:'#FFFFCC'}},
                            {value:chartdata.IC, name:'IC消费',itemStyle:{color:'#CCFFFF'}},
                            {value:chartdata.shawer, name:'浴室'},
                            {value:chartdata.libary, name:'图书馆'},
                            {value:chartdata.hostipal, name:'医院'}
                        ]
                    }]
                };
        
                // 使用刚指定的配置项和数据显示图表。
                myChart.setOption(option);
            }
        }, 'pageHide': function (dom) {//页面被隐藏
 //
        }
    });
    //强制执行动画
    animation.playAnimation($(".item2"));
};

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

$(document).ready(function () {
    let url_para = window.location.search; //获取url中"?"符后的字串
    if (url_para.indexOf("?") != -1) {  //判断是否有参数
     let str = url_para.substr(1); //从第一个字符开始 因为第0个是?号 获取所有除问号的所有符串
     let strs = str.split("=");  //用等号进行分隔 （因为知道只有一个参数 所以直接用等号进分隔 如果有多个参数 要用&号分隔 再用等号进行分隔）
     let username=strs[1]
      username=username.substr(0,8)
     console.log(username)
     $.ajax({
        url: 'http://localhost:3000/json',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({username}),
        success: function(data) {
            data=data.title[0]
            chartdata=data
            console.log(data);
            let total=JSON.parse(data.total)
            for(let i in total){
                // console.log(total[i],i)
                if(i=='sum(amount)') $('#yearEarnings').text(total[i])
                else $('#yearInvests').text(total[i])
            }
            let early=JSON.parse(data.early)
            let early_=(early.date).split(' ')
            // let date=early_[0].substr(0,4)
            // console.log(date)
            let earlydate=early_[0].substr(0,4)+'年'+early_[0].substr(5,2)+'月'+early_[0].substr(8,2)+'日'
            let earlytime=early_[1]
            // let earlydate=new Date(early.date).Format("yyyy年MM月dd日")  部分浏览器无法显示
            // let earlytime=new Date(early.date).toLocaleTimeString()
            // console.log(early)
            $('#early_date').text(earlydate)
            $('#earlytime').text(earlytime)
            $('#earlymoney').text(early.amount)

            let late=JSON.parse(data.later)
            let late_=(late.date).split(' ')
            // console.log(late)
            let latedate=late_[0].substr(0,4)+'年'+late_[0].substr(5,2)+'月'+late_[0].substr(8,2)+'日'
            let latetime=late_[1]
            // let latedate=new Date(late.date).Format("yyyy年MM月dd日")
            // let latetime=new Date(late.date).Format("hh:mm:ss")
            $('#latedate').text(latedate)
            $('#latetime').text(latetime)
            $('#latemoney').text(late.amount)

            $("#recharge").text(data.recharge)

            let highest=JSON.parse(data.highest)
            // console.log(highest)
            $("#mostbilldate").text(highest.date)
            $("#mostbillmoney").text(highest.amount)

            let daymoney=JSON.parse(data.daymoney)
            $("#daymostmoney").text(daymoney.daymoney)
            $("#daymostdate").text(daymoney.singleday)

            $("#shower").text(data.shawer)
            $("#hospital").text(data.hostipal)
            $("#libary").text(data.libary)

            $('#rank').text(data.rank)
        }
    })
    }

    bills.initOther();
    //开启下一页
    $(".btn").click(function () {
        var item = $('.item2');
        item.attr('state', 'prev');
        item.siblings('.item').removeAttr('state');

        var currentItem = item.next();
        currentItem.attr('state', 'next');

        item.css('-webkit-transform', 'scale(.8)');
        item.next().css('-webkit-transform', 'translate3d(0,0,0)');
        return false;
    });

    // $("#share").on("click", function () {
    //     console.log('124')
    // });

});


!(function(win, doc){
    function setFontSize() {
        // 获取window 宽度
        // zepto实现 $(window).width()就是这么干的
        var winWidth =  window.innerWidth;
        // doc.documentElement.style.fontSize = (winWidth / 640) * 100 + 'px' ;

        // 2016-01-13 订正
        // 640宽度以上进行限制 需要css进行配合
        var size = (winWidth / 640) * 100;
        doc.documentElement.style.fontSize = (size < 100 ? size : 100) + 'px' ;
    }

    var evt = 'onorientationchange' in win ? 'orientationchange' : 'resize';

    var timer = null;

    win.addEventListener(evt, function () {
        clearTimeout(timer);

        timer = setTimeout(setFontSize, 300);
    }, { passive: false });

    win.addEventListener("pageshow", function(e) {
        if (e.persisted) {
            clearTimeout(timer);

            timer = setTimeout(setFontSize, 300);
        }
    }, { passive: false });

    // 初始化
    setFontSize();

}(window, document));