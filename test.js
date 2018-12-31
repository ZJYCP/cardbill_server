const mysql=require('mysql')
const pool  = mysql.createPool({
    host     : '127.0.0.1',   // 数据库地址
    user     : 'root',    // 数据库用户
    password : '123456',   // 数据库密码
    database : 'cardbill',
    timezone:"08:00",
    multipleStatements: true// 选中数据库
})
//总消费
let total="select sum(amount) as total from bill where username='16122175' and amount>0"


//最高消费
let highest="select * from cardbill.bill where username='16122175' order by amount desc limit 1"

//最早消费
let early="select * from cardbill.bill where DATE_FORMAT(`date`,'%H:%i:%s')=(select MIN(DATE_FORMAT(`date`,'%H:%i:%s')) from cardbill.bill WHERE amount >0)"

//最晚消费
let later="select * from cardbill.bill where DATE_FORMAT(`date`,'%H:%i:%s')=(select MAX(DATE_FORMAT(`date`,'%H:%i:%s')) from cardbill.bill WHERE amount >0)"

// 当日最高消费
let daymoney="SELECT a.* FROM (SELECT DATE(`date`) as singleday,SUM(amount) as daymoney FROM cardbill.bill where amount>0 GROUP BY DATE(`date`))as a ORDER BY daymoney DESC LIMIT 1"

// 充值金额
let recharge="select -1*sum(amount) as recharge from bill where `usage` like '%支付宝%' or `usage` like '%微信%' "


// 医院消费
let hostipal="select IFNULL(sum(amount), 0.0) as hostipal from bill where `usage` like '%医院%'"


//浴室消费
let shawer="select IFNULL(sum(amount), 0.0) as shawer from bill where `usage` like '%洗澡%'"

//图书馆
let libary="select IFNULL(sum(amount), 0.0) as libary from bill where `usage` like '%图书馆%'"


// 消费排行


//IC消费
let IC="select IFNULL(sum(amount), 0.0) as IC from bill where `usage` in ('IC卡消费','POS消费')"

let sql_query=total+';'+highest+';'+early+';'+later+';'+daymoney+';'+recharge+';'+hostipal+';'+shawer+';'+libary+';'+IC


let data=new Array()
data[0]='16122175'
pool.getConnection(function(err, connection) {
    connection.query(sql_query,  (error, results, fields) => {
        if(results) {
            data[1]=results[0][0].total
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
            let insert_sql="insert into analysed(`username`,`total`,`highest`,`early`,`daymoney`,`later`,`recharge`,`hostipal`,`shawer`,`libary`,`IC`,`rank`) values "+connection.escape(newdata)
            connection.query(insert_sql,  (error, results, fields) => {
            if(results) console.log(results)
            if(error) console.log(error)
        })
        }

        if(error) console.log(error)
        connection.release();
        })
})


