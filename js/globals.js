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
    NONE:3              //未知
};
// 类型对应的图片地址 使用方法  iconPath = iconPath[EM_TYPE.FOLDER]
var iconPath = [
    "img/folder.png",
    "img/document.png",
    "img/picture.png",
    "img/unknown.png",
];
// data
window.onload = function(){
	console.log(123);
	globalOp.logout();
}
var globalData = new Vue({
    router: router,
    data:{
        // 存储于此处的变量是与界面渲染同步相关的
        /* 登录相关 */
        loginType:'oss',            // 登陆类型 oss location
        loginState:false,           // 登录状态 true 已登录 false 未登录(控制登录界面的显示)

        ossObj: null,               // oss通信 操作对象
        fileName:'',                   // 文件操作组件选中对象
        socketObj: null,            // 本地通信 操作对象
        socketServer: {ip:'10.1.21.144',port:8080},//默认IP 如果有cookie就用cookie

        userInfo: null,             // 登陆后可以获取sql返回的所有用户信息 密码 根目录等等 但AK要删除

        /* 路径相关 */
        pathRecord:[],              // 路径记录 用于回退和前进
        backStep:0,                 // 回退次数 回退+1 前进-1 必须>=0 若打开文件夹or跳转任意路径:清零,路径记录尾部消除对应个数 
        currentPath:'/',            // 当前路径 /默认根目录 (永远必须带/结尾)   userInfo.rootPath + currentPath + "/" = /xx/xx/  /xx/

        /* 列表 */
        fileList:[],                // 文件列表 {name:"",type:0,url:"",iconPath:"",size:xx,isSelect:false}
        uploadList:[],              // 上传列表 {文件名 , 进度 , 运行状态}
        uploadSpeed:0,              // 下载列表 {文件名 , 进度 , 运行状态}
        downloadList:[],
        downloadSpeed:0,

        fileLength:0,               // 文件数量
        folderLength:0,             // 文件夹数量
        fileSize:0,                 // 使用内存总量

        /* 系统设置 */
        language:'cn',              //cookie存储 语言习惯 cn en jp

        /* 消息提示 */
        msg:null,                   //弹窗提示[{},{}]
        log:[],                     //操作记录
        
        view:'home'
    }
}).$mount('#App');
console.log(globalData);
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

                switch(loginType)
                {
                    case 'oss':
                        axios.post(this.stsServer, this.sendData)
                        .then(function (response) {
                            // console.log(response);
                            var axiosRet = response.data;

                            if(axiosRet.result){
                                console.log("登录成功");
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
                                globalData.currentPath = "/";                  //路径组装
                                globalOp.listFile(globalData.currentPath);     //进入 用户的目标目录
                                globalOp.recordPath(globalData.currentPath);   //并且记录下来

                                // 删除userInfo中的AK信息
                                delete globalData.userInfo.region;
                                delete globalData.userInfo.accessKeyId;
                                delete globalData.userInfo.accessKeySecret;
                                delete globalData.userInfo.bucket;
                            }
                            else{
                                console.log(globalOp.errCodeTrans(axiosRet.errorCode));
                            }
                        })
                        .catch(function (error) {
                            console.log(error);
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
        // 登出 退出
        logout: function() {
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
                    // 【没有正常退出】-【关闭窗口是否能触发】
                    // 【定时关闭】
                    if(axiosRet.result){
                        // 登出后需要重置数据
                        globalOp.resetData();

                        // 登出成功 重置所有数据
                        console.log("退出成功");
                    }
                    else{
                        console.log(globalOp.errCodeTrans(axiosRet.errorCode));
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            } else{
                //尚未登陆
            }
        },
        // 登出后需要重置数据
        resetData: function() {
            // 复位登陆状态
            globalData.loginState = false;
            // 用户信息清空
            globalData.userInfo = null;
            globalData.ossObj = null;
            globalData.socketObj = null;
            // 路径清空
            globalData.pathRecord = [];              // 路径记录 用于回退和前进
            globalData.currentPath = '/';            // 当前路径 /默认根目录
            
            globalData.truePath = "", 
            globalData.rootPath = null,
            // 列表清空
            globalData.fileList = [];                // 文件列表
            globalData.uploadList = [];              // 上传列表 {文件名 , 进度 , 运行状态}
            globalData.uploadSpeed = 0;              // 下载列表 {文件名 , 进度 , 运行状态}
            globalData.downloadList = [];
            globalData.downloadSpeed = 0;
            // 日志清空
            globalData.log=[];
        },
        // 注册 (未定)
        register: function(registerInfo) {
            // 【待测】
            if(!globalData.loginState){
                this.sendData.cmd = "register";
                this.sendData.data = registerInfo;//{username password 等}

                axios.post(this.stsServer, this.sendData)
                .then(function (response) {
                    console.log(response);
                    var axiosRet = response.data;

                    if(axiosRet.result){
                        console.log("注册成功");

                        // 返回登陆页面重新登陆
                    }
                    else{
                        console.log(globalOp.errCodeTrans(axiosRet.errorCode));
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        },
        // 获取当前账户的存储状况、剩余空间等信息
        // 获取 公司存储容量 统计自己的使用量 饼图()
        getOSSInfo: function() {},
        // 修改密码 
        changePassword: function(oldPassword,newPassword) {
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

                            globalData.userInfo.password = newPsw;
                            console.log(newPsw);
                        }
                        else{
                            console.log(globalOp.errCodeTrans(axiosRet.errorCode));
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                }
                else{
                    console.log("原密码输入错误");
                }
            }
        },
        // 修改用户信息 是否需要密码?
        changeUserInfo: function() {},

        /* 文件操作 */
        // 统一 返回真实路径 一个完整的OSS操作路径  用户根前缀+用户看到的路径+/
        // retRealPath(): function(path){
        //     return globalData.userInfo.rootPath + path + "/";
        // }
        // 获取文件列表(返回当前路径的文件夹和文件名json)
        listFile: function(path) {  // path 因此 结尾必须带 "/" 头部也有"/" 参数为用户看到的路径
            // 【正则 过滤】 
            // 【list()可以传参 一步到位 globalData.userInfo.rootPath】
            var tmpPreve = globalData.userInfo.rootPath + path;

            globalData.ossObj.list({
                prefix: tmpPreve,
                marker: tmpPreve
            }).then(function (res) {
                globalData.fileList = [];//清空

                var obj = res.objects;
                // console.log(obj)
                var file = [];
                var folder = [];  
                var fileSize = 0;
   
                var Reg = /\//g;

                if(obj!=undefined){
                    for (var i = 0; i < obj.length; i++) 
                    {   
                        obj[i].name = obj[i].name.replace(tmpPreve,""); // 去掉 得到当前

                        if (globalOp.isFile(obj[i].name)) {// 文件
                            file.push(obj[i]);
                        }
                        if (globalOp.isFolder(obj[i].name)) {// 文件夹
                            folder.push(obj[i].name);
                        }
                    }

                    // 当前显示文件
                    for (var i = 0; i < file.length; i++) 
                    {
                        if(file[i].name.indexOf("/")<0){
                            var type = file[i].name.slice(file[i].name.lastIndexOf(".")+1);
                            // console.log(type);

                            var fileObj = {
                                name:file[i].name,
                                type:EM_TYPE.NONE,       // 【还需要再细分判断 是图片还是文档】
                                url:file[i].url,        // 预览文件  地址
                                iconPath: iconPath[EM_TYPE.NONE], // 图片路径
                                size:file[i].size,
                                isSelect:false
                            }

                            // 类型赋值
                            if (type!=(-1)) 
                            {   //存在 .
                                if (type=="txt"||type=="doc"||type=="pdf") 
                                {
                                    fileObj.type = EM_TYPE.DOC;
                                    fileObj.iconPath = iconPath[EM_TYPE.DOC];
                                }

                                else if (type=="jpg"||type=="png"||type=="jpeg"||type=="gif") 
                                {
                                    fileObj.type = EM_TYPE.PIC;
                                    fileObj.iconPath = iconPath[EM_TYPE.PIC];
                                }
                                else{
                                    //未知类型 已默认
                                }
                            }
                            else{//点不存在 .
                                //未知类型 已默认
                            }
                            globalData.fileList.push(fileObj);
                        }
                    }

                    // 当前显示文件夹
                    for (var i = 0; i < folder.length; i++) 
                    {   
                        if(folder[i].match(Reg).length==1){
                            folder[i] = folder[i].replace(Reg,"");

                            var folderObj = {
                                name: folder[i],
                                type:EM_TYPE.FOLDER,
                                iconPath: iconPath[EM_TYPE.FOLDER],
                                size:folder[i].size,
                                isSelect:false
                            }
                            globalData.fileList.push(folderObj);
                            // console.log(folder[i])
                        }
                    }

                    console.log(globalData.fileList);
                }
                
            });
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
            var Buffer = OSS.Buffer;
            // 传入参数是 带新文件夹后路径
            globalData.ossObj.put(
            	globalData.userInfo.rootPath + globalData.currentPath+folderName+"/",
            	new Buffer(""))
            .then(function (result) //上传  刷新列表
            {   //成功
                globalOp.listFile(globalData.currentPath);//当前目录再刷新一次

            }).catch(function (err) {
                console.log(err);
            });
        },
        // 删除文件 传入参数为文件夹名字(带不带/结尾皆可) 或者 文件名
        deleteFile: function(name) {
        	if(name!=''){
        		var fileObjKey = globalData.userInfo.rootPath + globalData.currentPath + name;

	            var client = globalData.ossObj;
	            client.list().then(function (res) 
	            {
	                var  obj = res.objects;//所有文件
	                for (var i = 0; i < obj.length; i++) 
	                {
	                    if(obj[i].name.match(fileObjKey))
	                    {   //匹配
	                        client.delete(obj[i].name)//删除
	                        .then(function(res)
	                        {
	                            globalOp.listFile(globalData.currentPath);
	                        })
	                    }
	                }
	            });
        	}
        },
        // 删除多个文件 传入参数 名字数组 内容同上
        deleteMultiFile: function(nameArray) {
            // 路径补全
            var fileObjKeyArray = [];
            var arrayLen = nameArray.length;
            for (var i = 0; i < arrayLen; i++)
            {
                fileObjKeyArray[i] = globalData.currentPath + nameArray[i];
            }
            // 执行
            var newArr = [];
            var client = globalData.ossObj;
            client.list().then(function (res) 
            {
                var  obj = res.objects;//所有文件
                for (var i = 0; i < arrayLen; i++) //条件
                {
                    for (var j = 0; j < obj.length; j++) //所有
                    {
                        if(obj[j].name.match(fileObjKeyArray[i])){//匹配
                            newArr.push(obj[j].name);
                        }
                    }
                }

                client.deleteMulti(newArr)//删除
                .then(function(res)
                {
                    this.listFile();
                })
            });
        },
        // 上传文件 当前位置 【一个、多个 文件 文件夹  混合 进度 速度】
        //  【一个文件		fileName:文件名;
        //          	file:文件信息;
        uploadFile: function(fileName,file) {
        	var name = globalData.userInfo.rootPath + globalData.currentPath + fileName
            globalData.ossObj.multipartUpload(name,file)
            .then(function (result) //上传  刷新列表
            {//成功
                console.log(result);
                // console.log(result.res)
                
                var time = new Date().toLocaleString( );//当前时间
                var upMessage = {
                    name:fileName,
                    time:time
                }
                globalData.uploadList.push(upMessage);
                globalOp.listFile(globalData.currentPath);// this ?
            }).catch(function (err) {
                console.log(err)
            });
        }, 
        // 下载文件 传入参数: 下载对象的名字   保存的命名(谨记后缀)
        downloadFile: function(name,saveAs) {
            var fileObjKey = globalData.userInfo.rootPath+globalData.currentPath + name;
            var result = globalData.ossObj.signatureUrl(fileObjKey, {
                expires: 3600,//有效期
                response: {
                    'content-disposition': 'attachment; filename="' + saveAs + '"'
                }
            })

            var time = new Date().toLocaleString();//当前时间
            var downMessage = {
                name:fileObjKey,
                time:time
            };
            //globalData.downloadList.push(downMessage);
            

            // console.log(result);
            window.open(result);
           // window.location = result;// 下载
        },
        // 复制文件 (当点击复制时 实际是记录需要被复制的obj-key 执行粘贴才真正调用该函数)
        // 平板上操作是否需要改变 参考手机的复制方式?
        copyFile: function(fileName) {// current + fileName
            return fileName =  globalData.currentPath + fileName ;
        },
        // 粘贴文件 新位置路径
        pasteFile:function (newPath) {
            // +rootPath
            // currrnt
            globalData.ossObj.copy(newPath,oldPath)
            .then(function(res){
                globalOp.listFile();//curt
            });
        },
        // 【待完善】



        // 预览文件(文件内容 文件信息)
        previewFile: function(fileObjKey) {
            var obj = globalData.fileList;
            // 【可以直接操作 不需要再循环了】
            for (var i = 0; i < obj.length; i++) 
            {
                if(obj[i].name==fileObjKey){
                    return obj[i].url;
                }
            }
        },
        // 分享文件 参考百度网盘 URL+一个四位获取码
        shareFile: function(fileObjKey) {
            // 【待定】
            // 备注:
            // file objec-key  指  /xxx/xxx/xxx/t1.txt
            // file            指  t1.txt
            var obj = globalData.fileList;
            for (var i = 0; i < obj.length; i++) 
            {
                if(obj[i].name==file){
                    return obj[i].url + "+"+ Math.round(Math.random()*(8999)+1000);
                }
            }
        },
        // 搜索文件
        searchFile: function(fileName) {
            globalData.ossObj.list().then(function(res){//所有
                // console.log(res.objects);
                // 先清空 列表
                globalData.fileList = [];
                var obj = res.objects;//所有文件
                for (var i = 0; i < obj.length; i++) 
                {
                    if(obj[i].name.match(fileName)){//搜索  条件匹配
                        globalData.fileList.push(obj[i])// 文件列表 再赋值
                        console.log(globalData.fileList)
                    }
                }
            });
        },

        /* (上传下载)列表控制 */
        // 暂停;开始
        pauseFile: function(listType) { //是集中一个好 还是分开函数好?
            switch(listType)
            {
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
        // 清空已完成
        cleanFinish: function() {},

        /* 路径切换 */
        // 路径记录:可以添加也可以删除,是一个list,遵循先进后出概念
        recordPath: function(path) {// 完整路径 如果是根目录 即"/" 如果有文件夹 即 "/xxx/"
            globalData.pathRecord.push(path);
        },
        // 打开文件夹  已有
        openFolder: function(folderName) {//folderName不带任何/ 只是名字
            // 以下三步是文件操作必走
            //4次触发*
            globalData.currentPath = globalData.currentPath + folderName + "/";                  //路径组装

            globalOp.listFile(globalData.currentPath);     //进入 用户的目标目录

            if (globalData.backStep ==0) {
                globalData.pathRecord = globalData.pathRecord.slice(0)
            }else{
                globalData.pathRecord = globalData.pathRecord.reverse().slice(globalData.backStep).reverse();// 纪录操作
            }

            globalOp.recordPath(globalData.currentPath);   //并且记录下来

            globalData.backStep = 0;

        },
        // 后退
        backPath: function(current) {//切割   截取
            for (var i = globalData.pathRecord.length -1; i >= 0 ;i--) 
            {
                if(globalData.pathRecord[i]==current)
                {
                    if (i!=0) {
                        globalData.currentPath = globalData.pathRecord[i-1];              
                        globalData.backStep += 1;

                        globalOp.listFile(globalData.currentPath);    
                    }else{
                        globalData.currentPath = "/";                 
                        globalOp.listFile(globalData.currentPath);  
                        globalData.backStep = 0;  
                        console.log( globalData.backStep);
                        
                    }
                }
            }
        },
        // 前进路径
        goPath: function(current) {
            for (var i = globalData.pathRecord.length-1 ; i >= 0 ;i--) 
            {
                if(globalData.pathRecord[i]==current)
                {
                    if (i!=globalData.pathRecord.length-1) 
                    {
                        globalData.currentPath = globalData.pathRecord[i+1];
                        globalData.backStep = globalData.backStep-1;//?

                        globalOp.listFile(globalData.pathRecord[i+1]);
                    }
                    else{
                        globalData.currentPath = globalData.pathRecord[i];                 
                        globalOp.listFile(globalData.currentPath);  
                        globalData.backStep = 0;
                    }
                }
            }
        },   
        // 跳转到指定路径
        toDesignatedPath: function(path) {
            var lastChar = path[path.length-1];
            if(lastChar == '/'){
                globalData.currentPath = path;
            }
            else{
                globalData.currentPath = path+"/";
            }
            globalOp.listFile(globalData.currentPath);
            globalOp.recordPath(globalData.currentPath);
        },
        // 上一级路径
        toUpPath: function() {
        	var path = globalData.currentPath;
            path = path.substr(0,path.lastIndexOf("/",path.length-2));
            globalOp.toDesignatedPath(path);
        },
        //发送验证
        getAuthCode:function (telephone) 
	        {   
	            $.post("http://skt-studio.com/vue/aliyun-dysms-php-sdk/api_demo/SmsDemo.php",
	            {tel:telephone},function (data,status) 
	            {   
	                if (status=="success") 
	                {
	                    var dataArr = data.split(","); // tel code state
	                    if(dataArr[2]=='OK'){// state   
	                        console.log( dataArr[1]);//code
	                    }
	                    else{// 签名不合法 、 手机号不合法
	                        console.log("远程错误: "+dataArr[2]);
	                    }
	                }
	                else{
	                    console.log('请求失败')
	                }
	            });
	        },

        /* 正则封装 */
        // 检查是否存在 根据rule判断str返回bool类型
        isExisting: function(checkStr,checkRule){
        },
        // 根据rule提取str 返回数组
        extractArray: function(checkStr,checkRule){
        },
        isFile: function(str){ // 
            var ret = new RegExp(/^(.)+((?!\/).)$/);
            return ret.test(str);
        },
        isFolder: function(str){ // 列表文件夹
            var ret = new RegExp(/^(.)+\/$/);
            return ret.test(str);
        },

        /* 安全操作 */
        // 加密算法 对AccessKey进行可解加密 (未定)
        encryptAccessKey: function(accessKey) {},
        // 解密算法 对POST返回的AccessKey进行解密 (未定)
        decryptAccessKey: function(accessKey) {},
        // 注册检查(检查用户名是否已占用 密码是否正确等等 返回bool数组 提供ui打gou提示用)
        checkRegister: function() {},
        // 文件夹命名检查规则
        checkFolderName: function() {},
        // 错误码处理
        /*
            -1          指令错误
            100-199     账户sql请求返回
            200-299     本地操作的异常
            other       未知错误
        */
        errCodeTrans: function(code){
            var retStr = ":";
            switch(code)
            {
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
                retStr = code+retStr+"账户已被登陆 不能重复登陆";
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