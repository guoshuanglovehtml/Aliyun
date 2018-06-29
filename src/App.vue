<template>
	<div id="app">
	    <!-- 这个是父组件 -->
	    <!-- <img src="./assets/logo.png"> -->
	    <!-- <router-view></router-view> -->
	    <tcr-Head></tcr-Head>
	    <tcr-Content></tcr-Content>
	</div>
</template>

<script>
	import tcrHead from './components/Toolbar'
	import tcrContent from './components/NoteList'
	export default {
		components:{
		    Toolbar,
		    NoteList,
		    Editor
		}
	//name: 'app' 
	}
	import Vue from 'vue'
	import App from './App'
	import router from './router'
	
	// 添加状态管理机 //cnpm install vuex --save
	import store from '../vuex/store'
	
	Vue.config.productionTip = false
	
	/* eslint-disable no-new */
	// store注意 
	new Vue({
	  el: '#App',
	  store,
	  router,
	  template: '<App/>',
	  components: { App }
	})
</script>

<style>
</style>