// enum
// 上传下载状态
var EM_STATE = {
	WAIT:0,      //暂停 等待
	LOAD:1,      //进行中
	END:2,       //已完成 结束
	ERR:3        //异常中断
};
// 类型
var EM_TYPE = {
	FOLDER:0,           //文件夹
	DOC:1,              //文档
	PIC:2,              //图片
	NONE:3,             //未知
	ZIP:4,              //压缩包
	HTML:5              //程序文件
};
// 类型对应的图片地址 使用方法  iconPath = iconPath[EM_TYPE.FOLDER]
var iconPath = [
	"img/folder.png",
	"img/document.png",
	"img/picture.png",
	"img/unknown.png",
	"img/zip.png",
	"img/html.png"
];
var Verification_Code;

// data
var globalData = new Vue({
	router: router,
	data:{
		// 存储于此处的变量是与界面渲染同步相关的
		/* 登录相关 */
		loginType:'oss',			// 登陆类型 oss location
		loginState:false,			// 登录状态 true 已登录 false 未登录(控制登录界面的显示)

		ossObj: null,				// oss通信 操作对象
		fileNames:[],				// 文件操作组件选中对象
		socketObj: null,			// 本地通信 操作对象
		socketServer: {ip:'10.1.21.144',port:8080},//默认IP 如果有cookie就用cookie
		userInfo: null,				// 登陆后可以获取sql返回的所有用户信息 密码 根目录等等 但AK要删除
		forgotName:'',				// 忘记密码手机验证
		verify:'',					// 图片验证码
		/* 路径相关 */
		pathRecord:[],				// 路径记录 用于回退和前进
		addressData:0,				// 当前所处文件位置计数
		backStep:0,					// 回退次数 回退+1 前进-1 必须>=0 若打开文件夹or跳转任意路径:清零,路径记录尾部消除对应个数 
		currentPath:'/',			// 当前路径 /默认根目录 (永远必须带/结尾)   userInfo.rootPath + currentPath + "/" = /xx/xx/  /xx/
		searchPath:'',				// 搜索后打开文件使用路径
		locations:'',				// 跳转地址
		searching:false,			// 搜索状态
		
		/* 列表 */
		fileList:[],				// 文件列表 {name:"",type:0,url:"",iconPath:"",size:xx,isSelect:false}
		fileCss:'cdk cdk_pave',		//文件样式
		upDownList:{
			uploadList:[],			// 上传列表
			uploadSpeed:"0kb/s", 

			downloadList:[],		// 下载列表
			downloadSpeed:"0kb/s",
			// progress:0
		},
		
		/*磁盘空间信息*/
		fileLength:0,				// 文件数量
		folderLength:0,				// 文件夹数量
		fileSize:0,					// 使用内存总量
		fileNUM:0,					// 当前文件数
		fileOperation:0,			// 操作文件数
        
		/* 用户注册 */
		userRegistration:{			//注册数值
			'userName':false,
			'userPassword':false,
			'userCompany':''
		},       
		newPhoneNum:null,
		/* 系统设置 */
		language:'cn',				//cookie存储 语言习惯 cn en jp

		/* 消息提示 */
		msg:null,					//弹窗提示[{},{}]
		log:[],						//操作记录

		/*视口*/
		view:'home',
		/*验证*/
		validateNum:[],
		/*复制粘贴 承接*/
		oldPath:"",
		oldFileName:[],
	}
}).$mount('#App');
// operation
var globalOp = new Vue({
	data:{
		/* axios & websocket 发送的数据格式 */
		sendData:{
			"cmd" : "",
			"data" : null
		},
		// 获取授权AK等信息的接口
		stsServer:'http://skt-studio.com/vue/stsServer/stsAxios.php'
	},
	methods: {
		/* 用户操作 */
		// 登陆 传入 类型和账户信息
		login: function(loginType,name,psw) {
			if(globalData.loginState){
				// 已登录
			} else{
				this.sendData.cmd = "login";
				this.sendData.data = {
					username:name,
					password:this.encryptMD5(psw),
				};
				switch(loginType){
					case 'oss':
						axios.post(this.stsServer, this.sendData)
						.then(function (response) {
							console.log(response);
							var axiosRet = response.data;
							if(axiosRet.result){
								console.log("登录成功");
								setTimeout(function(){
									loading.disappear();
								},5000);
								loading.disappear();
								globalData.loginState = true;//登录状态
								globalData.userInfo = axiosRet.data;//获取用户信息
								// console.log(globalData.userInfo)
								// 注册OSS
								var accessKeyId = globalData.userInfo.accessKeyId,//返回AK
								accessKeySecret = globalData.userInfo.accessKeySecret,
								bucket = globalData.userInfo.bucket,
								region = globalData.userInfo.region;
								globalData.ossObj = new OSS.Wrapper({// 创建OSS链接
									accessKeyId:accessKeyId,
									accessKeySecret:accessKeySecret,
									region:region,
									bucket:bucket
								});
								// 登录 获取文件列表【oss失败怎么处理】
								// 以下三步是文件操作必走
								globalData.currentPath = "/";					//路径组装
								globalOp.listFile(globalData.currentPath);		//进入 用户的目标目录
								globalOp.recordPath(globalData.currentPath);	//并且记录下来
								console.log(globalData.userInfo);
								// 删除userInfo中的AK信息
								delete globalData.userInfo.region;
								delete globalData.userInfo.accessKeyId;
								delete globalData.userInfo.accessKeySecret;
								delete globalData.userInfo.bucket;
							}else{
								loading.disappear();
								console.log(globalOp.errCodeTrans(axiosRet.errorCode));
								switch(axiosRet.errorCode){
									case -1:
										loading.promptNotice("请求指令错误");
									break; 
									case 101:
										loading.promptNotice("密码错误");
									break; 
									case 100:
										loading.promptNotice("用户名不存在");
									break; 
								}
							}
						}).catch(function (error) {
							console.log(error);
							loading.disappear();
							loading.promptNotice('登录失败！');
						});
					break;
					case 'location':
						// websocket连接
					break;
					default:
						console.log("error type");
				}
			}
		},
		//刷新或关闭页面登出方式
		directLogout: function() {
			console.log('登出');
			this.sendData.cmd = "logout";
			this.sendData.data = {
				username:globalData.userInfo.username
			};
			axios.post(this.stsServer, this.sendData)
			.then(function (response) {
				console.log(11111111111);
				var axiosRet = response.data;
				// 【异常、超时 或者修改失败】
				// 【没有正常退出】-【关闭窗口是否能触发】 页面加载、刷新 执行
				// 【定时关闭】
			})
			.catch(function (error) {
				console.log(error);
			});
		},
		// 登出 退出
		logout: function() {
			console.log('退出');
			if(globalData.loginState){
				// 已登陆
				this.sendData.cmd = "logout";
				this.sendData.data = {
					username:globalData.userInfo.username
				};
				axios.post(this.stsServer, this.sendData)
				.then(function (response) {
					console.log(response);
					var axiosRet = response.data;
					// 【异常、超时 或者修改失败】
					// 【没有正常退出】-【关闭窗口是否能触发】 页面加载、刷新 执行
					// 【定时关闭】
					if(axiosRet.result){
						// 登出后需要重置数据
						globalOp.resetData();
						// 登出成功 重置所有数据
						loading.disappear();
						console.log("退出成功");
					} else{
						console.log(globalOp.errCodeTrans(axiosRet.errorCode)+"或未登录");
					}
				}).catch(function (error) {
					console.log(error);
				});
			} else{
				//尚未登陆
			}
		},
		// 登出后需要重置数据
		resetData: function() {
			console.log('重置数据');
			// 复位登陆状态
			globalData.loginState = false;
			// 用户信息清空
			globalData.userInfo = null;
			globalData.ossObj = null;
			globalData.socketObj = null;
			// 路径清空
			globalData.pathRecord = [];              // 路径记录 用于回退和前进
			globalData.currentPath = '/';            // 当前路径 /默认根目录
			// 列表清空
			globalData.fileList = [];                // 文件列表
			globalData.uploadList = [];              // 上传列表 {文件名 , 进度 , 运行状态}
			globalData.uploadSpeed = 0;              // 下载列表 {文件名 , 进度 , 运行状态}
			globalData.downloadList = [];
			globalData.downloadSpeed = 0;
			// 日志清空
			globalData.log=[];
		},
		// 获取手机验证码
		getTelCode:function (telephone) {  
			console.log('手机验证');
			$.post("http://skt-studio.com/vue/aliyun-dysms-php-sdk/api_demo/SmsDemo.php",
			{tel:telephone},function (data,status) {   
				if (status=="success") {
					var dataArr = data.split(","); // tel code state
					if(dataArr[2]=='OK'){// state   
						//console.log(dataArr[1]);//code
						Verification_Code=dataArr[1];
					} else{// 签名不合法 、 手机号不合法
						loading.promptNotice("远程错误: "+dataArr[2]);
					}
				} else{
					loading.promptNotice('请求失败')
				}
			});
		},
		// 随机4位验证码  数字 字母
		randomCode:function () {
			console.log('验证码');
			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < 4; i++ ){
				text += possible.charAt(Math.floor(Math.random()  * possible.length));
			}
			return text;
		},
		// 获取当前账户的总存储状况、剩余空间等信息
		// 可以获取任意文件夹信息
		// getOSSInfo: function() {  
		// 	console.log('获取文件夹');
		// 	globalData.ossObj.list({
		// 		prefix:globalData.userInfo.rootPath + "/",
		// 		marker:globalData.userInfo.rootPath + "/"
		// 	}).then(function (res) {
		// 		var obj = res.objects;
		// 		var file = [];
		// 		var folder = [];  
		// 		var fileSize = 0;
		// 		for (var i = 0; i < obj.length; i++) {
		// 			if (globalOp.isFile(obj[i].name)) {// 文件
		// 				var nameUrl = {
		// 					name:obj[i].name,
		// 					url:obj[i].url
		// 				}
		// 				file.push(nameUrl);

		// 				fileSize = fileSize + obj[i].size;
		// 			}
		// 			if (globalOp.isFolder(obj[i].name)) {// 文件夹
		// 				folder.push(obj[i].name)
		// 			}
		// 		}
		// 		// 文件信息
		// 		globalData.fileLength = file.length;
		// 		globalData.folderLength = folder.length;
		// 		globalData.fileSize = fileSize;
		// 	})
		// },
		
		// 以此为准
		getOSSInfo: function(pathArr) { 
            var a = 0;


            // 文件 文件夹本身  第一层
            // 文件夹之下 第二层
            // 所有
            // // json数组 为了区分文件 文件夹 类型 大小不同
            // [{name:folder,type:0,size:0},{name:file,type:!0,size:xx}]  
            
            // 重置
            globalData.folderLength = 0;
            globalData.fileLength = 0;
            globalData.fileSize = 0;
            
            var fileConfirm=true;
            if (pathArr.length!=0) 
            {   
                for (var i = 0; i < pathArr.length; i++) 
                {   
                    if (pathArr[i].type!=0) //文件  数量 大小
                    {
                        globalData.fileLength = globalData.fileLength + 1;
                        globalData.fileSize = globalData.fileSize + pathArr[i].size;
                    }
                    else{ // 文件夹   name + "/"  自己？ 之下
                        // 区分磁盘总域 和 文件夹
                        // {name:"/",type,size}
                        var fileInitial ; // 前缀不变
                        var fileNext;     // 后缀可变

                        pathArr[i].name != "/"?
                        fileInitial = globalData.userInfo.rootPath + globalData.currentPath + pathArr[i].name+"/":
                        fileInitial = globalData.userInfo.rootPath + "/";//磁盘总域

                        if (fileInitial!=globalData.userInfo.rootPath + "/") {
                            globalData.folderLength = globalData.folderLength + 1;
                            // 文件夹本身  判断总域
                        }


                        fileNext = fileInitial;
                        function allList() 
                        {
                            globalData.ossObj.list({
                                prefix:fileInitial,
                                marker:fileNext,
                                "max-keys":1000
                                //不能当前  
                            }).then(function (re) 
                            {   
                                var AllList = [];
                                var fileNum = []  ;
                                var folderNum = [] ;

                                if (fileConfirm) {
                                    AllList=re.objects;
                                    fileConfirm = false;
                                }
                                else{
                                    if (re.objects!=undefined) 
                                    {
                                        for (var j=0;j<re.objects.length; j++) {
                                            AllList.push(re.objects[j]);
                                        }
                                    }
                                    else{
                                        AllList=re.objects;  
                                    }
                                }

                                if (re.nextMarker!=null) {
                                    fileNext=re.nextMarker;
                                    allList();
                                }
                                else{
                                    // 处理 
                                    // AllList!=undefined
                                    if (AllList!=undefined) 
                                    {   
                                        for (var i = 0; i < AllList.length; i++) 
                                        {
                                            if(globalOp.isFile(AllList[i].name)) // 文件  
                                            {   
                                                globalData.fileLength = globalData.fileLength + 1;
                                                globalData.fileSize = globalData.fileSize + AllList[i].size;
                                            }
                                            else{ //文件夹
                                                globalData.folderLength = globalData.folderLength + 1;
                                            }
                                        }
                                    }
                                    else{// 空文件夹
                                        globalData.folderLength = globalData.folderLength;
                                        globalData.fileLength = globalData.fileLength;
                                        globalData.fileSize = globalData.fileSize;
                                    }                           
                                }
                            });
                        }
                        allList();
                    }
                }
            }
        },

		userInfoChange:function(info){  //修改个人信息
			console.log('个人信息');
			this.sendData.cmd = "changeUserInfo";
			this.sendData.data = {
				job:info[0],
				email:info[1],
				call:globalData.userInfo.call,
				username:globalData.userInfo.username
			};
			axios.post(this.stsServer, this.sendData)
			.then(function (response) {
				console.log(response);
			}).catch(function (error) {
				console.log(error);
			});
		},
		userPhoneChange:function(info){  //修改手机
			console.log('修改手机');
			this.sendData.cmd = "changeUserInfo";
			this.sendData.data = {
				job:globalData.userInfo.job,
				email:globalData.userInfo.email,
				call:info,
				username:globalData.userInfo.username
			};
            
			axios.post(this.stsServer, this.sendData)
			.then(function (response) {
				loading.promptNotice('手机修改成功');
			}).catch(function (error) {
				console.log(error);
			});
		},
		// 找回忘记密码*
		// 重置  因为是加密的 找回的是乱码
		findPassword:function (username) {	//根据用户名查找数据库
			console.log('找回密码');
			this.sendData.cmd = "forgetPassword";
			this.sendData.data = {
				username:username,
			};
			axios.post(this.stsServer, this.sendData)
			.then(function (response) {
				console.log(response);
				var axiosRet = response.data;//返回一个电话号码
				if(axiosRet.result){//用户名存在
					// 符合 发送短信
					var telNum = axiosRet.data;
					// 判断电话号码是否符合 11位
					if(telNum.length == 11){
						globalOp.getTelCode(telNum);
					} else{
						loading.promptNotice("手机号码长度错误");
					}
				}else{
					console.log(axiosRet.errorCode);
				}
			}).catch(function (error) {
				console.log(error);
			});
		},
		changeforgetPassword:function(newPassword){
			console.log('adddres_blur');
			var newPsw = this.encryptMD5(newPassword);
			this.sendData.cmd = "changePassword";
			this.sendData.data = {
				username:globalData.forgotName,
				password:newPsw,
			};
			axios.post(this.stsServer, this.sendData)
			.then(function (response) {
				console.log(response);
				var axiosRet = response.data;
				if(axiosRet.result){
					loading.promptNotice("修改密码成功");
					$('#login_middle').css('display','block');
					$('#login_bottom').css('display','block');
					$('#forgot_password').css('display','none');
					$('#login_top').html('用户登录');
					globalData.userInfo.password = newPsw;
					console.log(newPsw);
				}else{
					console.log(globalOp.errCodeTrans(axiosRet.errorCode));
				}
			}).catch(function (error) {
				console.log(error);
			});
		},
		// 修改密码/用户名  重置密码  用户名可修 绑定手机号
		changePassword: function(oldPassword,newPassword) {
			console.log('adddres_blur');
			//登陆正常
			if(globalData.loginState){ 
				var oldPsw = this.encryptMD5(oldPassword);
				// MD5判断一致后 提交修改
				if(oldPsw == globalData.userInfo.password ){
					var newPsw = this.encryptMD5(newPassword);

					this.sendData.cmd = "changePassword";
					this.sendData.data = {
						username:globalData.userInfo.username,
						password:newPsw,
					};
					axios.post(this.stsServer, this.sendData)
					.then(function (response) {
						console.log(response);
						var axiosRet = response.data;

						if(axiosRet.result){
							console.log("修改密码成功");
							loading.promptNotice("修改密码成功");
							globalData.userInfo.password = newPsw;
						} else{
							console.log(globalOp.errCodeTrans(axiosRet.errorCode));
						}
					}).catch(function (error) {
						console.log(error);
					});
				} else{
					loading.promptNotice("原密码输入错误");
				}
			}
		},
		// 记住保存密码于页面 本地存储 保持登录状态 
		// 窗口关闭
		keepPassword:function (){
            
		},
		invitationRegister: function (datas) {  //邀请注册
			console.log('adddres_blur');
			this.sendData.cmd = "checkProductID";
			this.sendData.data = {
				'productID':datas
			};
			axios.post(this.stsServer, this.sendData)
			.then(function (response) {
				console.log(response);
				globalData.userRegistration.userCompany=response.data.data.buyCompany;
				var axiosRet = response.data;//返回一个电话号码
				if(response.data.result){//成功
					$('#newRegisterID').next('span').html('');
					$('#loginRegister_num1').css('display','none');
					$('#loginRegister_num2').css('display','block');
					loading.disappearNulls();
				}else{
					$('#preloadingNull').css('display','none');
					$('#newRegisterID').next('span').html('邀请码错误');
					loading.disappearNulls();
				}
			}).catch(function (error) {
				console.log(error);
				loading.disappearNulls();
			});
		},
		invitationName: function (datas) {  //检查用户名
			console.log('adddres_blur');
				this.sendData.cmd = "isNameRegisterAllow";
				this.sendData.data = {
					'username':datas
				};
				axios.post(this.stsServer, this.sendData)
				.then(function (response) {
					console.log(response);
					if(response.data.result){//成功
						$('#newRegisterUser').css('border','rgba(57,60,63,0.5)');
						$('#newRegisterUser').next('span').html('');
					}else{
						$('#newRegisterUser').css('border','2px solid red');
						if(response.data.errorCode==104){
							$('#newRegisterUser').next('span').html('用户名被占用');
						}
					}
				}).catch(function (error) {
					console.log(error);
				});
		},
		register: function (datas) {  //用户注册
			console.log(datas);
			console.log(datas[0]);
			this.sendData.cmd = "register";
			this.sendData.data = {
				'username':datas[0],
				'password':this.encryptMD5(datas[1]),
				// 个人信息
				'name':datas[2],
				'sex':datas[4],
				'call':datas[3],
				'email':"",
				'company':datas[5],
				'job':""
			};
			axios.post(this.stsServer, this.sendData)
			.then(function (response) {
				var axiosRet = response.data;//返回一个电话号码
				if(axiosRet.result){//成功
					loading.promptNotice('注册成功');
					if($('#login_top').html()=='忘记密码验证'){
						$('#forgot_password').css('display','none');
					}else{
						$('#loginRegister_num1').css('display','block');
						$('#loginRegister_num2').css('display','none');
						$('#loginRegister').css('display','none');
					}
					$('#login_middle').css('display','block');
					$('#login_bottom').css('display','block');
					$('#endValidata').css('display','none');
					$('#login_top').html('用户登录');
				}else{
					console.log(axiosRet.errorCode);
				}
			}).catch(function (error) {
				console.log(error);
			});
		},
		// 修改用户密码 是否需要密码?   /用户名 密码 昵称?
		changeUserInfo: function(password) {// 参数：密码  其他信息参数
			console.log('adddres_blur');
			if(globalData.loginState){ 
				var password = this.encryptMD5(password);
				if(password == globalData.userInfo.password){
					this.sendData.cmd = "changeUserInfo";
					this.sendData.data = {
						password:password
					};
					axios.post(this.stsServer, this.sendData)
					.then(function (response) {
						var axiosRet = response.data;
						if(axiosRet.result){
							console.log("修改密码成功");
						}else{
							console.log(globalOp.errCodeTrans(axiosRet.errorCode));
						}
					}).catch(function (error) {
						console.log(error);
					});
				}
			}
		},
		/* 文件操作 */
		// 统一 返回真实路径 一个完整的OSS操作路径  用户根前缀+用户看到的路径+/
		// retRealPath(): function(path){
		//     return globalData.userInfo.rootPath + path + "/";
		// }
		// 获取文件列表(返回当前路径的文件夹和文件名json)
		listFile: function(path) {
			var fileInitial = globalData.userInfo.rootPath + path;
			globalData.fileList = [];
			// 获取
			var objArr = [];
			var fileNum = [];
			var folderNum = [];
			var flag;
			var reg = new RegExp("/", 'g');
			var lastChar;
            
			// 处理显示
			var fileObj;
			var folderObj;
			var listDefault = true;
			var fileNext = globalData.userInfo.rootPath + path;
			
			function currentList() {
				globalData.ossObj.list({
					prefix:fileInitial,	//前缀 
					marker:fileNext,	//后缀 
					'max-keys':1000
				}).then(function (re) {   
					if (listDefault)  {  
						objArr = re.objects; 
						listDefault = false;       
					}else{     
						if (re.objects!=undefined)  {
							for (var i=0;i<re.objects.length; i++) {
								objArr.push(re.objects[i]);
							}
						}
					}
					// 判断是否超过1000
					if (re.nextMarker!=null) {
						fileNext=re.nextMarker; 
						currentList();          
					}else{                       
						if (objArr!=undefined){   
							for (var i = 0; i < objArr.length; i++){   
								objArr[i].name = objArr[i].name.replace(fileInitial,"");
								flag = objArr[i].name.match(reg);
								lastChar = objArr[i].name.charAt(objArr[i].name.length-1);
                                
								if(flag==null){
									fileNum.push(objArr[i])
								}else{
									if(flag.length==1&&lastChar=="/"){
										folderNum.push(objArr[i])  
									}                   
								}
							}
						}
						if (folderNum!=null) {   //文件夹
							for (var i = 0; i < folderNum.length; i++) {   
								folderNum[i].name = folderNum[i].name.replace('/',"");
								// 组装信息
								folderObj = {
									name: folderNum[i].name,
									type:EM_TYPE.FOLDER,       
									iconPath: iconPath[EM_TYPE.FOLDER],
									isSelect:false,
									path:globalData.userInfo.rootPath + globalData.currentPath,
									index:globalData.fileList.length,
									date:globalOp.timeTransform(folderNum[i].lastModified),  
									val:'',
									contrast:'',
								};
								globalData.fileList.push(folderObj);  // 添加显示列表
								loading.disappear();
							}
						}
						if (fileNum!=undefined) {// 文件
							for (var i = 0; i < fileNum.length; i++) { 
								// 组装信息
								fileObj = {
									name:fileNum[i].name,
									type:"", //  
									url:fileNum[i].url,
									iconPath:'', // 示意图 图片路径
									size:fileNum[i].size,
									date:globalOp.timeTransform(fileNum[i].lastModified),//文件最后操作时间
									path:globalData.userInfo.rootPath + globalData.currentPath,
									index:globalData.fileList.length,
									val:'',
									contrast:'',
								}
								// 判断文件类型
								var point = fileNum[i].name.lastIndexOf("."); // 分割点
								if (point==-1) {   // 无分割点  未知类型
									fileObj.type = EM_TYPE.NONE;      
									fileObj.iconPath = iconPath[EM_TYPE.NONE];
								}  else{              // 有分割点
									// 分割点后截取类型
									var type = fileNum[i].name.slice(point+1);
									if (type=="txt"||type=="doc"||type=="pdf"||type=="docx"||type=="chm"||type=="chw") {   
										fileObj.type = EM_TYPE.DOC;        
										fileObj.iconPath = iconPath[EM_TYPE.DOC] ; 
									} else if (type=="jpg"||type=="png"||type=="jpeg"||type=="gif") {
										fileObj.type = EM_TYPE.PIC;        
										fileObj.iconPath = iconPath[EM_TYPE.PIC] ;         
									} else if (type=="zip"||type=="rar"){
										fileObj.type = EM_TYPE.ZIP;       
 										fileObj.iconPath = iconPath[EM_TYPE.ZIP];
									} else if(type=="html"||type=="css"||type=="js"||type=="php"||type=="md"){  //html等文件
										fileObj.type = EM_TYPE.HTML;       
										fileObj.iconPath = iconPath[EM_TYPE.HTML]; 
									} else{      //未知类型  其他后缀/无后缀  /音频  视频...
										fileObj.type = EM_TYPE.NONE;       
										fileObj.iconPath = iconPath[EM_TYPE.NONE];
									}
								}
								globalData.fileList.push(fileObj);    // 添加显示列表
//								console.log(globalData.fileList);
								setTimeout(function(){
									if($('#operation_select').html()=='取消选择'){
										$('.inputs').css('display','block');
										console.log(123);
									};
								},100);
							}
						}
						//console.log(globalData.fileList)
					}
				});
			}
			currentList();     // 调用函数
		},
		// 文件总数统计与占用内存总和
		fileSizeSum: function() {
			// 文件信息
			// globalData.fileLength = file.length;
			// globalData.folderLength = folder.length;
			// globalData.fileSize = fileSize;
		},
		fontColor:function(){//字体样式
			console.log(this);
		},
		// 新建文件夹
		newFolder: function(folderName) {
        	folderName = globalData.userInfo.rootPath + globalData.currentPath + folderName+'/';
			var Buffer = OSS.Buffer;
			if (globalOp.checkFolderName(folderName)){
				globalData.ossObj.put(folderName,new Buffer(""))
				.then(function (result){
					globalOp.listFile(globalData.currentPath);
				}).catch(function (err) {
//					console.log(err);
				});
			}else{
				console.log("文件夹命名不规范");
			}
		},
		// 删除多个文件 传入参数 名字数组 内容同上
		deleteMultiFile: function(objArr) {
			console.log(objArr);
			var index;
			for (var i = 0; i < objArr.length; i++) {   
				if (objArr[i]!=undefined) {
					index = objArr[i].index;
					// 文件
					if(objArr[i].type!=0) {  
						var obj = objArr[i].path + objArr[i].name;
						globalData.ossObj.delete(obj).then(function (res){   
							globalData.fileList.splice(index, 1);
						});
						loading.disappearNulls();
					}else{  
						//文件夹
						var path = objArr[i].path + objArr[i].name +"/" ;
						var fileNum = [];
						var mulArr = [];
						var fileConfirm=true;
						var fileInitial = path; 
						var fileNext = "";

						function deleteMul() {           
							globalData.ossObj.list({
								prefix:fileInitial,
								marker:fileNext,
								'max-keys':1000
							}).then(function (re) {  
								if(fileConfirm){
									fileNum=re.objects;
									fileConfirm=false;
								}else{
									if (re.objects!=undefined)  {
										for (var i=0;i<re.objects.length; i++) {
											fileNum.push(re.objects[i]);
										}
									}
								}
								if(re.nextMarker!=null){
									fileNext=re.nextMarker;
									deleteMul();
								}else{
									if (fileNum!=undefined) {   
										var l = Math.ceil(fileNum.length/1000);
										for (var n = 0; n < l; n++) {
											mulArr[n] = [];
										}
										for (var j = 0; j < fileNum.length; j++) {
											mulArr[parseInt(j/1000)][j%1000] = fileNum[j].name;// 信息
										}
										// console.log(mulArr);
										for (var k = 0; k < mulArr.length; k++){   
											globalData.ossObj.deleteMulti(mulArr[k])//删除
											.then(function(res){
												globalData.fileList.splice(index, 1);
											})
										}
									}
								}
							});
						};
						deleteMul();
					}
				}
				loading.disappearNulls();
			}
		},
		//上传文件夹 
		//正真的文件夹上传列表 webkitRelativePath
		uploadFolder:function (fileArr) { 
			var upObj,fileTotal,startTime,alLoad,startLoad,
				nowTime,subtotalTime,subtotalLoad, 
				speed,bspeed,units = 'b/s',
				restTime,upList;
			var OBJList = globalData.upDownList;
			var index;
			var nameArr = [];

			var num = 0;
			function fn() {
				upObj = fileArr[num];
				// 断点
				var checkpoint = function (argument) {
					// body...  "checkpoint"
				}
				var progress = function(progress,checkpoint,res){
					return function (done) {
						done(); //
						// 文件大小
						fileTotal = upObj.size;
						// 开始 上传
						if (progress==0) {
							startTime = new Date().getTime(); 
							startLoad = 0; // 初始大小
							OBJList.uploadSpeed = "0kb/s";
						}
						// 1
						nowTime = new Date().getTime();
						subtotalTime = (nowTime-startTime)/1000;
						if (isNaN(subtotalTime)) {
							subtotalTime = 0;
						}
						startTime = nowTime; 
						// 2
						alLoad = progress*fileTotal;
						subtotalLoad = alLoad - startLoad;
						if (isNaN(subtotalLoad)) {
							subtotalLoad = 0;
						}
						startLoad = alLoad;
						// 3
						speed = subtotalLoad/subtotalTime; 
						if (isNaN(speed)) {
							speed = 0;
						}
						speed =Math.abs(speed);
						bspeed = speed;
						// 速度计算 b kb Mb
						if(speed/1024>1){
							speed = speed/1024;
							units = 'kb/s';
						}
						if(speed/1024>1){
							speed = speed/1024;
							units = 'Mb/s';
						}
						if (speed!=0) {
							speed = speed.toFixed(2);
						}
						// 4
						restTime = ((fileTotal-alLoad)/bspeed).toFixed(2);
						if (isNaN(restTime)) {
							restTime = 0;
						}
						// 上传完成
						if (restTime==0.00) {
							speed = 0;
							units = 'kb/s';
							// restTime = 0;
						}
						// 无穷大 开始上传
						if (restTime==Infinity) {
							restTime = "正在计算";
						}else{
							restTime =Math.abs(restTime);
							restTime = restTime + "s";
						}
						// 5.1
						OBJList.uploadSpeed = speed + units;// 上传速度
						progress = progress.toFixed(2);
						// 5.2上传列表
						upList = {
							path:globalData.userInfo.rootPath + globalData.currentPath + upObj.webkitRelativePath,
							//上传文件对象   rootpath/x/x.jpg
							name:upObj.webkitRelativePath, //文件名   x/x.jpg

							type:"",
							iconPath:'', 
							size:upObj.size,
							fileName:upObj.name,  // x.jpg
							inddex:globalData.upDownList.uploadList.length,
							time:upObj.lastModified.toLocaleString(),

							progress:progress,//进度
							restTime:restTime // 剩余时间
						}
						// 判断文件类型
						var point = upObj.name.lastIndexOf("."); // 分割点
						if (point==-1) {   // 无分割点  未知类型
							upList.type = EM_TYPE.NONE;      
							upList.iconPath = iconPath[EM_TYPE.NONE];
						} else{              // 有分割点
							// 分割点后截取类型
							var type = upObj.name.slice(point+1);
							if (type=="txt"||type=="doc"||type=="pdf"||type=="docx"||type=="chm"||type=="chw") {   
								upList.type = EM_TYPE.DOC;        
								upList.iconPath = iconPath[EM_TYPE.DOC] ; 
							} else if (type=="jpg"||type=="png"||type=="jpeg"||type=="gif") {
								upList.type = EM_TYPE.PIC;        
								upList.iconPath = iconPath[EM_TYPE.PIC] ;         
							} else if (type=="zip"||type=="rar"){
								upList.type = EM_TYPE.ZIP;       
								upList.iconPath = iconPath[EM_TYPE.ZIP];
							} else if(type=="html"||type=="css"||type=="js"||type=="php"){  //html等文件
								upList.type = EM_TYPE.HTML;       
								upList.iconPath = iconPath[EM_TYPE.HTML]; 
							} else{      //未知类型  其他后缀/无后缀  /音频  视频...
								upList.type = EM_TYPE.NONE;       
								upList.iconPath = iconPath[EM_TYPE.NONE];
							}
						}
						// 判断是否存在
						if (OBJList.uploadList.length==0) {
							OBJList.uploadList.push(upList);
						}else{
							nameArr = [];
							for (var j = 0; j < OBJList.uploadList.length; j++) {
								nameArr.push(OBJList.uploadList[j].path);
							}
							index = $.inArray(upList.path,nameArr);
							//不存在
							if (index<0) {
								OBJList.uploadList.push(upList);
							}else{
								OBJList.uploadList[index] = upList;
							}
						}
						// 6 ???
						if(bspeed==0){
							// timeBox.innerHTML = '上传已取消';
						}
						//  7 下一个 
						//  递归 循环
						if(progress==1.00||progress==1) {
							fileArr.splice(num,1);
							upObj = fileArr[num];
							if (upObj!=undefined) {
								fn();
							}
						}
					}
				}
				var filePath,time,upMessage,path,pathArr,newArr,folderName;
				if (upObj!=undefined) {
					filePath = globalData.userInfo.rootPath + globalData.currentPath +upObj.webkitRelativePath; //  xx/xxt/t.txt
					// 1 文件夹纪录
					var obj = {
						name:upObj.webkitRelativePath.replace(upObj.name,""),
						// 文件的wjj路径   需要新建的文件夹
						type:EM_TYPE.FOLDER,
						iconPath:iconPath[EM_TYPE.FOLDER],

						path:filePath.replace(upObj.name,""),
						//文件夹总路径  去掉最后/
						fileName:upObj.name,// wj名 

						time:upObj.lastModified.toLocaleString(),
						index:globalData.upDownList.uploadList.length,
						size:0,

						progress:1.00,
						restTime:"0s"
					}

					if (OBJList.uploadList.length==0) {
						OBJList.uploadList.push(obj);
					}else{
						nameArr = [];

						for (var k = 0; k < OBJList.uploadList.length; k++) {
							nameArr.push(OBJList.uploadList[k].path);
						}

						index = $.inArray(obj.path,nameArr);
						//不存在
						if (index<0) {
							OBJList.uploadList.push(obj);

							//  3 建文件夹  
							newArr = [];
							path = upObj.webkitRelativePath.replace(upObj.name,""); //   xx/xx/ 
							pathArr = path.split("/");

							for (var i = 0; i < pathArr.length; i++) {
								if( pathArr[i]!=""){//数组最后一个为空
									newArr.push(pathArr[i]);
									folderName = newArr.join("/");
									globalOp.newFolder(folderName);
								}
							}
						}else{//cz 替换
							OBJList.uploadList[index] = obj;
						}
					}
					// 2 上传文件
					globalData.ossObj.multipartUpload(filePath,upObj,
						{
							progress:progress
						}
					).then(function (re) {     
						setTimeout(function(){
							globalOp.listFile(globalData.currentPath); 
						},1000);
					}); 
					// 取消的话 文件夹建不成功 文件夹上传纪录也要清除？
				} 
			}
			fn();
		},
		// 上传文件 当前位置 【一个、多个 文件 文件夹  混合 进度 速度】
		//  【一个文件		fileName:文件名;
		//          	file:文件信息;
		uploadFile: function(fileArr) {  
			// 进度 progress
			var upObj,// 文件 信息
				fileTotal,startTime,alLoad,
				startLoad,nowTime,subtotalTime,
				subtotalLoad,speed,bspeed,
				units = 'b/s',restTime,upList;

			var OBJList = globalData.upDownList;
			var index;
			var nameArr = [];

			// 开始  
			var i = 0;
			function fn(){   
				upObj = fileArr[i];
				// 断点
				var checkpoint = function (argument) {
					// body...  "checkpoint"
				}
				var progress = function(progress,checkpoint,res){   
					return function (done){   
						done(); //
						// 文件大小
						fileTotal = upObj.size;             
						// 开始 上传
						if (progress==0) {
							startTime = new Date().getTime(); 
							startLoad = 0; // 初始大小

							OBJList.uploadSpeed = "0kb/s";
						}
						// 1
						nowTime = new Date().getTime();
						subtotalTime = (nowTime-startTime)/1000;
						if (isNaN(subtotalTime)) {
							subtotalTime = 0;
						}
						startTime = nowTime; 
						// 2
						alLoad = progress*fileTotal;
						subtotalLoad = alLoad - startLoad;
						if (isNaN(subtotalLoad)) {
							subtotalLoad = 0;
						}
						startLoad = alLoad;

						// 3
						speed = subtotalLoad/subtotalTime; // 
						if (isNaN(speed)) {
							speed = 0;
						}
						speed = Math.abs(speed);
						bspeed = speed;

						// 速度计算 b kb Mb
						if(speed/1024>1){
							speed = speed/1024;
							units = 'kb/s';
						}
						if(speed/1024>1){
							speed = speed/1024;
							units = 'Mb/s';
						}
						if (speed!=0) {
							speed = speed.toFixed(2);
						}
						// 4
						restTime = ((fileTotal-alLoad)/bspeed).toFixed(2);
						// 以当前速度 剩余所需时间 = 剩余大小/速度
						if (isNaN(restTime)) {
							restTime = 0;
						}
                        
						// 上传完成
						if (restTime==0.00) {
							speed = 0;
							units = 'kb/s';
						}
						// 无穷大 开始上传
						if (restTime==Infinity) {
							restTime = "正在计算";
						}else{
							restTime = Math.abs(restTime);
							restTime = restTime + "s";
							//  有负 绝对值?  时间  速度
							// if(restTime/60>1){
							//     restTime = restTime/60 + "min" + 余秒;
							// }
						}
						// 5.1
						OBJList.uploadSpeed = speed + units;// 上传速度
						progress = progress.toFixed(2);

						// 5.2上传列表
						upList = {
							path:globalData.userInfo.rootPath + globalData.currentPath + upObj.name,//上传文件对象
							name:upObj.name, //文件名

							type:"",
							iconPath:"",

							size:upObj.size,
							time:upObj.lastModified.toLocaleString(),

							progress:progress,//进度
							restTime:restTime, // 剩余时间
							index:globalData.upDownList.uploadList.length,
						};
						console.log(upList);
						// 文件类型判断
						var point = upObj.name.lastIndexOf("."); // 分割点
						if (point==-1) {   // 无分割点  未知类型
							upList.type = EM_TYPE.NONE;      
							upList.iconPath = iconPath[EM_TYPE.NONE];
						}  else{              // 有分割点
							// 分割点后截取类型
							var type = upObj.name.slice(point+1);
							if (type=="txt"||type=="doc"||type=="pdf"||type=="docx"||type=="chm"||type=="chw") {   
								upList.type = EM_TYPE.DOC;        
								upList.iconPath = iconPath[EM_TYPE.DOC] ; 
							} else if (type=="jpg"||type=="png"||type=="jpeg"||type=="gif") {
								upList.type = EM_TYPE.PIC;        
								upList.iconPath = iconPath[EM_TYPE.PIC] ;         
							} else if (type=="zip"||type=="rar"){
								upList.type = EM_TYPE.ZIP;       
								upList.iconPath = iconPath[EM_TYPE.ZIP];
							} else if(type=="html"||type=="css"||type=="js"||type=="php"||type=="md"){  //html等文件
								upList.type = EM_TYPE.HTML;       
								upList.iconPath = iconPath[EM_TYPE.HTML]; 
							} else{      //未知类型  其他后缀/无后缀  /音频  视频...
								upList.type = EM_TYPE.NONE;       
								upList.iconPath = iconPath[EM_TYPE.NONE];
							}
						}
						// 判断是否存在
						if (OBJList.uploadList.length==0) {
							OBJList.uploadList.push(upList);
						}else{
							nameArr = [];
							for (var j = 0; j < OBJList.uploadList.length; j++) {
								nameArr.push(OBJList.uploadList[j].path);
							}
							index = $.inArray(upList.path,nameArr);
							//不存在
							if (index<0) {
								OBJList.uploadList.push(upList);
								// unshift
							}else{
								OBJList.uploadList[index] = upList;
							}
						}
						// 6 ???
						if(bspeed==0){
							// timeBox.innerHTML = '上传已取消';
						}
						// 递归 循环
						if(progress==1.00) {
							fileArr.splice(i,1);
							upObj = fileArr[i];
							if (upObj!=undefined) {
								fn();
							}
						}
					}
				}
				var time,upMessage,filePath;
				if (upObj!=undefined) {
					filePath = globalData.userInfo.rootPath + globalData.currentPath + upObj.name;

					globalData.ossObj.multipartUpload(filePath,upObj,
						{   
							checkpoint:checkpoint,
							progress: progress
						}
					).then(function (res){
						globalOp.listFile(globalData.currentPath);
					});
				}  
			}
			fn();
		},
		// 下载文件 传入参数: 下载对象的名字   保存的命名(谨记后缀)
		downloadFile: function(objArr) {
			console.log(objArr);
			console.log(objArr[0]);
			var i=0;
			var Time = null;
			// 文件信息
			var time,upMessage,fileObj;
			var point,type;
			Time = setInterval(function () {   
				if (objArr[i]==undefined) {  // 这个位置没有值
					i++; 
				}else{
					// 两种状态
					fileObj = objArr[i].path + objArr[i].name;
					window.location = globalData.ossObj.signatureUrl(fileObj, 
					{
						expires: 3600,//链接有效期 秒
						response: {
							'content-disposition': 'attachment; filename="' + objArr[i].name + '"'
						},
					});
					upMessage = {
						path:fileObj,
						time:new Date().toLocaleString(),
						name:objArr[i].name,
						size:objArr[i].size,
						type:"",
						iconPath:"",
						progress:1,
						restTime:0
					}
					point = objArr[i].name.lastIndexOf("."); // 分割点
					if (point==-1) {   // 无分割点  未知类型
						upMessage.type = EM_TYPE.NONE;      
						upMessage.iconPath = iconPath[EM_TYPE.NONE];
					} else{              // 有分割点
						// 分割点后截取类型
						type = objArr[i].name.slice(point+1);
						if (type=="txt"||type=="doc"||type=="pdf"||type=="docx"||type=="chm"||type=="chw") {   
							upMessage.type = EM_TYPE.DOC;        
							upMessage.iconPath = iconPath[EM_TYPE.DOC] ; 
						} else if (type=="jpg"||type=="png"||type=="jpeg"||type=="gif") {
							upMessage.type = EM_TYPE.PIC;        
							upMessage.iconPath = iconPath[EM_TYPE.PIC] ;         
						} else if (type=="zip"||type=="rar"){
							upMessage.type = EM_TYPE.ZIP;       
							upMessage.iconPath = iconPath[EM_TYPE.ZIP];
						} else if(type=="html"||type=="css"||type=="js"||type=="php"){  //html等文件
							upMessage.type = EM_TYPE.HTML;       
							upMessage.iconPath = iconPath[EM_TYPE.HTML]; 
						} else{      //未知类型  其他后缀/无后缀  /音频  视频...
							upMessage.type = EM_TYPE.NONE;       
							upMessage.iconPath = iconPath[EM_TYPE.NONE];
						}
					}
					globalData.upDownList.downloadList.push(upMessage);

					i ++;
				}
				if (i>objArr.length-1) {
					clearInterval(Time);
				}
				loading.disappearNulls();
			},40);
		},
		// 文件 时间 转化        
		timeTransform:function(date){
			var m  = date.indexOf("T"); 
			var n = date.indexOf(":");

			var str = date.substring(m+1,n);
			str = Number(str);

			if (str>=2) {
				str = str + 8;

				if (str>=24) {
					str = 0;
				}
			}else{
				str = str + 8;
				str = "0"+str;
			}
			date = date.substring(0,m+1) + str + date.substring(n);
			date = date.replace("T"," ").substr(0,date.lastIndexOf("."));
			return date;
		},
		// 复制文件 (当点击复制时 实际是记录需要被复制的obj-key 执行粘贴才真正调用该函数)
		// 平板上操作是否需要改变 参考手机的复制方式?
		copyFile: function(objArr) {
			// console.log(objArr);
			for (var m = 0; m < objArr.length; m++) {
				if (objArr[m]==undefined) {
					objArr.splice(m,1)
				} 
			}
			// console.log(objArr);

			var fileNum,fileConfirm,fileInitial,fileNext,nameArr;
			var Path,path;

			globalData.oldPath = [];
			globalData.oldFileName = [];
			nameArr = [];

			var dex;
			for (var i = 0; i < objArr.length; i++){
				if (objArr[i]!=undefined) {
					if (!globalData.searching){   
						// console.log("一般 ")
						Path = globalData.userInfo.rootPath + globalData.currentPath;
                        
						globalData.oldPath = [];
						globalData.oldPath.push(Path);
						if (objArr[i].type!=0) { // 判断类型 文件
							nameArr.push(objArr[i].name);
							globalData.oldFileName[0] = nameArr;
							console.log(nameArr);
						}else{
							path = objArr[i].path + objArr[i].name + "/"; // 文件夹 截取的路径 不同
							// nameArr.push(path); 
							// console.log(dex)
							index = -1;
							dex = 0;
							cutName();
						}
					} else{   
						// 判断路径是否相同 是否已添加
						var index = $.inArray(objArr[i].path,globalData.oldPath);
						if (index!=-1) {
							// 存在 路径  肯定有文件
							// nameArr = nameArr;// ? weikong
							// globalData.oldPath[index] = path;
							// globalData.oldFileName[index] = nameArr;
						} else{
							// 不存在 路径添加
							Path = objArr[i].path;
							globalData.oldPath.push(Path);
							// nameArr = [];
						}
						if (objArr[i].type!=0) { // 判断类型 文件
							nameArr.push(objArr[i].name);
							globalData.oldFileName[i].push(nameArr);
							console.log(123);
						} else{
							path = objArr[i].path + objArr[i].name + "/"; // 文件夹 截取的路径 不同
							// console.log(path)
							dex = globalData.oldFileName.length;
							cutName();
						}
					}
				}
			}
			function cutName() {
				fileNum = []; 
				fileConfirm=true;
				fileInitial = path; 
				fileNext = "";
				function copyList() {
					globalData.ossObj.list({
						prefix:fileInitial,
						marker:fileNext,
						'max-keys':1000,
					}).then(function(res){
						if(fileConfirm){
							fileNum=res.objects;
							fileConfirm=false;
						}  else{
							if (res.objects!=undefined) {
								for (var k=0;k<res.objects.length; k++) {
									fileNum.push(res.objects[k]);
								}
							}
						}
						if(res.nextMarker!=null){
							fileNext=res.nextMarker;
							copyList();
						}else{
							if (fileNum!=undefined) {   
								// nameArr = [];
								var idx;
								for (var j = 0; j < fileNum.length; j++){   
									fileNum[j].name = fileNum[j].name.replace(Path,"");
									idx =  $.inArray(fileNum[j].name,nameArr);
									if(idx==-1){
										nameArr.push(fileNum[j].name);
									}     
								} 
								globalData.oldFileName = [];
								console.log(dex);
								console.log(globalData.oldFileName);
								console.log(nameArr);
								globalData.oldFileName.push(nameArr);
								console.log(globalData.oldFileName[dex]);
							}
						}                              
					});
				};
				copyList();
			}
		},
		copyEncodeURI:function (url) {   
			// encodeURI  /不会被编码
			return encodeURI(url);
		},
		previewEncodeURI:function (url) {
			// encodeURIComponent / 会被编码
			return encodeURIComponent(url);
		},
		//剪切文件
		shearObj:function () {
			// 粘贴
			var newPath = globalData.userInfo.rootPath + globalData.currentPath ;
			var oldPath = globalData.oldPath;
			var fileNameArray = globalData.oldFileName;
			console.log(globalData.oldFileName);
			console.log(fileNameArray)
			for (var i = 0; i < oldPath.length; i++) {
				for (var j = 0; j < fileNameArray[i].length; j++){
					// console.log(newPath+fileNameArray[i][j])
					// fileNameArray[i][j] = fileNameArray[i][j].replace(",","");
					globalData.ossObj.copy(newPath+fileNameArray[i][j],globalOp.copyEncodeURI(oldPath[i]+fileNameArray[i][j])).then(function (result) 
					{
						// console.log(result.res);
						console.log("j=="+j)
					}).catch(function (err) {   
						console.log("参数2旧路径需要编码 谷歌浏览器安全防护 跨域问题: "+err);
						// console.log(err);
					});
					// 删除 剪切
					globalData.ossObj.delete(oldPath[i]+fileNameArray[i][j])
					.then(function (data) {

					});
				}
			}
			loading.disappearNulls();
			globalData.oldFileName = [];
			globalData.oldPath = [];
			setTimeout(function(){
				globalOp.listFile(globalData.currentPath);//刷新文件列表
			},1000);
		},
		// 粘贴文件 新位置路径   
		pasteFile:function ()  {
			var newPath = globalData.userInfo.rootPath + globalData.currentPath ;
			var oldPath = globalData.oldPath;
			var fileNameArray = globalData.oldFileName;
			console.log(oldPath);
			console.log(fileNameArray);
			// var oldPath = globalOp.copyEncodeURI(globalData.oldPath);//编码
			for (var i = 0; i < oldPath.length; i++) {
				for (var j = 0; j < fileNameArray[i].length; j++) {
					// fileNameArray[j]
					globalData.ossObj.copy(newPath+fileNameArray[i][j],globalOp.copyEncodeURI(oldPath[i]+fileNameArray[i][j])).then(function (result) 
					{
						// console.log(result.res);
						console.log("j=="+j)
					}).catch(function (err) {   
						console.log("参数2旧路径需要编码 谷歌浏览器安全防护 跨域问题: "+err);
					});
				}
				console.log(1111);
			}
			loading.disappearNulls();
			// 清空原文件
			globalData.oldFileName = [];
			globalData.oldPath = [];
			setTimeout(function(){
				globalOp.listFile(globalData.currentPath);//刷新文件列表
			},1000);
		},
		// 【待完善】
		// 重命名  单一文件 
		// 一般情况：参数1 2：完整的文件名：文件名.文件类型
		// 搜索状态：参数 1 2 不变  参数3是路径 参数4 文件在列表中的位置顺序
		refileName:function (obj) {  
			var oldPath ;
			var newPath ;
			console.log(obj[0].val);
			oldPath = obj[0].path + obj[0].name;
			newPath = obj[0].path + obj[0].val;

			globalData.ossObj.copy(newPath,globalOp.copyEncodeURI(oldPath))
 			.then(function (data) {
				console.log(data);
				loading.disappearNulls();
			});
			globalData.ossObj.delete(oldPath)
			.then(function (data) {
				console.log(data);
				globalData.fileList[obj[0].index].name = obj[0].val;
				loading.disappearNulls(7);
			});
		},
		// 重命名 单一文件夹
		// 参数：旧  新 文件夹名 
		refolderName:function (obj) { 
			var newPath ;
			var oldPath ; 

			oldPath = obj[0].path + obj[0].name;
			newPath = obj[0].path + obj[0].val;

			var dataArr = [];
			var flag = true;
			var initial = oldPath;
			console.log(initial);
			var next = "";//初为空 即为文件夹本身
			function reName() {
				globalData.ossObj.list({
					prefix:initial,// 前缀
					marker:next, // 之后
					'max-keys':1000
				}).then(function (data) {   
					if(flag){
						console.log(data);
						dataArr = data.objects;
						flag = !flag;
					}else{
						console.log(data.objects);
						if (data.objects!=undefined) {
							for (var i=0;i<data.objects.length; i++) {
								dataArr.push(data.objects[i]);
							}
						}
					}
					if (data.nextMarker!=null) {
						next = data.nextMarker;
						reName();
					}else{
						if(dataArr!=undefined){ 
							for(var i=0;i<dataArr.length; i++){   
								var name = dataArr[i].name.replace(oldPath,"");
								globalData.ossObj.copy(newPath+name,globalOp.copyEncodeURI(dataArr[i].name))
								.then(function (data) {
									console.log(data);
								});
								// 文件夹下对象
								globalData.ossObj.delete(dataArr[i].name).then(function (data) {
									console.log(data);
									globalOp.listFile(globalData.currentPath);
								});
							}
							// 文件夹本身
							globalData.ossObj.delete(oldPath)
							.then(function (data) {
								globalData.fileList[obj[0].index].name = obj[0].val; // 当前显示
							});
						}
					}
					loading.disappearNulls();
				});
			}
			reName();
		},
		// 预览文件(文件内容 文件信息)
		previewFile: function(fileObjKey) {
			console.log('adddres_blur');
			var obj = globalData.fileList;
			// 【可以直接操作 不需要再循环了】
			for (var i = 0; i < obj.length; i++) {
				if(obj[i].name==fileObjKey){
					return obj[i].url;
				}
			}
		},
		// 重命名 单一文件夹
		// 参数：旧  新 文件夹名 
		// 分享文件 参考百度网盘 URL+一个四位获取码  【整个过程】
		// 分享 获取文件 信息   地址  选择分享的地方 目标
		// 1.获取创建地址链接 密码 通过 qq等发送链接  对方也是在云盘打开
		// 2.直接发送给 磁盘好友 在线发送文件
		shareFile: function(fileObjKey) {
			console.log('adddres_blur');
			// 【待定】
			// 备注:
			// file objec-key  指  /xxx/xxx/xxx/t1.txt
			// file            指  t1.txt
			var obj = globalData.fileList;
			for (var i = 0; i < obj.length; i++) {
				if(obj[i].name==file){
					return obj[i].url + "+"+ Math.round(Math.random()*(8999)+1000);
				}
			}
		},
		filtrateFile:function (keyWords) {//当前路径筛选 
			console.log(globalData.fileList);
			var list = globalData.fileList;
			globalData.fileList = [];
			for (var i = 0; i < list.length; i++) {
				if(list[i].name.match(keyWords)){
					globalData.fileList.push(list[i]);
				}
			}
			console.log(globalData.fileList); 
		},
		// 搜索文件
		searchFile: function(keyWords) {
			var searchList = [];
			var fileConfirm=true;
			var fileInitial = globalData.userInfo.rootPath + globalData.currentPath;
			var fileNext = fileInitial;
			function resultList() {
				globalData.ossObj.list({
					prefix:fileInitial,
					marker:fileNext,
					"max-keys":1000
				}).then(function (re) {
					if (fileConfirm) {
						searchList=re.objects;
						fileConfirm=false;
					}else{
						if (re.objects!=undefined) {
							for (var i=0;i<re.objects.length; i++) {
								searchList.push(re.objects[i]);
							}
						}
					}
					if (re.nextMarker!=null) {
						fileNext=re.nextMarker;
						resultList();
					} else{
						// console.log(searchList);
						globalData.fileList= [];
						var file = [];
						var folder = [];
						console.log(searchList);
						if (searchList!=undefined) {   
							for (var i = 0; i < searchList.length; i++) {
								if(searchList[i].name.match(keyWords)&&
									searchList[i].name.charAt(searchList[i].name.length - 1)!="/")
								{
									file.push(searchList[i]);
								}
								if(searchList[i].name.match(keyWords)&&
									searchList[i].name.charAt(searchList[i].name.length - 1)=="/") 
								{
									folder.push(searchList[i]);
								}
							}
							// 文件夹
							var newFolder;
							var result;
							var path;
							for (var i = 0; i < folder.length; i++) {
								newFolder = folder[i].name.split("/"); //
								result = newFolder[newFolder.length-2];// 拿到最后一层的名字
								path = folder[i].name.replace(result,"");
								path = path.substring(0,path.length-1);
								path = path.substring(0,path.length-1);

								if (result.match(keyWords)) {   
									globalData.fileList.push({
										name:result,
										path:path,
										type:EM_TYPE.FOLDER,       
										iconPath:iconPath[EM_TYPE.FOLDER],
										index:globalData.fileList.length,
										val:'',
										isSelect:false,
										url:folder[i].url
									});
								}
							} 
							// 文件
							var newFile,
								fileName,
								fileObj,
								point,
								type;
							for (var i = 0; i < file.length; i++) {   
								newFile = file[i].name.split("/"); //
								fileName = newFile[newFile.length-1];

								if(fileName.match(keyWords)){
									fileObj = {
										name:fileName,
										type:"", 
										path:file[i].name.replace(fileName,""),
										url:file[i].url,
										iconPath:'',
										index:globalData.fileList.length,
										val:'',
										size:file[i].size,
										date:file[i].lastModified.replace("T"," ").substr(0,file[i].lastModified.lastIndexOf("."))  
									}
									// XX.XX
									point = fileName.lastIndexOf("."); 
									if (point==-1) {   
										fileObj.type = EM_TYPE.NONE;      
										fileObj.iconPath = iconPath[EM_TYPE.NONE];
									} else{             
										type = fileName.slice(point+1);
										if (type=="txt"||type=="doc"||type=="pdf") {   
											fileObj.type = EM_TYPE.DOC;        
											fileObj.iconPath = iconPath[EM_TYPE.DOC] ; 
										}else if (type=="jpg"||type=="png"||type=="jpeg"||type=="gif") {
											fileObj.type = EM_TYPE.PIC;        
											fileObj.iconPath = iconPath[EM_TYPE.PIC] ;         
										}else if (type=="zip"||type=="rar"){
											fileObj.type = EM_TYPE.ZIP;       
											fileObj.iconPath = iconPath[EM_TYPE.ZIP];
										}else if(type=="html"||type=="css"||type=="js"||type=="php"){  
											fileObj.type = EM_TYPE.HTML;       
											fileObj.iconPath = iconPath[EM_TYPE.HTML]; 
										}else{      //未知类型  
											fileObj.type = EM_TYPE.NONE;       
											fileObj.iconPath = iconPath[EM_TYPE.NONE];
										}
									}
									globalData.fileList.push(fileObj);
								}
							}
						}
						console.log(globalData.fileList);
					}
				});
			};
			if (keyWords.trim()) {
				resultList() ;
			}else{ // "" "  " null undefined
				globalOp.listFile(globalData.currentPath);
			}
		},
		/* (上传下载)列表控制 */
		// 暂停;开始
		pauseFile: function(listType) { //是集中一个好 还是分开函数好?
			switch(listType){
				case 'upload':
				break;
				case 'download':
				break;
				default:
					console.log("error type");
			}
		},
		// 取消
		quitFile: function() {},
		// 全部开始
		startAll: function() {},
		// 全部暂停
		pauseAll: function() {},
		// 全部取消
		quitAll: function() {},
		// 清空已完成 清空纪录 
		// uploadList []
		// downloadList []
		cleanFinish: function() {},
		/* 路径切换 */
		// 显示路径 + 默认 获取列表、
		// 操作显示路径
		// 前进  后退  获取当前 与已知比较 调listfile();
		// 路径记录:可以添加也可以删除,是一个list,遵循先进后出概念
		recordPath: function(path) {// 完整路径 如果是根目录 即"/" 如果有文件夹 即 "/xxx/"
			globalData.pathRecord.push(path);
		},
		// 打开文件夹  已有
		openFolder: function(folderName) {//folderName不带任何/ 只是名字
			//4次触发*
			if(typeof(globalData.pathRecord[globalData.addressData+1])!="undefined"){
				globalData.pathRecord.splice((globalData.addressData+1),globalData.backStep)
			}
			globalData.currentPath = globalData.currentPath + folderName + "/";                  //路径组装
			globalOp.listFile(globalData.currentPath);     //进入 用户的目标目录
			globalOp.recordPath(globalData.currentPath);   //并且记录下来
			globalData.addressData++;
			globalData.backStep = 0;
//			globalData.fileNames[0].name='';
		},
		// 返回上一次路径 先拿到当前  后退   数组元素位置
		backPath: function(current) {//切割   截取
			console.log('adddres_blur');
			if(globalData.addressData>0){
				globalOp.listFile(globalData.pathRecord[globalData.addressData-1]);
				globalData.currentPath=globalData.pathRecord[globalData.addressData-1];
				globalData.addressData--;
				globalData.backStep++;
			}
		},
		// 前进路径
		goPath: function(current) {
			console.log('adddres_blur');
			if(globalData.pathRecord.length==(globalData.addressData+1)){
        		
			}else{
				globalOp.listFile(globalData.pathRecord[globalData.addressData+1]);
				globalData.currentPath=globalData.pathRecord[globalData.addressData+1];
				globalData.addressData++;
				globalData.backStep--;
			}
		},   
		// 跳转到指定路径
		toDesignatedPath: function(path) {
			var lastChar = path[path.length-1];
			if(path!=globalData.currentPath){
				globalData.addressData++;
			}
			var paths=globalData.currentPath;
			if(lastChar == '/'){
				globalData.currentPath = path;
			}else{
				globalData.currentPath = path+"/";
			}
			globalData.searching=false;
			globalOp.listFile(globalData.currentPath);
			if(globalData.currentPath!=paths){
				globalOp.recordPath(globalData.currentPath);
			}
		},
		// 上一级路径
		toUpPath: function() {
        	var path = globalData.currentPath;
			path = path.substr(0,path.lastIndexOf("/",path.length-2));
			globalOp.toDesignatedPath(path);
		},
		//发送验证
		getAuthCode:function (telephone) {   
			$.post("http://skt-studio.com/vue/aliyun-dysms-php-sdk/api_demo/SmsDemo.php",
			{tel:telephone},function (data,status) {   
				if (status=="success") {
					var dataArr = data.split(","); // tel code state
					if(dataArr[2]=='OK'){// state   
						console.log( dataArr[1]);//code
					}else{// 签名不合法 、 手机号不合法
						console.log("远程错误: "+dataArr[2]);
					}
				}else{
					console.log('请求失败')
				}
			});
		},
		/* 正则封装 */
		// 检查是否存在 根据rule判断str返回bool类型
		isExisting: function(checkStr,checkRule){},
		// 根据rule提取str 返回数组
		extractArray: function(checkStr,checkRule){},
		isFile: function(str){ // 
			var ret = new RegExp(/^(.)+((?!\/).)$/);
			return ret.test(str);
		},
		isFolder: function(str){ // 列表文件夹
			var ret = new RegExp(/^(.)+\/$/);
			return ret.test(str);
		},

		// 文件夹命名检查规则 新建文件夹判断
		checkFolderName: function(str) {
			var reg = new RegExp(/^[a-zA-Z0-9\u4e00-\u9fa5][a-zA-Z0-9-./_\u4e00-\u9fa5]{1,254}$/);
			return reg.test(str);
		},
		/* 安全操作 */
		// 加密算法 对AccessKey进行可解加密 (未定)
		encryptAccessKey: function(accessKey) {},
		// 解密算法 对POST返回的AccessKey进行解密 (未定)
		decryptAccessKey: function(accessKey) {},
		// 注册检查(检查用户名是否已占用 密码是否正确等等 返回bool数组 提供ui打gou提示用)
		checkRegister: function() {},
		// 错误码处理
		/*
		    -1          指令错误
		    100-199     账户sql请求返回
		    200-299     本地操作的异常
		    other       未知错误
		*/
		errCodeTrans: function(code){
			var retStr = ":";
			switch(code){
				case -1:
					retStr = code+retStr+"请求指令错误";
				break;  
				case 100:
					retStr = code+retStr+"用户不存在";
				break;
				case 101:
					retStr = code+retStr+"密码错误";
				break;
				case 102:
					retStr = code+retStr+"账户异常 请联系工作人员";
				break;
				case 103:
					retStr = code+retStr+"账户已登陆";
				break;
				case 200:
					retStr = code+retStr+"不存在ID对应的产品信息";
				break;
				case 201:
					retStr = code+retStr+"产品ID获取异常 请及时联系工作人员";
				break;
				case 300:
					retStr = code+retStr+"注册失败";
				break;
				default:
					retStr = code+retStr+"未知错误";
			}
			return retStr;
		},
		// MD5生成 (用户密码将会以这种方式操作 mysql存储的也是MD5格式)
		encryptMD5: function(string) {
			function md5_RotateLeft(lValue, iShiftBits) {
				return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
			}
			function md5_AddUnsigned(lX, lY) {
				var lX4, lY4, lX8, lY8, lResult;
				lX8 = (lX & 0x80000000);
				lY8 = (lY & 0x80000000);
				lX4 = (lX & 0x40000000);
				lY4 = (lY & 0x40000000);
				lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
				if (lX4 & lY4) {
					return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
				}
				if (lX4 | lY4) {
					if (lResult & 0x40000000) {
						return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
					} else {
						return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
					}
				} else {
					return (lResult ^ lX8 ^ lY8);
				}
			}
			function md5_F(x, y, z) {
				return (x & y) | ((~x) & z);
			}
			function md5_G(x, y, z) {
				return (x & z) | (y & (~z));
			}
			function md5_H(x, y, z) {
				return (x ^ y ^ z);
			}
			function md5_I(x, y, z) {
				return (y ^ (x | (~z)));
			}
			function md5_FF(a, b, c, d, x, s, ac) {
				a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
				return md5_AddUnsigned(md5_RotateLeft(a, s), b);
			};
			function md5_GG(a, b, c, d, x, s, ac) {
				a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
				return md5_AddUnsigned(md5_RotateLeft(a, s), b);
			};
			function md5_HH(a, b, c, d, x, s, ac) {
				a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
				return md5_AddUnsigned(md5_RotateLeft(a, s), b);
			};
			function md5_II(a, b, c, d, x, s, ac) {
				a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
				return md5_AddUnsigned(md5_RotateLeft(a, s), b);
			};
			function md5_ConvertToWordArray(string) {
				var lWordCount;
				var lMessageLength = string.length;
				var lNumberOfWords_temp1 = lMessageLength + 8;
				var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
				var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
				var lWordArray = Array(lNumberOfWords - 1);
				var lBytePosition = 0;
				var lByteCount = 0;
				while (lByteCount < lMessageLength) {
					lWordCount = (lByteCount - (lByteCount % 4)) / 4;
					lBytePosition = (lByteCount % 4) * 8;
					lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
					lByteCount++;
				}
				lWordCount = (lByteCount - (lByteCount % 4)) / 4;
				lBytePosition = (lByteCount % 4) * 8;
				lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
				lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
				lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
				return lWordArray;
			};
			function md5_WordToHex(lValue) {
				var WordToHexValue = "",
					WordToHexValue_temp = "",
					lByte, lCount;
				for (lCount = 0; lCount <= 3; lCount++) {
					lByte = (lValue >>> (lCount * 8)) & 255;
					WordToHexValue_temp = "0" + lByte.toString(16);
					WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
				}
				return WordToHexValue;
			};
			function md5_Utf8Encode(string) {
				string = string.replace(/\r\n/g, "\n");
				var utftext = "";
				for (var n = 0; n < string.length; n++) {
					var c = string.charCodeAt(n);
					if (c < 128) {
						utftext += String.fromCharCode(c);
					} else if ((c > 127) && (c < 2048)) {
						utftext += String.fromCharCode((c >> 6) | 192);
						utftext += String.fromCharCode((c & 63) | 128);
					} else {
						utftext += String.fromCharCode((c >> 12) | 224);
						utftext += String.fromCharCode(((c >> 6) & 63) | 128);
						utftext += String.fromCharCode((c & 63) | 128);
					}
				}
				return utftext;
			};
			var x = Array();
			var k, AA, BB, CC, DD, a, b, c, d;
			var S11 = 7,
				S12 = 12,
				S13 = 17,
				S14 = 22;
			var S21 = 5,
				S22 = 9,
				S23 = 14,
				S24 = 20;
			var S31 = 4,
				S32 = 11,
				S33 = 16,
				S34 = 23;
			var S41 = 6,
				S42 = 10,
				S43 = 15,
				S44 = 21;
			string = md5_Utf8Encode(string);
			x = md5_ConvertToWordArray(string);
			a = 0x67452301;
			b = 0xEFCDAB89;
			c = 0x98BADCFE;
			d = 0x10325476;
			for (k = 0; k < x.length; k += 16) {
				AA = a;
				BB = b;
				CC = c;
				DD = d;
				a = md5_FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
				d = md5_FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
				c = md5_FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
				b = md5_FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
				a = md5_FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
				d = md5_FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
				c = md5_FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
				b = md5_FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
				a = md5_FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
				d = md5_FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
				c = md5_FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
				b = md5_FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
				a = md5_FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
				d = md5_FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
				c = md5_FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
				b = md5_FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
				a = md5_GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
				d = md5_GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
				c = md5_GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
				b = md5_GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
				a = md5_GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
				d = md5_GG(d, a, b, c, x[k + 10], S22, 0x2441453);
				c = md5_GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
				b = md5_GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
				a = md5_GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
				d = md5_GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
				c = md5_GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
				b = md5_GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
				a = md5_GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
				d = md5_GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
				c = md5_GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
				b = md5_GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
				a = md5_HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
				d = md5_HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
				c = md5_HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
				b = md5_HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
				a = md5_HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
				d = md5_HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
				c = md5_HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
				b = md5_HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
				a = md5_HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
				d = md5_HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
				c = md5_HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
				b = md5_HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
				a = md5_HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
				d = md5_HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
				c = md5_HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
				b = md5_HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
				a = md5_II(a, b, c, d, x[k + 0], S41, 0xF4292244);
				d = md5_II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
				c = md5_II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
				b = md5_II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
				a = md5_II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
				d = md5_II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
				c = md5_II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
				b = md5_II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
				a = md5_II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
				d = md5_II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
				c = md5_II(c, d, a, b, x[k + 6], S43, 0xA3014314);
				b = md5_II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
				a = md5_II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
				d = md5_II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
				c = md5_II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
				b = md5_II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
				a = md5_AddUnsigned(a, AA);
				b = md5_AddUnsigned(b, BB);
				c = md5_AddUnsigned(c, CC);
				d = md5_AddUnsigned(d, DD);
			}
			return (md5_WordToHex(a) + md5_WordToHex(b) + md5_WordToHex(c) + md5_WordToHex(d)).toLowerCase();
		}
	}
});

// ossAccount: {               // oss账户信息
    // username:'',

    // 登陆后获取返回信息存放于此
    // authority:'',           // 用户权限 客户?管理员?
    // rootPath:'',            // 根路径初始位置

    // createTime:'',          // 创建时间
    // sex:'',                 // 性别
    // company:'',             // 公司
    // jog:'',                 // 职位
    // email:'',               // 邮箱
    // call:''                 // 联系电话
    // 现 改为临时获取
    /*
    由于bucket无法指定文件夹路径 而且bucker只有20个上限
    解决方法:添加 过滤规则 用户登录后mysql返回一个根路径 并保存下来
    用户以此为根 每次移动的时候   rootPath + 用户看到的路径
    eg. 用户  "/"  实际是 "/bucket/company/username/"
     */
    
    // 下方是临时测试用 实际投入应用需要注释掉
    // 仅可通过stsServer请求获取 不存储 仅用于oss连接且一次
    // region: 'oss-cn-shenzhen',                          //源
    // accessKeyId: 'LTAIWFeCifuDQJrY',                    //id
    // accessKeySecret: '2SlSDji02K7Lc2ale11xdKNpOGYXy3',  //密码
    // bucket: 'test-tcr'                                  //存储空间
// },
