Vue.component('tcr-mainbody',{
	template:'<div id="tcrMainbody"><tcrMainbody-content :updownlist="updownlist" :filestyle="filestyle" :users="user" :arrays="array" :personal="message"></tcrMainbody-content></div>',
	props:['message','array','user','filestyle','updownlist']
});

Vue.component('tcr-head',{
	template:'<div id="tcrHead"><tcrHead-content v-bind:personal="message"></tcrHead-content></div>',
	props:['message']
});
var browser=navigator.appName
if(browser=='Microsoft Internet Explorer'){
	alert('您使用的为IE浏览器，可能部分功能无法使用，请更换Edge，谷歌等浏览器');
}
//var tcrHeadChild1 = Vue.extend({
//	template:'<div class="tcrHead_child1"></div>'
//})
function BrowserType(){  
	var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串  
	var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器  
	var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器  
	var isEdge = userAgent.indexOf("Windows NT 6.1; Trident/7.0;") > -1 && !isIE; //判断是否IE的Edge浏览器  
	var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器  
	var isSafari = userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") == -1; //判断是否Safari浏览器  
	var isChrome = userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Safari") > -1; //判断Chrome浏览器  
	if (isIE){  
		var reIE = new RegExp("MSIE (\\d+\\.\\d+);");  
		reIE.test(userAgent);  
		var fIEVersion = parseFloat(RegExp["$1"]);  
		if(fIEVersion == 7)  
		{ return "IE7";}  
		else if(fIEVersion == 8)  
		{ return "IE8";}  
		else if(fIEVersion == 9)  
		{ return "IE9";}  
		else if(fIEVersion == 10)  
		{ return "IE10";}  
		else if(fIEVersion == 11)  
		{ return "IE11";}  
		else  
		{ return "0"}//IE版本过低  
	}//isIE end  
         
	if (isFF) {  return "FF";}  
	if (isOpera) {  return "Opera";}  
	if (isSafari) {  return "Safari";}  
	if (isChrome) { return "Chrome";}  
	if (isEdge) { return "Edge";}  
}
console.log(BrowserType());
function address_tcr(){
	$('#addressClick').on('click','span',function(){
		var cbob=$(this).attr('tcr-add');
		var addresss=(globalData.userInfo.username+globalData.currentPath);//上一次
		var dizhi='';
		var addresssNum=addresss.split('/');
		addresssNum.pop();
		console.log(addresssNum);
		console.log(dizhi);
		for(var i=0;i<cbob;i++){
			dizhi+=addresssNum[i]+'/';
		}
		dizhi=dizhi.slice(globalData.userInfo.username.length);
		console.log(globalData.userInfo.username.length);
		console.log(dizhi);
		globalOp.toDesignatedPath(dizhi);
	});
}
address_tcr();
$(document).on('click','#forgot_codeOK',function(){
	if($('#forgot_code').val()==$('#forgot_code2').val()){
		globalOp.changeforgetPassword($('#forgot_code').val());
	}
});
$('#logo').on('click','img',function(){
	console.log(document.cookie);
});
var hides=true,upfiles=true;

window.onload = function(){
	$('#datas_content').css('display','none');
	$("#preloading").fadeOut(1000);//界面关闭
	$(document).on('click','#operation_manys',function(){
		hides=false;
		setTimeout(function(){
			hides=true;
		},100);
	});
	$(document).on('click','#operation_many',function(){
		hides=false;
		setTimeout(function(){
			hides=true;
		},100);
	});
	$(document).click(function(){
		if(hides){
			$('#operation_manys').addClass('hide');
		}
	});
	$('#promptNotice').on('click',function(){
		$('#prompt_notice').hide();
		$('#tcrMainbody').removeClass('vague');
		$('#tcrHead').removeClass('vague');
	});
	$('#userinfo_child').on('click',function(){
		console.log('adddres_blur');
    	loading.promptNotice('已经模糊');
	});
	$(document).on('click','#phoneModifysOK',function(){
		if($('#newvalidatePhone').val()==Verification_Code){
			globalOp.userPhoneChange(globalData.newPhoneNum);
		}
	});
	$(document).on('click','.cdk',function(){
		if($('#operation_select').html()!='多文件选择'){
			if($(this).hasClass('isf8')){
				$(this).removeClass('isf8');
				$(this).children('.inputs').attr('src','img/ic_check_false.png');
			}else{
				$(this).addClass('isf8');
				$(this).children('.inputs').attr('src','img/ic_check_true.png');
			}
		}
	});
	$('#mainbody_content').on('click','li',function(){
		if($(this).parent().attr('class')=='stateContentL'){
			$(this).addClass('currentFont').siblings().removeClass('currentFont');
		}
		switch($(this).children().eq(0).html()){
			case "上传队列":
				$('#upListQueue').show().siblings().hide();
			break;
			case "下载队列":
				$('#downListQueue').show().siblings().hide();
			break;
			case "错误日志":
				$('#crossQueue').show().siblings().hide();
			break;
		}
	});
	$('.cdk').bind("selectstart", function () { return false; });//屏幕文字变蓝禁止
	$('#headbody_content').on('click','#userinfo_set',function(){
		console.log(this.arrayss);
	});
} 
		document.cookie="username=John Doe";
    	var d=document.cookie;
    	console.log(d);
    	console.log(document.cookie);
var loading = {
	sort:{
		date:false,
		name:false,
		size:false,
	},
	appear:function(texts){
		$("#preloading").fadeIn(500);
    	$("#preloading p").html(texts);
	},
	disappear:function(){
		$("#preloading").fadeOut(800);
	},
	appearNull:function(texts){
		$("#preloadingNull").fadeIn(500);
    	$("#preloadingNull p").html(texts);
    	setTimeout(function(){
    		console.log($('#preloadingNull').css('display')=='block');
    		if($('#preloadingNull').css('display')=='block'){
    			$("#preloadingNull").fadeOut(100);
    			loading.promptNotice('操作超时或更改有误');
    			globalOp.listFile(globalData.currentPath);
    		}
    	},8000);
	},
	disappearNull:function(){
		$("#preloadingNull").fadeOut(800);
	},
	disappearNulls:function(){
		if(!globalData.searchPath){
			$("#preloadingNull").fadeOut(800);
		}
	},
	promptNotice:function(test){		//界面模糊+警告
		$("#prompt_notice").fadeIn(500);
		$("#prompt_notice p").html(test);
		$('#tcrMainbody').addClass('vague');
		$('#tcrHead').addClass('vague');
	},
	newChangePhoneNext:function(){
		console.log('获取验证');
		if(typeof(globalData.validateNum[2])=='undefined'){
			globalData.newPhoneNum=$('#newChangePhone').val();
			globalData.validateNum[2]=60;
  			globalOp.getTelCode($('#newChangePhone').val());
			var phoneTimes=setInterval(function(){
				globalData.validateNum[2]--;
				$('#newChangePhoneNext').val(globalData.validateNum[2]);
				if(globalData.validateNum[2]==0){
					console.log('true');
					clearInterval(phoneTimes);
					globalData.validateNum[2]=undefined;
					$('#newChangePhoneNext').val('获取验证');
				}
			},1000)
		}
	},
	bubbleSort:function(array){
	    /*给每个未确定的位置做循环*/
		array.reverse();
	    for(var unfix=array.length-1; unfix>0; unfix--){
	      /*给进度做个记录，比到未确定位置*/
	    	for(var i=0; i<unfix;i++){
		        if(array[i].type>array[i+1].type){
		        	var temp = array[i];
		        	array.splice(i,1,array[i+1]);
		        	array.splice(i+1,1,temp);
		        }
	    	}
	    }
	},
	bubbleDate:function(array){
		var arrays=[];
		for(var i=0;i<array.length;i++){
			arrays[i]=array[i].date.split(' ').join('');
			arrays[i]=arrays[i].split('-').join('');
			arrays[i]=arrays[i].split(':').join('');
			array[i].val=arrays[i];
		}
	    for(var unfix=array.length-1; unfix>0; unfix--){
	    	for(var i=0; i<unfix;i++){
		        if(array[i].val>array[i+1].val){
		        	var temp = array[i];
		        	array.splice(i,1,array[i+1]);
		        	array.splice(i+1,1,temp);
		        }
	    	}
	    }
	    if(loading.sort.date){
	    	array.reverse();
	    	loading.sort.date=false;
	    }else{
	    	loading.sort.date=true;
	    }
	},
	bubbleName:function(array){
		for(var unfix=array.length-1; unfix>0; unfix--){
			for(var i=0; i<unfix;i++){
				if(array[i].name>array[i+1].name){
					var temp = array[i];
					array.splice(i,1,array[i+1]);
					array.splice(i+1,1,temp);
				}
			}
		}
		for(var i=0;i<array.length;i++){
			if(array[i].type==0){
				var arrNum=array[i];
				array.splice(i,1);
				array.unshift(arrNum);
			}
		}
		if(loading.sort.name){
			array.reverse();
			loading.sort.name=false;
		}else{
			loading.sort.name=true;
		}
	},
	bubbleSize:function(array){
		var arrays=[];	
		console.log(array.length-1);
		for(var unfix=array.length-1; unfix>0; unfix--){
			for(var i=0; i<unfix;i++){
				if(typeof(array[i].size)=='undefined'){
					array[i].contrast=-1;
				}else{
					array[i].contrast=array[i].size;
				}
			    if(array[i].contrast>array[i+1].contrast){
					var temp = array[i];
					array.splice(i,1,array[i+1]);
					array.splice(i+1,1,temp);
				}
			}
	    }
		if(loading.sort.size){
			array.reverse();
			loading.sort.size=false;
		}else{
			loading.sort.size=true;
		}
	},
}
