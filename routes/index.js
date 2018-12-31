const router = require('koa-router')()
let request = require('request')
const querystring=require('querystring')
const cheerio=require('cheerio')
const mysql=require('mysql')
const jsSHA=require('jssha')
router.post('/',async(ctx,next) => {

    console.log(ctx.request.body.obj)
    let username=ctx.request.body.obj.username
    let password=ctx.request.body.obj.password


    // let username='16122175';
    // let password='ZJqYCP0310';

    const pool  = mysql.createPool({
        host     : '127.0.0.1',   // 数据库地址
        user     : 'root',    // 数据库用户
        password : '123456',   // 数据库密码
        database : 'cardbill',// 选中数据库
        timezone:"08:00",
        multipleStatements: true
    })
    let login_url='http://card.shu.edu.cn/api/Sys/Users/Login';
    let card_cookie='';

    async function check() {
        return new Promise((resolve,rejects)=>{
            let chech_sql="select count(*) as number from analysed where username="+username
            pool.getConnection(function(err, connection) {
            connection.query(chech_sql,  (error, results, fields) => {

                connection.release();
                if(results) {
                    // console.log(results)
                    resolve(results)
                }
            // 如果有错误就抛出
                else if (error) rejects(error);

            })
            })
        })

    }

    async function get_cookie() {
            return new Promise((resolve,reject)=>{
                request({
                            method:"POST",
                            url:login_url,
                            headers:{
                                "Content-Type":"application/json"
                            },
                            body:{
                                "userName":username,
                                "password":password
                            },
                            json: true
                        },(error,response,body)=>{
                    // console.log(response)
                    resolve(response.headers['set-cookie'])
                // console.log(1)

            })
            })
        }


    card_cookie=await get_cookie()
// console.log(!card_cookie)
    let search_url= "http://card.shu.edu.cn/detail.aspx"
    async function get_para() {
        return new Promise((resolve,reject)=>{
            request({
                        method:'GET',
                        url:search_url,
                headers:{
                    "Cookie": card_cookie,
                    "Content-Type":"application/json"
                }

                    },(e,r,b)=>{
                    let $=cheerio.load(b)
                    let para={}
                    para.VIEWSTATE=$('input[name=__VIEWSTATE]').attr('value')
                    para.VIEWSTATEGENERATOR=$('input[name=__VIEWSTATEGENERATOR]').attr('value')
                    para.EVENTVALIDATION=$('input[name=__EVENTVALIDATION]').attr('value')
                    resolve(para)
        // console.log(2)
        })
        })

    }


    async function get_billdata(search_para) {

        let fruits=new Array()
        let form={
            "__VIEWSTATE":search_para.VIEWSTATE,
            "__EVENTVALIDATION":search_para.EVENTVALIDATION,
            "ctl00$ContentPlaceHolder1$StartDate":search_para.ctl00$ContentPlaceHolder1$StartDate,
            "ctl00$ContentPlaceHolder1$EndDate":search_para.ctl00$ContentPlaceHolder1$EndDate,
            "ctl00$ContentPlaceHolder1$btnSearch":'搜索',
            "__VIEWSTATEGENERATOR":search_para.VIEWSTATEGENERATOR
        }
        let formdata=querystring.stringify(form)
        let contentLength=formdata.length

        return new Promise((resolve,reject)=>{
            request({
                        method:"POST",
                        url:search_url,
                        headers:{
                            "Content-Length":contentLength,
                            "Content-Type":"application/x-www-form-urlencoded",
                            "Cookie": card_cookie
                        },
                        body:formdata
                    },(error,response,body)=>{
                         let $=cheerio.load(body)
                         $('li').each(function(i, elem) {
                            fruits[i]=new Array()
                            fruits[i][0]=username
                            $(this).children('span').each(
                                function (j,el) {
                                // console.log($(this).text())
                                    if(j==2){
                                        let money=parseFloat($(this).text())
                                    fruits[i].push(money)
                                    }else fruits[i].push($(this).text())
                                }
                            )
                        })
                        // console.log(fruits)
                    resolve(fruits)
        // console.log(3)

    })
        })
    }
    async function store_billdata(data) {
        return new Promise((resolve,rejects)=>{
            pool.getConnection(function(err, connection) {
                let sql_query="insert into bill(`username`,`usage`,`date`,`amount`) VALUES "+connection.escape(data)
                // console.log(sql_query)
                connection.query(sql_query,  (error, results, fields) => {
                    // console.log(results.affectedRows)
                    // 结束会话
                    connection.release();
            // console.log(4)

                    if(results.affectedRows) resolve(1)
                    // 如果有错误就抛出
                    else if (error) rejects(error);
                })
            })
        })

    }

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

//
// ctx.body= res.body;
async function store_all() {

    let start_date="2018-04-01 00:00:00"
    for (let loop_time=1;loop_time<=3;loop_time++){
        let end_date=new Date(new Date(start_date).getTime()+90*86400*1000).Format("yyyy-MM-dd hh:mm:ss")
        let search_para=await get_para()
        search_para.ctl00$ContentPlaceHolder1$StartDate=start_date
        search_para.ctl00$ContentPlaceHolder1$EndDate=end_date
        let data=await get_billdata(search_para)
        await store_billdata(data)
        start_date=new Date(new Date(end_date).getTime()+86400*1000).Format("yyyy-MM-dd hh:mm:ss")

    }
    return new Promise((resolve,rejects)=>{

    resolve('store all data success')
    })


}

async function store_analyse(username) {

    let total="select sum(amount),count(*) from bill where amount>0 and username="+username
//最高消费
    let highest="select * from cardbill.bill where username="+username+" order by amount desc limit 1"
//最早消费
    let early="select * from cardbill.bill where DATE_FORMAT(`date`,'%H:%i:%s')=(select MIN(DATE_FORMAT(`date`,'%H:%i:%s')) from cardbill.bill WHERE amount >0 and username="+username+")"
//最晚消费
    let later="select * from cardbill.bill where DATE_FORMAT(`date`,'%H:%i:%s')=(select MAX(DATE_FORMAT(`date`,'%H:%i:%s')) from cardbill.bill WHERE amount >0 and username="+username+")"
// 当日最高消费
    let daymoney="SELECT a.* FROM (SELECT DATE(`date`) as singleday,SUM(amount) as daymoney FROM cardbill.bill where amount>0 and username="+username+" GROUP BY DATE(`date`))as a ORDER BY daymoney DESC LIMIT 1"
// 充值金额
    let recharge="select -1*sum(amount) as recharge from bill where `usage` like '%支付宝%' or `usage` like '%微信%' and username="+username
// 医院消费
    let hostipal="select IFNULL(sum(amount), 0.0) as hostipal from bill where `usage` like '%医院%' and username="+username
//浴室消费
    let shawer="select IFNULL(sum(amount), 0.0) as shawer from bill where `usage` like '%洗澡%' and username="+username
//图书馆
    let libary="select IFNULL(sum(amount), 0.0) as libary from bill where `usage` like '%图书馆%' and username="+username
// 消费排行
//IC消费
    let IC="select IFNULL(sum(amount), 0.0) as IC from bill where `usage` in ('IC卡消费','POS消费') and username="+username
    let sql_query=total+';'+highest+';'+early+';'+later+';'+daymoney+';'+recharge+';'+hostipal+';'+shawer+';'+libary+';'+IC
    let data=new Array()
    console.log(sql_query)
    data[0]=username
    pool.getConnection(function(err, connection) {
        connection.query(sql_query,  (error, results, fields) => {
            if(results) {
                console.log(results)
                data[1]=JSON.stringify(results[0][0])
                data[2]=JSON.stringify(results[1][0])
                data[3]=JSON.stringify(results[2][0])
                data[4]=JSON.stringify(results[3][0])
                data[5]=JSON.stringify(results[4][0])
                data[6]=results[5][0].recharge
                data[7]=results[6][0].hostipal
                data[8]=results[7][0].shawer
                data[9]=results[8][0].libary
                data[10]=results[9][0].IC
                data[11]=1
                let newdata=new Array()
                newdata[0]=data
                // console.log(newdata)
                let insert_sql="insert into analysed(`username`,`total`,`highest`,`early`,`later`,`daymoney`,`recharge`,`hostipal`,`shawer`,`libary`,`IC`,`rank`) values "+connection.escape(newdata)
                connection.query(insert_sql,  (error, results, fields) => {
                    if(results) console.log(results)
                if(error) console.log(error)
            })
            }

            if(error) console.log(error)
        connection.release();
    })
    })
}

let check_flag=JSON.stringify(await check())
console.log(JSON.parse(check_flag)[0].number)

    if (JSON.parse(check_flag)[0].number>=1){
        ctx.body=1
    }else {
        if (!card_cookie){
            ctx.body=-1
        }else {
            ctx.body=0
            await store_all()
            store_analyse(username)

        }

    }
}
)

///TODO 在入口对post账号验证是否已访问过，是的话页面重定向 阿
// 数据分析 存入新表


router.post('/json', async (ctx, next) => {
    const pool  = mysql.createPool({
        host     : '127.0.0.1',   // 数据库地址
        user     : 'root',    // 数据库用户
        password : '123456',   // 数据库密码
        database : 'cardbill',// 选中数据库
        timezone:"08:00",
        multipleStatements: true
    })
    // console.log(ctx.request.body)
    let username=ctx.request.body.username
    console.log(username)
    let data_rank="UPDATE cardbill.analysed SET `rank`=(SELECT b.rownum FROM(SELECT t.*, @rownum := @rownum + 1 AS rownum FROM (SELECT @rownum := 0) r,(SELECT * FROM cardbill.analysed ORDER BY IC DESC) AS t) AS b WHERE b.username = "+username+ ") where username="+username
    let search_query=data_rank+";"+"select * from analysed where username="+username
    let data=''

    async function search_data() {
        return new Promise((resolve,rejects)=>{
            pool.getConnection(function(err, connection) {
            connection.query(search_query,  (error, results, fields) => {
                connection.release();
            if(results) {
                console.log(results)
                resolve(results[1])
            }
            // 如果有错误就抛出
            else if (error) rejects(error);

            })
            })
        })

    }
    data=await search_data()
ctx.body = {
    title: data
}
})

router.post('/share',async(ctx,next)=>{

    async function getconfig() {
        return new Promise((resolve,rejects)=>{
            let url=ctx.request.body.url
            request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx2fadc57dc23ce39b&secret=ac872b9f90e768607c5397a259b816df',(e,r,b)=>{
            // console.log(JSON.parse(b));
            b=JSON.parse(b)
            let ticket_url='https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='+b.access_token+'&type=jsapi'
            request(ticket_url,(e,r,b)=>{
            var createNonceStr = function() {
                return Math.random().toString(36).substr(2, 15);
            };

            // timestamp
            var createTimeStamp = function () {
                return parseInt(new Date().getTime() / 1000) + '';
            };
            let noncestr=createNonceStr()
            let timestamp=createTimeStamp()
            let res=JSON.parse(b)
            // console.log(url)
            var calcSignature = function (ticket, noncestr, ts, url) {
                var str = 'jsapi_ticket=' + ticket + '&noncestr=' + noncestr + '&timestamp='+ ts +'&url=' + url;
                shaObj = new jsSHA(str, 'TEXT');
                return shaObj.getHash('SHA-1', 'HEX');
            }
            var signature = calcSignature(res.ticket, noncestr, timestamp, url);
            let response={noncestr,signature,timestamp}

            resolve(response)
        });

        })
        })
    }


let signature=await getconfig()
        console.log(signature)
ctx.body=signature

})

module.exports = router
