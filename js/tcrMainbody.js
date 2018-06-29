var tcrMainbodyContent = Vue.extend({
	template:'#mainbody',
	data:function(){
		return {
			loginName:'zyj',
			loginPassword:'zyj123',
			loginType:'oss',
			code:'',
			loginShow:true,
			manyshow:false,
			isChoose:{
				'isblue':false
			},
			field:'type',
			reverse:false,
			timeout:60
		}
	},
	props:['personal','arrays','users','filestyle','updownlist'],
	methods:{
		login:function(){
			if($('#verifyInput').val()==globalData.verify){
				loading.appear('正在登录.....');
				$('#verifyInput').val('');
				this.code='';
				console.log($('#login_key')[0].checked);
				globalOp.login(this.loginType,this.loginName,this.loginPassword);
			}else{
				loading.promptNotice('验证码错误');
			}
		},
		test:function(){
			globalOp.changePassword(this.loginPassword,this.code);
		},
		forget:function(){//忘记密码
			$('#login_middle').css('display','none');
			$('#login_bottom').css('display','none');
			$('#endValidata').css('display','block');
			$('#forgot_password').css('display','block');
			$('#userVerification').show();
			$('#login_top').html('忘记密码验证');
			$('#newRegisterID').next('span').html('');
		},
		manyShow:function(){
			this.manyshow=!this.manyshow;
		},
		goValidate:function(){  //发送验证码
			if(typeof(globalData.validateNum[1])=='undefined'){
    			console.log('开始');
    			globalData.validateNum[1]=60;
    			globalOp.getTelCode($('#validate_name').val());
    			var phoneTimes=setInterval(function(){
    				globalData.validateNum[1]--;
    				console.log(globalData.validateNum[1]);
    				$('#goValidate').val(globalData.validateNum[1]);
    				if(globalData.validateNum[1]==0){
    					clearInterval(phoneTimes);
    					globalData.validateNum[1]=undefined;
    					$('#goValidate').val('获取验证');
    				}
    			},1000)
    		}
		},
		okValidate:function(){//认证验证码
			console.log(Verification_Code);
			if($('#validate_num').val()==Verification_Code){
				Verification_Code=null;
				$('#forgotPassword').html('');
				$('#userVerification').hide();
				$('.forgotActive').removeClass('forgotActive').siblings().addClass('forgotActive');
				$('#forgotPassword').append('<span>新密码：</span><input type="text" id="forgot_code" value="" /><br>'+
				'<span>确认新密码：</span><input type="text" id="forgot_code2" value="" /><br>'+
				'<input type="button" id="forgot_codeOK" value="确认修改" />');
			};
		},
		endValidata:function(){//返回登录界面
			if($('#login_top').html()=='忘记密码验证'){
				$('#catalog_forgot>li:last-child').removeClass('forgotActive').siblings().addClass('forgotActive');
				$('#forgot_password').css('display','none');
				$('#forgotPassword').html('');
			}else{
				$('#loginRegister_num1').css('display','block');
				$('#loginRegister_num2').css('display','none');
				$('#loginRegister').css('display','none');
			}
			$('#login_middle').css('display','block');
			$('#login_bottom').css('display','block');
			$('#endValidata').css('display','none');
			$('#login_top').html('用户登录');
			$('#newRegisterUser').val('');
			$('#newRegisterPasswords').val('');
			$('#newRegisterPassword').val('');
			$('#newRegisterName').val('');
			$('#newRegisterPhone').val('');
			$('#phoneConfirmText').val('');
		},
		upfile:function(){
			globalOp.toUpPath();
		},
		deletes:function(){
			globalOp.deleteFile(globalData.fileTransmission.name);
		},
		registerFrame:function(){//用户注册界面
			$('#login_top').html('用户注册');
			$('#login_middle').css('display','none');
			$('#login_bottom').css('display','none');
			$('#endValidata').css('display','block');
			$('#loginRegister').css('display','block');
		},
		registerName:function(){   //确认注册
			var userInfo=[];
			if(globalData.userRegistration.userName){
				if(globalData.userRegistration.userPassword){
					if($('#phoneConfirmText').val()==Verification_Code){
						if($('#newRegisterName').val()!=''){
							userInfo[0]=$('#newRegisterUser').val();
							userInfo[1]=$('#newRegisterPasswords').val();
							userInfo[2]=$('#newRegisterName').val();
							userInfo[3]=$('#newRegisterPhone').val();
							userInfo[4]=$("input[name='registerSex']:checked").val();
							userInfo[5]=globalData.userRegistration.userCompany;
							globalOp.register(userInfo);
							$('#newRegisterUser').val('');
							$('#newRegisterPasswords').val('');
							$('#newRegisterPassword').val('');
							$('#newRegisterName').val('');
							$('#newRegisterPhone').val('');
						}
					}
				}
			}
		},
		loginRegisterNext:function(){   //邀请ID确认下一步
			console.log($('#newRegisterID').val());
			globalOp.invitationRegister($('#newRegisterID').val());
			loading.appearNull('正在加载....');
			$('#newRegisterUser').css('border','rgba(57,60,63,0.5)');
			$('#newRegisterPassword').css('border','rgba(57,60,63,0.5)');
			$('#newRegisterPasswords').css('border','rgba(57,60,63,0.5)');
		},
		phoneConfirm:function(){  //验证手机号
			var tel=$('#newRegisterPhone').val();
			var timeouts=this.timeout;
			if(tel.length == 11){
				$('#phoneConfirm').attr('disabled','disabled');
				$('#phoneConfirmText').removeAttr('disabled');
				globalOp.getTelCode(tel);
				var timeIn=setInterval(function(){
					timeouts--;
					$('#phoneConfirm').val(timeouts);
					if(timeouts==0){
						clearInterval(timeIn);
						$('#phoneConfirm').removeAttr('disabled');
						$('#phoneConfirm').val('发送验证');
					}
				},1000);
				// globalOp.getTelCode(tel);
			}else{
				console.log("手机号码长度错误");
			}
		},
		phoneConfirmOK:function(){    //确认注册手机认证
			console.log($('#newRegisterCompany').val());
			if($('#phoneConfirmText').val()==Verification_Code){
				globalData.userRegistration.userPhone=true;
			}
			$('#phoneConfirmText').val();
		},
		cursorUser:function(){//用户名
			var names=$('#newRegisterUser').val();
			if(names!=''){
				if(13>names.length&&names.length>4){
					$('#newRegisterUser').css('border','rgba(57,60,63,0.5)');
					globalOp.invitationName(names);
					globalData.userRegistration.userName=true;
				}else{
					$('#newRegisterUser').css('border','2px solid red');
				}
				$('#newRegisterUser').next('span').html('');
			}else{
				$('#newRegisterUser').next('span').html('用户名为空');
			}
		},
		cursorpassword:function(){
			if($('#newRegisterPassword').val()==''){
				$('#newRegisterPassword').next('span').html('密码不能为空');
				$('#newRegisterPassword').css('border','2px solid red');
			}else{
				$('#newRegisterPassword').next('span').html('');
				$('#newRegisterPassword').css('border','2px solid rgba(57,60,63,0.5)');
				if($('#newRegisterPassword').val()!=$('#newRegisterPasswords').val()){
					$('#newRegisterPasswords').next('span').html('两个密码不匹配');
					$('#newRegisterPasswords').css('border','2px solid red');
				}else{
					$('#newRegisterPasswords').next('span').html('');
					$('#newRegisterPasswords').css('border','2px solid rgba(57,60,63,0.5)');
				}
			}
		},
		cursorpasswords:function(){//密码
			if($('#newRegisterPasswords').val()!=''){
				if($('#newRegisterPassword').val()==$('#newRegisterPasswords').val()){
					globalData.userRegistration.userPassword=true;
					$('#newRegisterPasswords').css('border','2px solid rgba(57,60,63,0.5)');
					$('#newRegisterPasswords').next('span').html('');
				}else{
					$('#newRegisterPasswords').css('border','2px solid red');
					$('#newRegisterPasswords').next('span').html('两个密码不匹配');
				}
			}else{
				$('#newRegisterPasswords').next('span').html('密码不能为空');
				$('#newRegisterPasswords').css('border','2px solid red');
			}
		}
	}
})
Vue.component('tcrMainbody-content',tcrMainbodyContent);



