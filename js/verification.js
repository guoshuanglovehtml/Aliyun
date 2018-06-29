function verity_code(){
	function gand(){
		var str="abcdefghijklmnopqrstuvwxyz0123456789";
		var arr=str.split("");
		var validate="";
		var ranNum;
		for(var i=0;i<4;i++){
			ranNum=Math.floor(Math.random()*36);   //随机数在[0,35]之间
			validate+=arr[ranNum];
		}
		globalData.verify=validate;
		console.log(validate);
		return validate;
	}

	/*干扰线的随机x坐标值*/
	function interfereX(){
		var tcrX=Math.floor(Math.random()*90);
		return tcrX;
	}

	/*干扰线的随机y坐标值*/
	function interfereY(){
		var tcrY=Math.floor(Math.random()*40);
		return tcrY;
	}

	function clickChange(){
		var canvas=document.getElementById('myVerification');
		var cxt=canvas.getContext('2d');
		cxt.fillStyle='#000';
		cxt.fillRect(0,0,90,40);
        
		/*生成干扰线20条*/
		for(var j=0;j<20;j++){
			cxt.strokeStyle='#fff';
			cxt.beginPath();    //若省略beginPath，则每点击一次验证码会累积干扰线的条数
			cxt.moveTo(interfereX(),interfereY());
			cxt.lineTo(interfereX(),interfereY());
			cxt.lineWidth=0.5;
			cxt.closePath();
			cxt.stroke();
		}
		cxt.fillStyle='#1ABC9C';
		cxt.font='bold 24px Arial';
		cxt.fillText(gand(),15,25);   //函数生成文本填充到canvas中
	}
	clickChange();
	/*点击验证码更换*/
//  myVerification.onclick=function(e){
//      e.preventDefault();   //阻止鼠标点击发生默认的行为
//      clickChange();
//  };
}
verity_code();
$(document).on('click','#myVerification',function(e){
	e.preventDefault();
	$('#myVerification').remove();
	$('#verCode').append('<canvas id="myVerification" width="90" height="36">您的浏览器不支持canvas，请换个浏览器试试</canvas>');
	setTimeout(function(){
		verity_code();
	},20);
});