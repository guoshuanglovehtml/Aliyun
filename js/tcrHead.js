var tcrHeadContent = Vue.extend({
	template:'#headbody',
	data:function(){
		return {
			userdatas:true,
			loading:true
		}
	}, 
	props:['personal'],
	methods:{
		loadings:function(e){
			console.log(document.cookie);
			if(this.loading){
				
			}else{
				
			}
		},
		logout:function(){
			globalOp.logout();
			var files=document.getElementById('userinfo_file');
			files.style.background='#34495E';
			$('#datas_content').css('display','none');
			loading.appear('正在退出.....');
			setTimeout(function(){
				verity_code();
				$('#datas_content').css('display','none');
			},350);
			setTimeout(function(){
				$('#myVerification').remove();
				$('#verCode').append('<canvas id="myVerification" width="90" height="36">您的浏览器不支持canvas，请换个浏览器试试</canvas>');
			},10);
		},
		userName:function(e){
			$('#userinfo_name>a').css('color','rgb(26, 177, 130)');
			if($(e.target).parent().parent().attr('id')!='Modular'){
				$('#Modular>div>a').css('color','#ffffff');
			}
			if(this.userdatas){
				console.log(globalData.userInfo);
				this.userdatas=false;
			}else{
				this.userdatas=true;
			}
		},
		fontcolor:function(e){
			if($(e.target).parent().parent().attr('id')=='Modular'){
				$(e.target).css('color','#1AB182').parent().siblings().children().css('color','#ffffff');
				//$('#datas_content').css('display','block');
				$('#userinfo>div>a').css('color','#fff');
				setTimeout(function(){
					$('#navigation>div>ul').css('display','none');
					if($(e.target).html()=='数据'){
						$('#datas_content').css('display','block');
					}else{
						$('#datas_content').css('display','none');
					}
				},10)
			}else{
				$('#Modular>div>a').css('color','#ffffff');
			}
		}
	}
});
Vue.component('tcrHead-content',tcrHeadContent);

