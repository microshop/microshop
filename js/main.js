!(function(){
	var Microshop = {
			_viewPath: './view/',
			_modelPath: './model/',
			_tplPath: './tpl/',
			_libsPath: './libs/',
			_basePath: './base/'
		}

	Microshop.main = function(){
		var self = this;
		this.initRequire()
			.load(function( ){
				args = Array.prototype.slice.call( arguments,1 );
				self.init.apply( self,args );
			});
	}

	//init require
	Microshop.initRequire = function(){
		require.config({
			paths: {
				//libs js
				'backbone': this._libsPath + 'backbone',
				'jquery': this._libsPath + 'jquery',
				'underscore': this._libsPath + 'underscore',
				'mustache': this._libsPath + 'mustache',
				'async': this._libsPath + 'async',
                'transport': this._libsPath + 'jquery.iframe-transport',
                'fileupload': this._libsPath + 'jquery.fileupload',
                'jquery.ui.widget': this._libsPath + 'jquery.ui.widget',
				//base js
				'bridge': this._basePath + 'bridge',

				//project js
				//view js
				'view': this._viewPath + 'view'
			},
            shim: {
                'fileupload': {
                    deps: ['jquery'],
                    exports: 'fileupload'
                },
                'widget':{
                    deps:['jquery'],
                    exports: 'widget'
                }

            }
		});

		return this;
	}

	Microshop.init = function( bridge,View,async ){

	}

	Microshop.load = function( callback ){
		var self = this;

		require(['async'],function( async ){
			async.waterfall([
				function( next ){ 
					require(['bridge'],function( bridge ){
						next( null,bridge,async );
					}); 
				},
				function( bridge,async,next ){ 
					require(['view'],function( view ){
						next( null,bridge,async,view );
					}); 
				}
			],callback);
		});
	}


	Microshop.main();



})();