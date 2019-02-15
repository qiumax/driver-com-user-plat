var mongoose = require("mongoose");
var Order = require("../models/Order");
var Company = require("../models/Company");
var Account = require("../models/Account");
var Driver = require("../models/Driver")
var User = require("../models/User")
var moment = require("moment");
var Dateformat = require("dateformat");

var orderController = {};

orderController.all = function(req, res) {
	var page = req.query.page || 1
	var page_size = req.query.page_size || req.app.get('config').page_size

	var user = req.session.passport.user

	Account.findOne({phone:user}).then(acctount=>{
			Order.count({account:acctount._id}, function(err, count) {
				Order.find({account:acctount._id}).sort({created_at:-1}).skip((page-1)*page_size).limit(page_size).populate({
					path: 'driver',
					model: 'Driver',
					populate: {
						path: 'user',
						model: 'User'
					}
				}).populate({
					path: 'account',
					model: 'Account',
					populate: {
						path: 'company',
						model: 'Company'
					}
				}).then(orders=>{
					console.log(orders)
					orders.forEach(order=>{
						order.created_time = moment(order.created_at).format('YYYY-MM-DD HH:mm:ss')
						order.publish_time = Dateformat(new Date(order.publish_at*1000),'yyyy-mm-dd HH:MM')
					})
					res.render('order', {
						orders: orders,
                        username:req.session.passport.user,
						page: page,
						page_total: count%page_size==0? count/page_size:(Math.floor(count/page_size)+1)
					});
				})
			})

	})
};

orderController.finish = function(req, res) {

    var page = req.query.page || 1
    var page_size = req.query.page_size || req.app.get('config').page_size

	var user = req.session.passport.user

    Account.findOne({phone:user}).then(account=>{
            Order.count({
            	account:account._id,
	            $or:[
		            {state:6},
		            {state:8}
	            ]}, function(err, count) {
                Order.find({
	                account:account._id,
	                $or:[
		                {state:6},
		                {state:8}
	                ]}).sort({created_at:-1}).skip((page-1)*page_size).limit(page_size).populate({
                    path: 'driver',
                    model: 'Driver',
                    populate: {
                        path: 'user',
                        model: 'User'
                    }
                }).populate({
                    path: 'account',
                    model: 'Account',
                    populate: {
                        path: 'company',
                        model: 'Company'
                    }
                }).then(orders=>{
                    console.log(orders)
                    orders.forEach(order=>{
                        order.created_time = moment(order.created_at).format('YYYY-MM-DD HH:mm:ss')
                        order.publish_time = Dateformat(new Date(order.publish_at*1000),'yyyy-mm-dd HH:MM')
                    })
                    res.render('order', {
                        orders: orders,
                        username:req.session.passport.user,
                        page: page,
                        page_total: count%page_size==0? count/page_size:(Math.floor(count/page_size)+1)
                    });
                })
            })

    })

};

orderController.detail = function (req,res) {

	var order_id = req.query.id
	console.log(order_id)
	Order.findById(order_id).populate({
		path: 'driver',
		model: 'Driver',
		populate: {
			path: 'user',
			model: 'User'
		}
	}).populate({
		path: 'account',
		model: 'Account',
		populate: {
			path: 'company',
			model: 'Company'
		}
	}).then(order=>{

		var mtime = Dateformat(new Date(order.time * 1000), 'yyyy/mm/dd HH:MM')
		order.sendtime = mtime
		//logs
		var logs = new Array()
		//发单
		if(order.created_at)
		{
			logs.push(moment(order.created_at).format('YYYY-MM-DD HH:mm:ss') + '：  提交运单')
		}

		//接单
		if(order.publish_at)
		{
			logs.push(Dateformat(new Date(order.publish_at*1000), 'yyyy-mm-dd HH:MM:ss') +'：  司机接单')
		}
		if(order.driver_confirm_cargo_at.time){
			logs.push(moment(order.driver_confirm_cargo_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  司机确认取货')
		}
		if(order.company_confirm_cargo_at.time){
			logs.push(moment(order.company_confirm_cargo_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  发货方确认司机已取货')
		}

		//运送

		if(order.logs && order.logs.length>0){
			var addresslog = order.logs
			for(var i=0;i<addresslog.length;i++)
			{
				logs.push(moment(addresslog[i].time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  到达' + addresslog[i].address)
			}
		}
		//收货
		if(order.driver_confirm_deliver_at.time){
			logs.push(moment(order.driver_confirm_deliver_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  司机确认交货')
		}
		//投诉
		if(order.tousu_to_driver.time){
			order.tousutime = moment(order.tousu_to_driver.time*1000).format('YYYY-MM-DD HH:mm:ss')
			logs.push(moment(order.tousu_to_driver.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  收货方发起投诉')
		}

		//投诉处理完成
		if(order.plat_handle_tousu.time){
			order.handletime = moment(order.plat_handle_tousu.time*1000).format('YYYY-MM-DD HH:mm:ss')
			logs.push(moment(order.plat_handle_tousu.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  投诉处理完成')
		}

		if(order.company_confirm_deliver_at.time){
			logs.push(moment(order.company_confirm_deliver_at.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  收货方确认收货')
		}
		//评价
		if(order.comment_to_driver.time){
			logs.push(moment(order.comment_to_driver.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  收货方已评价 ')
		}
		if(order.comment_to_company.time){
			logs.push(moment(order.comment_to_company.time*1000).format('YYYY-MM-DD HH:mm:ss') + '：  司机已评价')
		}

		order.log = logs
		res.render('order_detail',{
			username:req.session.passport.user,
			order:order
		})
	})

}


orderController.search=function (req,res) {
	var page = req.query.page || 1
	var page_size = req.query.page_size || req.app.get('config').page_size
	var query = req.body.query
	console.log(query)
	var pattern = query
	var reg = {$regex: pattern, $options:"i"}
	var orders =[]
	var company_id = req.user._id


	Account.findOne({
		phone:user
	}).then(account=>{
				Order.count({
					account:account._id,
					cargo:reg
				}, function(err, count) {
					Order.find({
						account:account._id,
						cargo:reg
					}).sort({created_at:-1}).populate({
						path: 'driver',
						model: 'Driver',
						populate: {
							path: 'user',
							model: 'User'
						}
					}).populate({
						path: 'account',
						model: 'Account',
						populate: {
							path: 'company',
							model: 'Company'
						}
					}).then(orders=>{
						console.log(orders)
						orders.forEach(order=>{
							order.created_time = moment(order.created_at).format('YYYY-MM-DD HH:mm:ss')
                            order.publish_time = Dateformat(new Date(order.publish_at*1000),'yyyy-mm-dd HH:MM')
						})
						res.render('order', {
							orders: orders,
                            username:req.session.passport.user,
                            username:req.session.passport.user

						});
					})
				})


	})


}


module.exports = orderController;
