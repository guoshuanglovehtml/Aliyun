const Home = Vue.extend({  //文档信息
	template: '#homes',
	data: function() {
		return {
			luyou:false,
			indexs:null,
			item:[],
			tcr_add:1,
			whole_opts:0,
			change_phone:false,
			nowfilename:'',
			searching:false,
			fileIndex:null,
			fileName:'',
			fileType:'',
			fileState:'',
			searchPather:[],
			fileDisplay:'平铺',
		}
	},
	props:['personals','arrayss','filestyle','updownlist'],
	computed:{

	},
	methods:{
		test:function(){   //修改密码
			console.log('修改密码');
			globalOp.changePassword(this.loginPassword,this.code);
		},
		manyShow:function(){
			if($('#operation_manys').attr('class')=='hide'){
				$('#operation_manys').removeClass('hide');
			}else{
				$('#operation_manys').addClass('hide');
			}
			var gce=$('#operation_many').offset().left;
			setTimeout(function(){
				$('#operation_manys').css('left',(gce+'px'));
			},1);
			setTimeout(function(){
				$('#operation_manys').css('left',(gce+'px'));
			},5);
		},
		newfile:function(){		//新建文档
			$('#new_box').css('display','block');
			$(document).offset
		},
		openFile:function(index){		//打开文件夹
			if($('#operation_select').html()=='多文件选择'){
				if(globalData.searching){
					var SearchPathing = globalOp.searchPath.split('/');
					SearchPathing.shift();
					SearchPathing.shift();
					SearchPathing=SearchPathing.join('/');
					globalOp.toDesignatedPath('/'+SearchPathing);
					globalData.searching=false;
					console.log(SearchPathing);
					console.log($('#addressClick:last-child').position().left);
					console.log($('#addressClick:last-child').offset().left);
				}else{
					if(this.indexs.type==0){
						if(globalData.fileNames[0].name!=''){
							globalOp.openFolder(globalData.fileNames[0].name);
							$('.cdk').removeClass('isblue');
						}
					}
				}
				$('#function_search').val('');
			}else{
				console.log($('.isf8>span')[index]);
			}
		},
		adddres_focus:function(){//地址获得光标
			$('#addressClick').css('display','none');
			$('#function_address').css('color','white');
		},
		adddres_blur:function(){//地址失去光标
			$('#addressClick').css('display','block');
			$('#function_address').css('color','transparent');
		},
		upfileFrame:function(){
			$('#uploadFile').hide();
		},
		upload:function(){//上传文件
			var manyfile=[];
			console.log(222);
			document.getElementById('upFile').addEventListener("change",function (e){
				console.log(e.target.files[0]);
				if(typeof(e.target.files[0])=="undefined"){
					globalOp.uploadFile([]);
					$('#upFile').val('');
				}else{
					for(var i=0;i<e.target.files.length;i++){
						manyfile[i] = e.target.files[i];
					}
					globalOp.uploadFile(manyfile);
					$('#upFile').val('');
				}
			});
			globalData.fileNames=[];
		},
		uploadmany:function(){//上传文件夹
			var manyfile=[];
			document.getElementById('uploadmany').addEventListener("change",function (e){
				console.log(e.target.files);
				if(typeof(e.target.files[0])=="undefined"){
					globalOp.uploadFolder();
					$('#uploadmany').val('');
				}else{
					for(var i=0;i<e.target.files.length;i++){
						manyfile[i] = e.target.files[i];
					}
					globalOp.uploadFolder(manyfile);
					$('#uploadmany').val('');
				}
			});
		},
		uploadOpen:function(){
			$('#uploadFile').css('display','block');
		},
		uploadClose:function(){
			$('#uploadFile').css('display','none');
		},
		whole_opt:function(){     //全选
			if($('#operation_select').html()=='多文件选择'){
				$('#operation_select').html('取消选择');
				$('.inputs').show();
				$('.cdk').removeClass('isblue');
				$('.cdk').removeClass('isf8');
				globalData.fileNames=[];
			}else{
				$('#operation_select').html('多文件选择');
				$('.inputs').hide();
				$('.inputs').attr('src','img/ic_check_false.png');
				$('.isf8').removeClass('isf8');
				globalData.fileNames=[];
			}
		},
		upfile:function(){   //向上
			if($('#function_address').val()!=(globalData.userInfo.username+'/')){
				$('#operation_select').html('多文件选择');
				globalOp.toUpPath();
				globalData.searching=false;
				$('.cdk').removeClass('isblue');
			}
		},
		gofile:function(){//前进
			globalOp.goPath();
			globalData.searching=false;
			$('#operation_select').html('多文件选择');
			$('.cdk').removeClass('isblue');
			$('#function_search').val('');
		},
		backfile:function(){//后退
			globalOp.backPath();
			$('.cdk').removeClass('isblue');
			$('#operation_select').html('多文件选择');
			globalData.searching=false;
			$('#function_search').val('');
		},
		addressll:function(){//地址
			var addresss=(globalData.userInfo.username+globalData.currentPath);//上一次
			var addresssNum=addresss.split('/');
			addresssNum.pop();
			var locations='';
			for(var i=0;i<addresssNum.length;i++){
				this.item[i]=addresssNum[i];
				locations+='<span tcr-add='+(i+1)+' class="tcr_add'+(i+1)+'">'+this.item[i]+'</span><img class="tcr_img'+(i+1)+'" src="img/rights.png"/> ';
			}
			$('#addressClick').html(locations);
			if(this.tcr_add==1){
				setTimeout(function(){
					address_tcr();
					this.tcr_add=1;
				},20);
				this.tcr_add=2;
			}
			return addresss
		},
		tcr_adds:function(){
			console.log(111);
		}(),
		getFile:function(){ //确认下载
			if(globalData.fileNames!=''&&this.fileType!=0){
				loading.appearNull('正在获取下载文件');
				globalOp.downloadFile(globalData.fileNames);
				globalData.fileNames=[];
				$('.cdk').removeClass('isf8');
				$('.cdk>.inputs').attr('src','img/ic_check_false.png');
			}
		},
		newCancel:function(){ //新建框取消  
			$('#new_box').css('display','none');
		},
		newOK:function(){ //确认新建
			var texts=$('#new_text').val();
			console.log(texts);
			if(texts!=''){
				globalOp.newFolder(texts);
				$('#new_text').val('');
			}
			$('#new_box').css('display','none');
		},
		choose:function(index,data,event){  //选择文件
			globalOp.searchPath=data.path+'/'+data.name;
			this.fileType=data.type;
			if(globalData.searching){
				if($('#operation_select').html()=='多文件选择'){
					if(event.path.length==11){
						$(event.target).addClass('isblue').siblings().removeClass('isblue');
					}else{
						$(event.target).parent().addClass('isblue').siblings().removeClass('isblue');
					}
					globalData.fileNames[0]=data;
				}else{
					if(typeof(globalData.fileNames[index])=="undefined"){
						globalData.fileNames[index]=data;
					}else{
						globalData.fileNames[index]=undefined;
					}
				}
			}else{
				if($('#operation_select').html()=='多文件选择'){
					this.indexs=this._props.arrayss[index];
					globalData.fileNames[0]=data;
					if(event.path.length==11){
						$(event.target).addClass('isblue').siblings().removeClass('isblue');
					}else{
						$(event.target).parent().addClass('isblue').siblings().removeClass('isblue');
					}
				}else{
					if(typeof(globalData.fileNames[index])=="undefined"){
						globalData.fileNames[index]=data;
					}else{
						globalData.fileNames[index]=undefined;
					}
					globalData.fileOperation=0;
					for(var i=0;i<globalData.fileNames.length;i++){
						console.log(globalData.fileNames[i]);
						if(globalData.fileNames[i]!=undefined){
							globalData.fileOperation++;
							console.log(globalData.fileOperation);
						}
					}
				}
			}
			console.log(globalData.fileNames);
		},
		deletes:function(){  //删除文件
			if(globalData.fileNames.length!=0){
				loading.appearNull('正在删除.....');
				$('#operation_manys').removeClass('hide');
				globalOp.deleteMultiFile(globalData.fileNames);
				console.log(globalData.fileNames);
				globalData.fileNames=[];
				
			}
		},
		jumpAddress:function(){
			var vals=document.getElementById('function_address').value;
			vals=vals.slice(globalData.userInfo.username.length);
			globalData.searching=false;
			$('#function_search').val('');
			$('.cdk').removeClass('isblue');
			globalOp.toDesignatedPath(vals);
		},
		shearFile:function(){  //剪切文件
			globalOp.copyFile(globalData.fileNames);
			this.fileState='shear';
		},
		copyFile:function(){  //复制文件,可多选，fileArrays数组添加
			globalOp.copyFile(globalData.fileNames);
			globalData.fileNames=[];
			this.fileState='copy';
		},
		pastesFile:function(){   //粘贴文件
			console.log(this.fileState)
			if(this.fileState=='copy'){
				loading.appearNull('正在粘贴.....');
				globalOp.pasteFile();
			}else{
				loading.appearNull('正在剪切.....');
				globalOp.shearObj();
				console.log(123);
			}
			$('#operation_manys').addClass('hide');
		},
		renovate:function(){  //刷新
			globalOp.listFile(globalData.currentPath);
			globalData.searching=false;
			$('#function_search').val('');
			if($('#operation_select').html()=='取消选择'){
				$('.inputs').css('display','block');
			}
		},
		homes:function(){    //回到根目录
			globalOp.toDesignatedPath('/');
		},
		searchs:function(){      //搜索
			if($('#function_search').val()==''){
				globalOp.listFile(globalData.currentPath);
				globalData.searching=false;
			}else{
				globalOp.searchFile($('#function_search').val());
				globalData.searching=true;
			}
			$('a')
		},
    	functionFile:function(){
    		console.log($('#addressClickLimit').css('width'));
    		console.log($('#addressClickLimit')[0].offsetWidth);
    		console.log($('#addressClickLimit')[0].clientWidth);
    		console.log($('#addressClickLimit')[0]);
    		switch(this.fileDisplay){
    			case "平铺":
    				console.log('列表');
    				$('#detailedInfo').hide();
    				if($('#bottom_state').css('top')=='0px'){
    					$('#filefilefile').css('height','99%');
    				}else{
    					$('#filefilefile').css('height','61%');
    				}
    				globalData.fileCss='cdk cdk_list';
    				//console.log(globalData.upDownList);
    				this.fileDisplay="列表";
    			break;
    			case "列表":
    				console.log("详细信息");
    				$('#detailedInfo').show();
    				if($('#bottom_state').css('top')=='0px'){
    					$('#filefilefile').css('height','94%');
    				}else{
    					$('#filefilefile').css('height','54%');
    				}
    				globalData.fileCss='cdk cdk_information';
    				this.fileDisplay="详细信息";
    			break;
    			case "详细信息":
    				console.log('平铺');
    				$('#detailedInfo').hide();
    				if($('#bottom_state').css('top')=='0px'){
    					$('#filefilefile').css('height','99%');
    				}else{
    					$('#filefilefile').css('height','61%');
    				}
    				globalData.fileCss='cdk cdk_pave';
    				this.fileDisplay="平铺";
    			break;
    		}
//  		$('#operation_select').html('多文件选择');
//			$('.inputs').hide();
//			$('.inputs').attr('src','img/ic_check_false.png');
//			$('.isf8').removeClass('isf8');
//			globalData.fileNames=[];
    	},
    	renameToggle:function(){		//重命名
    		$('#operation_manys').addClass('hide');
    		$('#rename_box').show();
    	},
    	renameOK:function(){
			if($('#operation_select').html()=='多文件选择'){
				globalData.fileNames[0].val=$('#rename_text').val();
				globalOp.refileName(globalData.fileNames);
				if(this.fileType){		//文件
					globalOp.refileName(globalData.fileNames);
				}else{
					globalOp.refolderName(globalData.fileNames);
	    		}
	    		$('#rename_box').hide();
	    		$('#rename_text').val('');
	    		loading.appearNull('正在更改.....');
			}
    		console.log(this.fileName);
    	},
    	renameCancel:function(){
    		$('#rename_box').hide();
    	},
    	stateImg:function(){
    		$('#stateImg').attr('src');
    		if($('#stateImg').attr('src')=='img/listUp.png'){
    			$('#stateImg').attr('src','img/listDown.png');
    			$('#bottom_state').animate({top:'-250px'},250);
    			if(this.fileDisplay=='详细信息'){
    				$('#filefilefile').animate({height:'54%'},250);
    			}else{
    				$('#filefilefile').animate({height:'61%'},250);
    			}
    		}else{
    			$('#stateImg').attr('src','img/listUp.png');
    			$('#bottom_state').animate({top:'0px'},250);
    			if(this.fileDisplay=='详细信息'){
    				$('#filefilefile').animate({height:'94%'},250);
    			}else{
    				$('#filefilefile').animate({height:'99%'},250);
    			}
    		}
    	},
    	fileDate:function(obj){
    		if(typeof(obj)!="undefined"){
    			return obj
    		}
    	},
    	fileTypes:function(obj){
    		var objType;
    		switch(obj){
    			case 0:
    				objType='文件夹';
    			break;
    			case 1:
    				objType='文本文档';
    			break;
    			case 2:
    				objType='图片';
    			break;
    			case 3:
    				objType='未知文件';
    			break;
    			case 4:
    				objType='压缩文件';
    			break;
    			case 5:
    				objType='程序文件';
    			break;
    		}
    		return objType
    	},
    	fileSize:function(obj){
    		var num=parseFloat(obj);
    		var numObj=0;
			if(typeof(obj)!='undefined'){
				while(num>1024){
	    			num=(num/1024).toFixed(2);
	    			numObj++;
	    		}
	    		switch(numObj){
	    			case 0:
	    				return (num+'b')
	    			break;
	    			case 1:
	    				return (num+'kb')
	    			break;
	    			case 2:
	    				return (num+'mb')
	    			break;
	    			case 3:
	    				return (num+'gb')
	    			break;
	    		}
			}
    	},
    	updowndeletes:function(e){
	    	$(e.target).parent().remove();
	    },
	    uploadSpeed:function(obj){
	    	console.log(obj);
	    	if(obj=='0kb/s'){
	    		return '--'
	    	}else{
	    		return obj
	    	}
	    },
	    detailedInfoName:function(){
	    	loading.bubbleName(globalData.fileList);
	    },
	    detailedInfoType:function(){
	    	console.log(globalData.fileList);
	    	loading.bubbleSort(globalData.fileList);
	    },
	    detailedInfoDate:function(){
	    	loading.bubbleDate(globalData.fileList);
	    },
	    detailedInfoSize:function(){
	    	loading.bubbleSize(globalData.fileList);
	    },
    },
    created:function(){
    	var a=0;
    	console.log(10-8>3);
    	$('#addressClickLimit').clientWidth;
    	for(;;){
    		a++;
    		console.log(a);
    		if(a>5){
    			break;
    			return console.log(3333);
    		}
    	}
    },
});
const About = Vue.extend({//个人信息
    template: '#abouts',
    data: function() {
        return {
            phoneTime:60
        }
    },
    props:['personals','arrayss','username'],
    methods:{
    	modifys:function(){
    		var userInfo=[];
    		userInfo[0] = $('#userJob').val();
    		userInfo[1] = $('#userEmail').val();
    		globalOp.userInfoChange(userInfo);
    	},
    	passwordModifys:function(){
    		if($('#newChangePassword').val()==$('#newChangePasswords').val()){
    			globalOp.changePassword($('#oldChangePasswords').val(),$('#newChangePassword').val());
    		}else{
    			loading.promptNotice('新密码不一致');
    		}
    	},
    	userInfo:function(){
    		$('#userInfo').css('background','#000').siblings().css('background','#24272b');
    		$('#userChangePassword').hide();
    		$('#userInformation').show();
    		$('#userChangePhone').hide();
    	},
    	userPassword:function(){
    		$('#userPassword').css('background','#000').siblings().css('background','#24272b');
    		$('#userChangePassword').show();
    		$('#userInformation').hide();
    		$('#userChangePhone').hide();
    		$('#oldPhone').show();
    		$('#newPhone').hide();
    	},
    	userPhone:function(){
    		$('#userPhone').css('background','#000').siblings().css('background','#24272b');
    		$('#userChangePhone').show();
    		$('#userInformation').hide();
    		$('#userChangePassword').hide();
    		$('#oldPhone').show();
    		$('#newPhone').hide();
    	},
    	phoneModifys:function(){
//  		if($('#oldvalidatePhone').val()==Verification_Code){
    			$('#oldChangePhone').val('');
    			Verification_Code='';
    			console.log('验证成功，下一步');
    			$('#oldPhone').hide();
    			$('#newPhone').show();
    			$('#newPhone').html('<div>'+
					'<span>新电话：</span>'+
					'<input style="" type="text" id="newChangePhone" value="" />'+
					'<input type="button" id="newChangePhoneNext" onclick="loading.newChangePhoneNext()" value="获取验证" style="padding: inherit; width: 95px; margin-left: 5px;"/>'+
				'</div>'+
				'<div style="margin-left: -91px;">'+
					'<span>验证码：</span>'+
					'<input style="" type="text" id="newvalidatePhone" value="" />'+
				'</div>'+
				'<input type="button" id="phoneModifysOK" value="确认修改" />');
//  		}
    	},
    	phoneModifysOK:function(){
    		if($('#newvalidatePhone').val()==Verification_Code){
    			globalOp.userPhoneChange(globalData.newPhoneNum);
    		}
    	},
    	oldChangePhoneNext:function(){
    		if(typeof(globalData.validateNum[0])=='undefined'){
    			globalData.validateNum[0]=60;
      			globalOp.findPassword(globalData.userInfo.username);
    			var phoneTimes=setInterval(function(){
    				globalData.validateNum[0]--;
    				$('#oldChangePhoneNext').val(globalData.validateNum[0]);
    				if(globalData.validateNum[0]==0){
    					clearInterval(phoneTimes);
    					globalData.validateNum[0]=undefined;
    					$('#oldChangePhoneNext').val('获取验证');
    				}
    			},1000)
    		}
    	},
    }
});
const Data = Vue.extend({   //数据界面（待定）
    template: '#datas',
    props:['personals','arrayss','username'],
    methods:{
    	Order:function(){
    		
    	},
    	production_control:function(){
    		
    	},
    	plan_analysis:function(){
			
    	},
    	equipment:function(){
    		
    	},
    	human_resource:function(){
    		
    	},
    	materiel:function(){
    		
    	},
    	mould:function(){
    		
    	},
    	quality:function(){
    		
    	},
    	archives:function(){
    		
    	},
    	systems:function(){
    		
    	},
    	divNav:function(e){
    		console.log($(e.target));
    		console.log($(e.target).context);
    		if($(e.target).context.localName=='span'){
    			$(e.target).css('background','#FC740F');
	    		$(e.target).siblings().css('display','block');
	    		$(e.target).parent().siblings().children('ul').css('display','none');
	    		$(e.target).parent().siblings().children('span').css('background','#393c3f');
    		}
    	}
    }
});
//const Share = Vue.extend({//个人信息
//  template: '#share',
//  props:['personals','arrayss','username'],
//  methods:{
//  	modifys:function(){
//  		console.log(arrayss);
//  		console.log(username);
//  	}
//  }
//});
// 2. 创建 router 实例，然后传 `routes`路由映射 配置
const router = new VueRouter({
	routes: [
	    { path: '/home', component: Home },
	    { path: '/about', component: About },
	    { path: '/datas', component: Data },
	    { path: '/', component: Home } //设置默认路径
	  //  { path: '/share', component: Share }
	] 
});

