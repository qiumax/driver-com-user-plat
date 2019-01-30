var mongoose = require("mongoose");
var Order = require("../models/Order");
var Company = require("../models/Company");
var Account = require("../models/Account");
var Driver = require("../models/Driver")
var User = require("../models/User")
var Truck = require("../models/Truck")
var Need = require("../models/Need")
var Address = require("../models/Address")
var ComUser = require("../models/ComUser");
var NeedSchedule = require("../models/NeedSchedule")
var Config = require("../config/Config")
var geolib = require("geolib");


var moment = require("moment");
var Dateformat = require("dateformat");
var request  = require('request')

var publishController = {};

publishController.index = function(req, res) {
   console.log('--')
    //车型
	console.log(req.body)
	var user = req.session.passport.user

    Truck.find({}).then(trucks=> {
    	Account.findOne({phone:user}).populate('company').then(account=>{
			var price_dun = account.company.price_dun
		    var account_id = account._id
		    //地址
		    Address.find({account:account_id}).then(adds=>{
		    	//日期
			    var datearr = new Array()
			    var nowdate = new Date()
			    for(var i=1;i<=7;i++){
			    	console.log(nowdate)
				    nowdate.setDate(nowdate.getDate() + 1)
				    console.log(i)
					console.log(nowdate)
				    datearr.push(moment(nowdate).format('YYYY-MM-DD'))
			    }

			    var hourarr = new Array()
			    for(var j=1;j<25;j++){
			    	hourarr.push(j)
			    }

			    var minarr = new Array()
			    for(var k=1;k<61;k++){
			        minarr.push(k)
			    }

			    res.render('publish', {
				    trucks: trucks,
				    price_dun:price_dun,
				    datearr:datearr,
				    hourarr:hourarr,
				    minarr:minarr,
				    adds: adds,
				    account_id:account_id,
				    username: req.session.passport.user
			    })
		    })
	    })
        // //地址
        // Address.find({}).then(adds => {
        //     res.render('publish', {
        //         trucks: trucks,
        //         adds: adds,
        //         username: req.session.passport.user
        //     })
        // })
    })

};

publishController.publish = function (req,res) {
	var body = req.body
	console.log(body)
	//找com_user 根据phone匹配
	ComUser.findOne({phone:req.session.passport.user}).then(comuser=>{
		if(comuser){
			var need = new Need({
				truck: body.truck_id,
				com_user: comuser._id,
				account: body.account_id,
				from: JSON.parse(body.from),
				to: JSON.parse(body.to),
				time: body.time,
				cargo: body.cargo,
				price_type: body.price_type,
				mass: body.mass,
				distance: body.distance,
				volume: body.volume,
				price: body.price,
				size: body.cargo_size,
				truck_type: body.truck_type,
				remark: body.need_remark,
				closed: false
			})
			console.log('*******')
			need.save(function (err) {

				if(err) throw err

				var needSchedule = new NeedSchedule({
					need: need._id,
					run_now: false,
					run_time: new Date().getTime()/1000 + Config.need.schedule_time,
					finished: false
				})

				needSchedule.save(function (err) {
					if(err) throw err
					need.need_schedule = needSchedule._id
					need.save(function (err) {
						if(err) throw err
						res.send({code:1})
					})
				})
			})
		}
		else
		{
			res.send({code:0})
		}
	})

}

publishController.addr_detail = function(req,res){
    var id = req.body.id
    console.log(req.body.id)
    Address.findById(id).then(add=>{
        res.send({
            ok:1,
            add:add
        })
    })
}

publishController.getlongandlan= function(req,res){
    console.log(req.body.add)
    var url = 'https://apis.map.qq.com/ws/geocoder/v1/?key=TSFBZ-YAN3U-S2BVJ-4AP4W-XWEQF-GYFRI&address='+req.body.add
    console.log(url)
    request(encodeURI(url),function (err,resp,data) {
        //console.log(err)
        //console.log(resp)
        console.log(data)
        console.log(data.status)

        res.send(data)

    })
}


publishController.getdistance = function(req,res){

}

module.exports = publishController;
