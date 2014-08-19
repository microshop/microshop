/**
 * Created by weiyanhai on 14-8-16.
 */
define(['backbone','jquery','bridge','async','mustache','fileupload'],function( backbone,$,bridge,async,mustache ){
    var	$doc = $( document),
        $body = $( document.body),
        $win = $( window),
        _bridge = bridge.create('view');



    var BaseView = backbone.View.extend({

        initialize: function(){
            backbone.View.prototype.initialize.apply(this,arguments);

            if( this.$tpl ){
                this.tpl = this.$tpl.html();
            }

            this.$render = this.$render || this.$el;

            this.$handler = $('<div></div>');

            this._bridgeName ?
                _bridge.on( this._bridgeName + ':' + 'show,hide' ) : true;
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
        dataFormat: function(){},
        render: function(){
            var model = this.model;

            if( !this.model ){

                this.$handler.html( $( this.tpl ) );
                this.$render.append( this.tpl )
            }

            model = model.toJSON();

            this.$render.append( mustache.render() )
        }
    });
    //_.extend( BaseView,bridge.create('BaseView'));

    var PopupBaseView = BaseView.extend({
        initialize: function(){

            if( !this.$el ){
                this.$el = $body;
            }

            BaseView.prototype.initialize.apply( this,arguments );




        }

    });

    var MainView = BaseView.extend({
        initialize: function(){
            BaseView.prototype.initialize.apply( arguments );

        }

    });




    BaseViewClass = backbone.View.extend({
        bridgeName: '',
        $tpl:'',
        config: {},
        action:{},
        initialize: function(){
            this.tpl = this.$tpl.html();
            this.$render = this.$render || this.$el;
            bridge.on( this.bridgeName + ':' + 'show',this)
                .on( this.bridgeName + ':' + 'hide',this)
                .on( this.bridgeName + ':' + 'success',this)
                .on( this.bridgeName + ':' + 'error',this);

            this.$handle = $('<div></div>');

            this.hide();
        },
        show: function(){
            this.$handle.stop().fadeIn();
            this.isShow = true;
            return this;
        },
        hide: function(){
            this.isShow = false;
            this.$handle.stop().fadeOut();
            return this;
        },
        dataFormatter: function(){
            return this.model.toJSON();
        },
        success: function( action ){
            var args = Array.prototype.slice.call( arguments ),
                handle = this.getActionHandle( action ),
                succ = handle && handle.success;

            succ && succ.apply( this, args);

        },
        getActionHandle: function( action ){
            return this[ '_Action_' + action ];
        },
        error: function( action ){
            var args = Array.prototype.slice.call( arguments ),
                handle = this.getActionHandle( action ),
                err = handle && handle.error;
            err && err.apply( this, args);
        },
        ajax: function( action,options ){
            var b = bridge,
                oper,
                url,
                self = this;

            if( !action ){
                return;
            }

            oper = this.actions[ action ];

            if( !oper ){
                return;
            }

            options = options || {};

            url = this.config.url + '?oper=' + oper;

            options.url = url;

            options = _.extend( {},this.config,options,{
                success: function(){
                    var args = Array.prototype.slice.call(arguments);

                    args.unshift( action );
                    args.unshift(self.bridgeName + ':success');

                    b.emit.apply(b,args);
                },
                error: function(){
                    var args = Array.prototype.slice.call(arguments);

                    args.unshift( action );
                    args.unshift(self.bridgeName + ':error');
                    b.emit.apply(b,args);
                }
            });

            this.model.fetch( options );
        },
        clear: function(){
            this.$render.html();
            return this;
        },
        render: function(){
            var data = this.dataFormatter();

            this.$handle.append($( mustache.render( this.tpl,data )));

            this.$render.append( this.$handle );

           // this.show();

            return this;
        }
    });

    ModuleAdd = BaseViewClass.extend({
        el: $(document.body),
        $tpl: $('#J_module_add_tpl'),
        bridgeName: 'ModuleAdd',
        model: new backbone.Collection([
            {text: '文字',oper: 'TextFrame:show',id: '#J_module_text_tpl',index: 0},
            {text: '广告图',oper: 'AdvertFrame:show',id: '#J_module_advert_tpl',index:1},
            {text: '商品',oper: 'GoodsFrame:show',id:'#J_module_goods_tpl',index:2}
        ]),
        initialize: function(){
            BaseViewClass.prototype.initialize.apply( this,arguments );

            this.$render.css('position','absolute；');
            this.$handle.css({
                position:'absolute'
            })
            this.render().hide();

            this.size = {
                height: this.$handle.outerHeight(),
                width: this.$handle.outerWidth()
            }
        },
        dataFormatter: function(){
            var model = this.model.toJSON(),
                self = this;

            model.getTpl = function(){
                var m = self.model.at( this.index );

                m.set('tpl',$(this.id).html());
                return '';
            }

            this.model

            model.list = model;
            return model;
        },
        show: function( pos,size ){
            if( this.isShow ){
                return;
            }
            this.$handle.css({
                left: pos.left + 'px',
                top: pos.top + size.height / 2 - this.size.height / 2 + 'px'
            });
            BaseViewClass.prototype.show.call( this );
        },
        events: {
            'click .wsf_btn4': function( e ){
                var target = $(e.currentTarget),
                    b = bridge,
                    model = this.model.toJSON(),
                    idx = target.attr('data-index'),
                    oper = target.attr('data-oper');


                b.emit(oper);
                b.emit('PhoneFrame:addModule',model[idx].tpl);

                this.hide();
            }
        }
    });

    MainFrame = BaseViewClass.extend({
        el: $('#J_modify'),
        $tpl: $('#J_main_frame_tpl'),
        model: new backbone.Model({
            shopCoverUrl:'',
            shopLogoUrl:'',
            showGoTop:false
        }),
        config: {
            url: 'http://localhost:8080/mainframe',
            dataType: 'jsonp'
        },
        actions:{
            update: 'update',
            edit: 'edit',
            check: 'check'
        },
        _Action_check:{
            success: function(){
                var model = this.model.toJSON();
                !this.$top && ( this.$top = this.$el.find('#J_showGoTop'));
                this.$top.prop('checked',model.showGoTop);
            },
            error: function(){

            }
        },
        _Action_update: {
            success: function(){
                this.render();
            },
            error: function(){

            }
        },
        _Action_edit:{
            success: function(){
                this.update()
                    .bindUpload();
            },
            error: function(){

            }
        },
        bridgeName: 'MainFrame',
        initialize: function(){
            BaseViewClass.prototype.initialize.apply( this,arguments );

        },
        bindUpload: function(){
            $('.J_upload_input').fineuploader({
                request: {
                    endpoint: 'server/handleUploads'
                }
            });
        },
        update: function(){
            var model = this.model.toJSON(),
                coverSrc,
                logoSrc;
            !this.$cover && (this.$cover = this.$el.find( '#J_cover_img' ));
            !this.$logo && (this.$logo = this.$el.find('#J_logo_img'));

            coverSrc = this.$cover.attr('src');
            logoSrc = this.$logo.attr('src');

            if( !(coverSrc == model.shopCoverUlr) ){
                this.$cover.attr('src',model.shopCoverUlr).removeClass('wsf_modify_cover_dis');
            }

            if( !(logoSrc == model.shopLogoUlr) ){
                this.$logo.attr('src',model.shopLogoUlr).removeClass('wsf_modify_logo_dis');
            }
        },
        dataFormatter: function(){
            var model = this.model.toJSON();

            if( model.shopCoverUrl || model.shopCoverUrl != '' ){
                model.coverOperName = '修改图片';
                model.coverCls = '';
            }
            else{
                model.coverCls = 'wsf_modify_cover_dis';
                model.coverOperName = '上传图片';
            }

            if( model.shopLogoUrl || model.shopLogoUrl != ''){
                model.logoOperName = '修改图片';
                model.logoCls = '';
            }
            else{
                model.logoOperName = '上传图片';
                model.logoCls = 'wsf_modify_simg_dis';
            }

            model.showGoTop  = model.showGoTop ?
                'checked' : '';


            return model;
        },
        upload: function( target,type ){
            var input = target.prev().fineUploader({
                    request: {
                        endpoint: 'server/handleUploads'
                    },
                    autoUpload: true
                });

                input.fineuploader('uploadStoredFiles');

        },
        modify: function(){

        },
        events: {
            'click #J_showGoTop': function( e ){
                var target = $(e.currentTarget),
                    checked = target.prop('checked');

                checked = checked == false ?
                    true : false;

                this.ajax('check',{
                    data: {
                        checked: checked
                    }
                });
            },
            'click .J_upload': function( e ){
                var target = $( e.currentTarget ),
                    type = target.attr('data-type');

                this.upload( target,type )
            }
        }
    });


    AdvertFrame = BaseViewClass.extend({
        el: $('#J_modify'),
        $tpl: $('#J_advert_frame_tpl'),
        initialize: function(){
            BaseViewClass.prototype.initialize.apply(this,arguments);
        }
    });

    TextFrame = BaseViewClass.extend({

    });

    GoodsFrame = BaseViewClass.extend({

    });

    ConfirmPopup = BaseViewClass.extend({
        el: $(document.body),
        $tpl: $('#J_confirm_popup_tpl'),
        initialize: function(){
            BaseViewClass.prototype.initialize.apply( this,arguments );

            this.noNotice = false;
        },
        show: function(){

            debugger;
            if( this.noNotice ){
                return;
            }

            BaseViewClass.prototype.show.call( this );
        }
    });



    PhoneFrame = backbone.View.extend({
        el: $('#J_wsf_moblie'),
        bridgeName: 'PhoneFrame',
        initialize: function(){
            this.$addHandle = this.$el.find('#J_wdf_edit_add');
            bridge.on(this.bridgeName + ':addModule',this);
        },
        addModule:function( module ){
            var elem = $( module );

            this.$addHandle.before( elem );
            elem.trigger('click;')

        },
        events: {
            'click .wdf_edit_field': function( e ){
                var target = $(e.currentTarget);

                if( !this.$lock ){
                    this.$lock = target;
                    this.$lock.data('locked',true)
                }
                else{
                    this.$lock.removeData('locked');

                    if( this.$lock.get(0) == target.get(0) ){
                        this.$lock = null;
                        return;
                    }

                    this.$lock.removeClass('wdf_edit_field_unflod');

                    this.$lock = target;
                    this.$lock.data('locked',true);

                }
            },
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

                bridge.emit('ModuleAdd:show',{
                    left: offset.left + width,
                    top: offset.top
                },{
                    width: target.outerWidth(),
                    height: target.outerHeight()
                });
            }

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




    });

    var phone = new PhoneFrame();

    var add = new ModuleAdd();

    var main = new MainFrame();

    var confirm = new ConfirmPopup();

    confirm.show();

    main.ajax( 'update' );

    return {}
});