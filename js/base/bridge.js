define(['backbone'],function( backbone ){
    var bridgeCache = {};

    return {
        create: function( name ){
            var point,
                id;

            if( !name ){
                return;
            }

            point = bridgeCache[name];

            if( point === undefined ){
                point = this.factory( name );
                bridgeCache[ name ] = point;
            }

            return point;
        },
        factory: function( name){
            var bridge = _.extend( backbone.Events),
                emit,
                roper = /\:([\w_,]+)/g,
                oldOn = bridge.on,
                oldOff = bridge.off;

            function getOper( name ){
                var list,
                    mod;
                mod = name.replace( roper,function(a,b){
                    list = b.split(',');
                    return '';
                });

                return {
                    mod: mod,
                    list: list
                }
            }

            function isArr( obj ){
                return Object.prototype.toString.call( obj ) == '[object Array]';
            }

            _.extend(bridge,{
                emit: function(name){
                    var oper,
                        arg,
                        _isArr = isArr,
                        args = Array.prototype.slice.call( arguments,1 );

                    if( !name ){
                        return this;
                    }

                    oper = getOper( name );

                    var i = 0,
                        list = oper.list,
                        mod = oper.mod + ':',
                        len = list.length;

                    if( len < 1 ){
                        return this;
                    }

                    for( ;i < len;i++ ){
                        arg = args[i];
                        _isArr( arg ) ?
                            arg = [ mod + list[i] ].concat( arg ) : arg = [ mod + list[i],arg ];
                        this.trigger.apply(this,arg );
                    }
                },
                on: function( name,ctx){
                    var oper,
                        args;
                    if( ctx === undefined ){
                        return this;
                    }

                    oper = getOper( name );

                    var i = 0,
                        list = oper.list,
                        mod = oper.mod + ':',
                        handle,
                        len = list.length;


                    if( len < 1 ){
                        return this;
                    }

                    for(;i < len;i++ ){
                        handle = ctx[ list[i] ];
                        if( !(typeof handle == 'function') ){
                            continue;
                        }

                        args = [
                            mod + list[ i ],
                            handle,
                            ctx
                        ];
                        oldOn.apply( bridge,args );
                    }
                },
                off: function( name ){
                    var oper,
                        args;

                    if( name == undefined ){
                        return this;
                    }

                    oper = getOper( name );

                    var i = 0,
                        handle,
                        list = oper.list,
                        mod = oper.mod + ':',
                        len = list.length;

                    if( len < 1 ){
                        return this;
                    }

                    for(; i < len ; i++ ){
                        handle = ctx[ list[i] ];
                        if(!(typeof handle == 'function')){
                            continue;
                        }

                        args = [
                            mod + list[i],
                            handle[ list[i] ]
                        ]
                        oldOff.apply( bridge,args );
                    }

                    return this;
                },
                has: function( name ){
                    return this._event[ name ];
                }
            });

            return bridge;

        }

    }
});