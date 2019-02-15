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
var async = require('async')
var geolib = require("geolib");
var fs = require('fs');
var path = require('path');
var xlsx = require('node-xlsx');


var moment = require("moment");
var Dateformat = require("dateformat");
var request  = require('request')
var wait = function (mils) {
	var now = new Date;
	while (new Date - now <= mils);
};
var excelindex = 0
var importneeds =[]
var excelinfo
var resexcel

var publishController = {};

publishController.index = function(req, res) {
   console.log('--')
    //车型
	console.log(req.body)
	var user = req.session.passport.user

    Truck.find({}).then(trucks=> {
    	Account.findOne({phone:user}).populate('company').then(account=>{
			var price_zhengche_notchao = account.company.price_zhengche_notchao
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
				    price_zhengche_notchao:price_zhengche_notchao,
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


publishController.excel = function (req,res) {
	res.render('excel',{
		orders:[]
	})
	console.log(req)
}

publishController.excelin  = function (req,res) {
	resexcel = res
	console.log('excle in')
	//console.log(req.files)
	var file = req.files.excle
	var filename = file.name
	var filetype = filename.split('.')[1]

	if(file.size>0 && filetype =='xlsx'){
		var tmp_path = file.path
		//console.log(tmp_path)
		var obj = xlsx.parse(tmp_path);
		excelinfo = obj[0].data
		//console.log(excelinfo.length)
		if(excelinfo.length<2)
		{
			res.render('excel',{
				error:'记录为空'
			})
		}
		else if(excelinfo.length>151)
		{
			res.render('excel',{
				error:'记录超过150条'
			})
		}
		else
		{
			var needs = []
			var need ={}
			excelinfo.slice(0)
			excelinfo.shift()
			console.log(excelinfo.length)
			//console.log(excelinfo)
			xunhuan()
			// async.map(excelinfo,function (excel,cb) {
			//
			// 		//console.log(excel)
			// 		var orderid = excel[0]
			// 		var truck_type = excel[1]
			// 		var truck = excel[2]
			// 		var from_name = excel[3]
			// 		var from_phone = excel[4]
			// 		var from_address = excel[5]
			// 		var to_name = excel[6]
			// 		var to_phone = excel[7]
			// 		var to_address = excel[8]
			// 		var time = Date.parse(new Date(1900, 0, excel[9]))
			// 		var arrive_time = Date.parse(new Date(1900, 0, excel[10]))
			// 		var peizai = excel[11]
			// 		var chaoxian = excel[12]
			// 		var cargo = excel[13]
			// 		var mass = excel[14]
			// 		var size = excel[15]+"*"+excel[16]+"*"+excel[17]
			// 		var remark = excel[18]
			// 		var youka = excel[19]
			// 		var from
			// 		var to
			//
			//
			// 		//发货信息
			// 		var fromurl = 'https://apis.map.qq.com/ws/geocoder/v1/?key=TSFBZ-YAN3U-S2BVJ-4AP4W-XWEQF-GYFRI&address='+from_address
			//
			// 		request(encodeURI(fromurl),function (err,resp,data) {
			// 			var res = JSON.parse(data)
			// 			console.log(res)
			// 			if(res.status == 0)
			// 			{
			// 				var fromcity = res.result.address_components.city
			// 				var fromlng = res.result.location.lng
			// 				var fromlat = res.result.location.lat
			//
			// 				from = JSON.stringify({
			// 					city: fromcity,
			// 					address: from_address,
			// 					note: '',
			// 					name: from_name,
			// 					phone: from_phone,
			// 					location: {
			// 						type: "Point",
			// 						coordinates: [fromlng, fromlat]
			// 					}
			// 				})
			// 			}
			//
			// 			console.log(from)
			//
			// 			//收货信息
			// 			var tourl = 'https://apis.map.qq.com/ws/geocoder/v1/?key=TSFBZ-YAN3U-S2BVJ-4AP4W-XWEQF-GYFRI&address='+to_address
			// 			request(encodeURI(tourl),function (err,resp,data) {
			// 				var res = JSON.parse(data)
			// 				console.log(res)
			// 				if(res.status == 0)
			// 				{
			// 					var tocity = res.result.address_components.city
			// 					var tolng = res.result.location.lng
			// 					var tolat = res.result.location.lat
			//
			// 					to = JSON.stringify({
			// 						city: tocity,
			// 						address: to_address,
			// 						note: '',
			// 						name: to_name,
			// 						phone: to_phone,
			// 						location: {
			// 							type: "Point",
			// 							coordinates: [tolng, tolat]
			// 						}
			// 					})
			// 				}
			// 				console.log(to)
			// 				need={
			// 					order_id:orderid,
			// 					truck: truck,
			// 					truck_type: truck_type,
			// 					from: JSON.parse(from),
			// 					to: JSON.parse(to),
			// 					time: Dateformat(new Date(time),'yyyy-mm-dd hh:MM'),
			// 					arrive_time: Dateformat(new Date(arrive_time),'yyyy-mm-dd hh:MM'),
			// 					youka:youka,
			// 					peizai:peizai,
			// 					chaoxian:chaoxian,
			// 					cargo: cargo,
			// 					price_type: 'mass',
			// 					mass: mass,
			// 					distance: 0,
			// 					volume: 0,
			// 					price: 0,
			// 					size: size,
			// 					remark: remark,
			// 					com_user: 'kkkk',
			// 					account: 'kkkkk',
			// 					closed: false
			// 				}
			// 				needs.push(need)
			//
			// 				cb(null,need)
			// 			})
			//
			// 		})
			//
			//
			//
			//
			//
			// },function (err,data) {
			// 	//console.log(err)
			// 	console.log('----')
			// 	console.log(data)
			// 	res.render('excel',{
			// 		orders:needs
			// 	})
			// })
		}


	}
	else
	{
		console.log('err')
		res.render('excel',{
			error:'文件读取失败'
		})

	}

}

xunhuan = function () {
	console.log(excelindex)
	var excel = excelinfo[excelindex]
	//console.log(excel)
	var need ={}
	var orderid = excel[0]
	var truck_type = excel[1]
	var truck = excel[2]
	var from_name = excel[3]
	var from_phone = excel[4]
	var from_address = excel[5]
	var to_name = excel[6]
	var to_phone = excel[7]
	var to_address = excel[8]
	var time = Date.parse(new Date(1900, 0, excel[9]))
	var arrive_time = Date.parse(new Date(1900, 0, excel[10]))
	var peizai = excel[11]
	var chaoxian = excel[12]
	var cargo = excel[13]
	var mass = excel[14]
	var size = excel[15]+"*"+excel[16]+"*"+excel[17]
	var remark = excel[18]
	var youka = excel[19]
	var from
	var to


	//发货信息
	var fromurl = 'https://apis.map.qq.com/ws/geocoder/v1/?key=TSFBZ-YAN3U-S2BVJ-4AP4W-XWEQF-GYFRI&address='+from_address

	//var fromurl = 'https://apis.map.qq.com/ws/geocoder/v1/?key=ee71146319a5fe453f59435386684e46&address='+from_address
	console.log('request from map:'+new Date())
	request(encodeURI(fromurl),function (err,resp,data) {
		var res = JSON.parse(data)
		//console.log(res)
		if(res.status == 0)
		{
			var fromcity = res.result.address_components.city
			var fromlng = res.result.location.lng
			var fromlat = res.result.location.lat

			from = JSON.stringify({
				city: fromcity,
				address: from_address,
				note: '',
				name: from_name,
				phone: from_phone,
				location: {
					type: "Point",
					coordinates: [fromlng, fromlat]
				}
			})
		}

		//console.log(from)

		//收货信息
		var tourl = 'https://apis.map.qq.com/ws/geocoder/v1/?key=TSFBZ-YAN3U-S2BVJ-4AP4W-XWEQF-GYFRI&address='+to_address
		console.log('request to  map:'+new Date())
		request(encodeURI(tourl),function (err,resp,data) {
			var res = JSON.parse(data)
			//console.log(res)
			if(res.status == 0)
			{
				var tocity = res.result.address_components.city
				var tolng = res.result.location.lng
				var tolat = res.result.location.lat

				to = JSON.stringify({
					city: tocity,
					address: to_address,
					note: '',
					name: to_name,
					phone: to_phone,
					location: {
						type: "Point",
						coordinates: [tolng, tolat]
					}
				})
			}
			//console.log(to)
			need={
				order_id:orderid,
				truck: truck,
				truck_type: truck_type,
				from: JSON.parse(from),
				to: JSON.parse(to),
				time: Dateformat(new Date(time),'yyyy-mm-dd hh:MM'),
				arrive_time: Dateformat(new Date(arrive_time),'yyyy-mm-dd hh:MM'),
				youka:youka,
				peizai:peizai,
				chaoxian:chaoxian,
				cargo: cargo,
				price_type: 'mass',
				mass: mass,
				distance: 0,
				volume: 0,
				price: 0,
				size: size,
				remark: remark,
				com_user: 'kkkk',
				account: 'kkkkk',
				closed: false
			}
			importneeds.push(need)
			console.log(importneeds.length)
			console.log('excelindex:'+excelindex)
			console.log("excellength:"+excelinfo.length)

			if(excelindex<excelinfo.length-1)
			{

				excelindex ++
				console.log('+++')
				console.log(excelindex)
				//console.log('start')
				wait(200)
				//console.log('next')
				process.nextTick(xunhuan);
			}
			else
			{
				console.log('****')
				console.log(importneeds.length)

				resexcel.render('excel',{
					orders:importneeds,
					count:importneeds.length
				})
				excelindex = 0
				importneeds =[]
				excelinfo=[]
			}

		})

	})




}

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
				arrive_time: body.arrive_time,
				youka:body.youka,
				peizai:body.peizai =='zhengche'?'整车':'配载',
				chaoxian:body.chaoxian=='notchao'?'未超限':'超限',
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

publishController.getPrice = function (req,res) {
	console.log('--')
	//车型
	console.log(req.body)
	var user = req.session.passport.user
	var price_type = req.body.price_type
	var chaoxian_type = req.body.chaoxian_type

	Account.findOne({phone:user}).populate('company').then(account=>{

		var price = account.company.price_dun
		if(price_type=="mass") {
			price = account.company.price_dun
		}
		if(price_type == 'zhengche' && chaoxian_type == 'notchao'){
			price = account.company.price_zhengche_notchao
		}
		if(price_type == 'zhengche' && chaoxian_type == 'chao'){
			price = account.company.price_zhengche_chao
		}
		if(price_type == 'peizai' && chaoxian_type == 'notchao')
		{
			price = account.company.price_peizai_notchao
		}
		if(price_type == 'peizai' && chaoxian_type == 'chao')
		{
			price = account.company.price_peizai_chao
		}
		console.log(price)
		res.send({price:price})

	})


}

//获取经纬度及城市
getlanandlnt = function(address,cb){
	console.log('---')
	var url = 'https://apis.map.qq.com/ws/geocoder/v1/?key=TSFBZ-YAN3U-S2BVJ-4AP4W-XWEQF-GYFRI&address='+address
	console.log(url)
	request(encodeURI(url),function (err,resp,data) {
		console.log(data)
		console.log(data.status)
	})
}

module.exports = publishController;
