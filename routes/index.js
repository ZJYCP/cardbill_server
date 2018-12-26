const router = require('koa-router')()
let request = require('request')
const querystring=require('querystring')
const cheerio=require('cheerio')
router.get('/',async(ctx,next) => {
    // let paras =ctx.request.query
    let username='16122175';
    let password='ZJqYCP0310';


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
// async function foo() {
//     let result=await get_cookie()
//     console.log(result)
// }
// foo()
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

let para=await get_para()
// console.log(test)
// console.log(result)
// console.log(2)

let form={
    "__VIEWSTATE":para.VIEWSTATE,
     "__EVENTVALIDATION":para.EVENTVALIDATION,
    "ctl00$ContentPlaceHolder1$StartDate":'2018-04-19',
    "ctl00$ContentPlaceHolder1$EndDate":'2018-04-29',
    "ctl00$ContentPlaceHolder1$btnSearch":'搜索',
    "__VIEWSTATEGENERATOR":para.VIEWSTATEGENERATOR
}
let formdata=querystring.stringify(form)
let contentLength=formdata.length
    let res = await request({
                method:"POST",
                url:search_url,
                headers:{
                    "Content-Length":contentLength,
                    "Content-Type":"application/x-www-form-urlencoded",
                    "Cookie": card_cookie
                },
                body:formdata

            },(error,response,body)=>{
             console.log(body)

             }
)
// console.log(res.body)
// ctx.body= res.body;
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
