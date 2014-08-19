/**
 * Created by weiyanhai on 14-8-16.
 */
define(['backbone','jquery','bridge','async','mustache','fileupload'],function( backbone,$,bridge,async,mustache ){
    var	$doc = $( document),
        $body = $( document.body),
        $win = $( window),
        _bridge = bridge.create('view');

    var BaseView = backbone.View.extend({
        bridgeItem: ['show','hide'],
        initialize: function( options ){
            var tplType;

            this._extend();

            this.handleModel( this.model,options.changeItem || [] );

            if( this.$tpl ){
                this.tpl = this.$tpl.prop('tagName').toLowerCase() == 'script' ?
                    this.$tpl.html() :
                    this.$tpl.attr('data-tpl') == 'string' ?
                        this.$tpl.html() :
                        this.$tpl;
            }

            this.$handler || ( this.$handler = $('<div></div>'));
            this.$handler.hide();
            this.$render || ( this.$render || this.$el );

            this.$render = this.$render || this.$el;

            if( this.bridgeName ){
                if( this.bridgeItem ){
                    if( this.bridgeItem.length > 0 ){
                        _bridge.on( this.bridgeName + ':' + this.bridgeItem.join(','),this );
                    }
                }
            }
        },
        _extend: function( options ){
            if( !this.extended ){
                _.extend( this,options );
                this.extended = true;
            }
        },
        handleModel: function(model,item){
            model = this.model || model;

            typeof model == 'object' ?
                    Object.prototype.toString.call( model ) == '[object Array]' ?
                this.model = new backbone.Collection( model ):
                this.model = new backbone.Model( model )
                : (delete this.model);

            if( this.model ){
                this.bindChange( item );
            }
            return this;
        },
        bindChange: function( item ){
            var i = 0,
                point,
                len = item.length;

            if( len < 1 ){
                return this;
            }

            for( ; i < len;i++ ){
                point = item[ i ];
                if(!(typeof point == 'string')){
                    continue;
                }
                this.model.on('change:' + point,this['_change_' + item[i]]);

            }
            return this;
        },
        clear: function(){
            this.$handler.html('');
            return this;
        },
        show: function(){
            this.$handler.stop().fadeIn();
        },
        hide: function(){
            this.$handler.stop().fadeOut();
        },
        watch: function(){
            this.watchHandler()
                .watchEvt();

            return this;
        },
        watchHandler: function(){
            var elems = this.$handler.find('[data-handler]'),
                self = this;

            elems.each(function(idx,el){
                var attr;

                el = $(el);
                attr = el.attr('data-handler').match(/[\w_]+/g);

                if( attr ){
                    attr = '$' + attr[0];
                    !self[ attr ] && (self[ attr ] = el )
                }
            });

            return this;
        },
        watchEvt: function(){
            var elems = this.$handler.find('[data-event]'),
                exist = [],
                self = this;

            elems.each(function(idx,el){
                var attr,
                    rand = getRand();

                el = $(el);
                el.attr('data-handler',rand);
                attr = el.attr('data-event');

                _.extend(self.events || ( self.events = {} ),onEvt.call(self,attr,'[data-handler=\''+ rand +'\']' ));
            });

            function getRand(){
                var r = Math.random().toString().replace(/\D/g,'').slice(0,8);

                if($.inArray(r,exist) == -1 ){
                    exist.push( r );
                    return r;
                }
                getRand();
            }

            function onEvt( attr,rand ){
                var evt = true,
                    type;

                if( !/.*\:.*/g.test( attr ) ){
                    return {};
                }

                attr = attr.replace(/\s*/gi,'').replace(/[^\:,]+/gi,function( $1 ){
                    if( evt ){
                        type = $1;
                        evt = false;
                        return '"' + type +' ' + rand +'"';
                    }
                    else{
                        evt = true;
                        return 'this["_'+ type +'_' + $1 +'"]'
                    }
                });

                return eval( '({'+ attr +'})' );
            }

            return this;
        },
        dataFormat: function( model ){
            return {
                list: model
            }
        },
        append: function(){
            if( this.el ){
                this.$el.append( this.$handler );
            }
            return this;
        },
        remove: function(){
            this.$handler.remove();
            return this;
        },
        render: function(){
            var model = this.model;

            if( !model ){
                this.$handler.html( $( this.tpl ) );
            }
            else{
                model = this.dataFormat( model.toJSON() );
                this.$handler.html( mustache.render(this.tpl,model) );
            }

            return this;
        }
    });
    //_.extend( BaseView,bridge.create('BaseView'));

    var PopupBaseView = BaseView.extend({
        initialize: function( options ){
            var pos;

            BaseView.prototype._extend.call(this,options);

            if( !options.el ){
                this.$el = $body;
            }

            this.$el || ( this.$el = $body);
            pos = this.$el.css( 'position');

            if( pos ){
                pos.replace(/\s*/g,'');

                if(!( pos == 'relative' || pos == 'absolute' )){
                    this.$el.css({
                        position: 'relative'
                    })
                }
            }

            this.$handler = $('<div></div>').css({
                position: 'absolute'
            });

            this.size = {
                width: this.$handler.outerHeight(),
                height: this.$handler.outerWidth()
            }

            BaseView.prototype.initialize.apply( this,arguments );

            this.fresh();
        },
        fresh: function(){
            this.render()
                .watch()
                .append();
            return this;
        }
    });

    var popup = new PopupBaseView({
        $tpl: $('#J_confirm_popup_tpl'),
        bridgeName: 'confirm',
        bridgeItem: ['confirm','cancel','show','hide'],
        _click_close: function( e ){
            this.hide();
        },
        _click_cancel: function(e){
            this.hide();
        },
        _click_confirm: function(e){
            alert('发布咯！')
        }
    });

    _bridge.emit('confirm:show');


    var MainView = BaseView.extend({
        initialize: function( options ){

            BaseView.prototype._extend.call(this,options);

            if( this.model ){
                this.bindChange( options.changeItem || [] );
            }

            BaseView.prototype.initialize.apply( this,arguments );

            this.$handler.css({
                absolute: 'relative'
            })
        },
        ajax: function(){},
        show: function(){
            this.$el.children().hide();

            this.$handler.css({
                position: 'relative',
                opacity: 0,
                display: 'none',
                left: '50px'
            }).show().stop().animate({
                left: '0px',
                opacity:1
            });
            return this;
        },
        hide: function(){

        }
    });

    var addModule = new PopupBaseView({
        bridgeName: 'addModule',
        bridgeItem: ['show','hide'],
        $tpl: $('#J_module_add_tpl'),
        model: [{
            text: '文字',
            action: 'textModule:create'
        },{
            text: '广告图',
            action: 'advertModule:create'
        },{
            text: '商品',
            action: 'goodsModule:create'
        }],
        _click_choose:function( e ){
            var target = $(e.target),
                attr = target.attr('data-action');

            if( !attr ){
                return;
            }

            _bridge.emit(attr);
        },
        show: function(pos,size){
            //debugger;
            if( this.isShow ){
                return;
            }
            this.$handler.css({
                left: pos.left + 50 + 'px',
                opacity:0,
                top: pos.top + size.height / 2 - this.size.height / 2 + 'px'
            }).show();

            this.$handler.animate({
                left: pos.left + 'px',
                opacity: 1
            });
            //BaseView.prototype.show.call(this);
        },
        fresh: function(){
            this.render()
                .watch()
                .append();

            return this;
        }
    });


    var textModule = new MainView({
        model:{content:'',margin:false},
        bridgeName: 'textModule',
        bridgeItem: ['show','hide','create'],
        el: $('#J_wsf_modify'),
        $tpl: $('#J_frame_text_tpl'),
        create: function(){
            this.render()
                .watch()
                .append()
                .show();
            return this;
        }
    });

    var advertModule = new MainView({
        model:{},
        bridgeName: 'advertModule',
        bridgeItem: ['show','hide','create'],
        el: $('#J_wsf_modify'),
        $tpl: $('#J_frame_advert_tpl'),
        create: function(){
            this.render()
                .watch()
                .append()
                .show();
            return this;
        }
    });

    var goodsModule = new MainView({
        model:{},
        bridgeName: 'goodsModule',
        bridgeItem: ['show','hide','create'],
        el: $('#J_wsf_modify'),
        $tpl: $('#J_frame_goods_tpl'),
        create: function(){
            this.render()
                .watch()
                .append()
                .show();
            return this;
        }
    });


    var mainModule = new MainView({
        model: {coverUrl:'',shopUrl:'',showGoTop:false},
        bridgeName:'mainModule',
        bridgaItem: ['show','hide','create','fresh'],
        el: $('#J_wsf_modify'),
        $tpl: $('#J_frame_main_tpl'),
        create: function(){
            this.render()
                .watch()
                .append()
                .show();
            return this;
        }
    });

    mainModule.create();

//    var addBaseModule = new MainView({
//        bridgeName: 'addBaseModule',
//        bridgeItem: ['show','hide'],
//        $tpl: $(),
//        model: [{
//            text: '请添加文字内容'
//        },{
//            text: '请添加文字内容'
//        },{
//            text: '请添加文字内容'
//        }],
//        create: function(){
//
//        }
//    })

    var MobileFrame = new backbone.View({
        el: $('#J_wsf_moblie'),
        initialize: function(){},
        watchHandle: function(){
            this.moduleList = this.$el.find('.wdf_edit_field')
        },
        events: {
            'mouseenter .wdf_edit_field': function( e ){
                var target = $( e.currentTarget );

                target.addClass( 'wdf_edit_field_unflod');
            },
            'mouseleave .wdf_edit_field': function( e ){
                var target = $( e.currentTarget),
                    locked = target.data('locked');

                if( locked ){
                    return;
                }

                target.removeClass('wdf_edit_field_unflod');
            },
            'click .edit': function(){
                var target = $(e.currentTarget),
                    type = target.attr('data-type');

            },
            'click .wdf_edit_field_optlink': function(e){
                var target = $(e.target),
                    handle = this._event_[ "_click_" + target.attr('data-oper') ];
                e.stopPropagation();

                handle && handle.call(this,$(e.currentTarget).parents('.wdf_edit_field'));

            },
            'click #J_wdf_edit_add': function( e ){
                var target = $(e.currentTarget),
                    offset = target.offset(),
                    width = this.$el.outerWidth();

                _bridge.emit('addModule:show',[{
                    left: offset.left + width,
                    top: offset.top
                },{
                    width: target.outerWidth(),
                    height: target.outerHeight()
                }]);
            },
            _event_: {
                _click_moveUp: function( target ){
                    var prev = target.prev();

                    if( prev.length > 0 ){
                        target.after( prev );
                        //bridge.emit(  )
                    }
                },
                _click_moveDown: function( target ){
                    var next = target.next();

                    if( next.length > 0 && next.attr('id') != 'J_wdf_edit_add'){
                        target.before( next );
                    }
                },
                _click_del: function( target ){
                    target.remove();
                }
            }
        }
    })

    //MobileFrame.watch();





});