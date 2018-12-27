const router = require('koa-router')()
let request = require('request')
const querystring=require('querystring')
const cheerio=require('cheerio')
const mysql=require('mysql')
router.get('/',async(ctx,next) => {
    // let paras =ctx.request.query
    let username='16122175';
    let password='ZJqYCP0310';

    const pool  = mysql.createPool({
        host     : '127.0.0.1',   // 数据库地址
        user     : 'root',    // 数据库用户
        password : '123456',   // 数据库密码
        database : 'cardbill'  // 选中数据库
    })
    let login_url='http://card.shu.edu.cn/api/Sys/Users/Login';
    let card_cookie='';


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
                resolve(response.headers['set-cookie'])
                // console.log(body)

            })
            })
        }


    card_cookie=await get_cookie()

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
        })
        })

    }

// console.log(test)
// console.log(result)
// console.log(2)


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
            // console.log(body)
                        let $=cheerio.load(body)
            // console.log(fruits)
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
        // console.log(start_date)
        // console.log(end_date)
        let search_para=await get_para()
        search_para.ctl00$ContentPlaceHolder1$StartDate=start_date
        search_para.ctl00$ContentPlaceHolder1$EndDate=end_date
        let data=await get_billdata(search_para)
        await store_billdata(data)
        start_date=new Date(new Date(end_date).getTime()+86400*1000).Format("yyyy-MM-dd hh:mm:ss")


    }
}
store_all()

    ctx.body='99'
}
)

router.get('/string', async (ctx, next) => {
  ctx.body = 'koa2 string'
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

module.exports = router
