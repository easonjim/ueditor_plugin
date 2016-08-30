UE.registerUI('insertvideo',function(editor,uiName){
	
    var isDebug = false; //是否为调试
    
    //重写alert
    function alert(msg){
    	if(isDebug) window.alert(msg);
    }
    
    var me =editor;

    /**
     * 创建插入视频字符窜
     * @param url 视频地址
     * @param width 视频宽度
     * @param height 视频高度
     * @param align 视频对齐
     * @param toEmbed 是否以flash代替显示
     * @param addParagraph  是否需要添加P 标签
     */
    function creatInsertStr(url,width,height,id,align,classname,type){
        var str;
        alert(type);
        alert(align);
        switch (type){
            case 'image':
                str = '<img ' + (id ? 'id="' + id+'"' : '') + ' width="'+ width +'" height="' + height + '" _url="'+url+'" class="' + classname.replace(/\bvideo-js\b/, '') + '"'  +
                    ' src="' + me.options.UEDITOR_HOME_URL+'themes/default/images/spacer.gif" style="background:url('+me.options.UEDITOR_HOME_URL+'themes/default/images/videologo.gif) no-repeat center center; border:1px solid gray;'+(align ? 'float:' + align + ';': '')+'" />'
                break;
            case 'iframe':
            	//<iframe frameborder="0" width="640" height="498" src="http://v.qq.com/iframe/player.html?vid=x0019v7ov81&tiny=0&auto=0" allowfullscreen></iframe>
                str = '<iframe frameborder="0" ' + (id ? 'id="' + id+'"' : '') + ' width="'+ width +'" height="' + height +'" class="' + classname.replace(/\bvideo-js\b/, '') + '"'  +
                    ' src="' + url+'" style="border:1px solid gray;'+(align ? 'float:' + align + ';': '')+'" allowfullscreen="true"></iframe>'
                break;
            case 'embed':
                str = '<embed type="application/x-shockwave-flash" class="' + classname + '" pluginspage="http://www.macromedia.com/go/getflashplayer"' +
                    ' src="' +  utils.html(url) + '" width="' + width  + '" height="' + height  + '"'  + (align ? ' style="float:' + align + '"': '') +
                    ' wmode="transparent" play="true" loop="false" menu="false" allowscriptaccess="never" allowfullscreen="true" >';
                break;
            case 'video':
                var ext = url.substr(url.lastIndexOf('.') + 1);
                if(ext == 'ogv') ext = 'ogg';
                str = '<video' + (id ? ' id="' + id + '"' : '') + ' class="' + classname + ' video-js" ' + (align ? ' style="float:' + align + '"': '') +
                    ' controls preload="none" width="' + width + '" height="' + height + '" src="' + url + '" data-setup="{}">' +
                    '<source src="' + url + '" type="video/' + ext + '" /></video>';
                break;
        }
        alert(str);
        return str;
    }

    function switchImgAndVideo(root,img2video){
        utils.each(root.getNodesByTagName(img2video ? 'img' : 'embed video'),function(node){
            var className = node.getAttr('class');
            if(className && className.indexOf('edui-faked-video') != -1){
                var html = creatInsertStr( img2video ? node.getAttr('_url') : node.getAttr('src'),node.getAttr('width'),node.getAttr('height'),null,node.getStyle('float') || '',className,img2video ? 'embed':'image');
                node.parentNode.replaceChild(UE.uNode.createElement(html),node);
            }
            if(className && className.indexOf('edui-upload-video') != -1){
                var html = creatInsertStr( img2video ? node.getAttr('_url') : node.getAttr('src'),node.getAttr('width'),node.getAttr('height'),null,node.getStyle('float') || '',className,img2video ? 'video':'image');
                node.parentNode.replaceChild(UE.uNode.createElement(html),node);
            }
        })
    }

    me.addOutputRule(function(root){
        switchImgAndVideo(root,true)
    });
    me.addInputRule(function(root){
        switchImgAndVideo(root)
    });    

    /**
     * 查询当前光标所在处是否是一个视频
     * @command insertvideo
     * @method queryCommandState
     * @param { String } cmd 需要查询的命令字符串
     * @return { int } 如果当前光标所在处的元素是一个视频对象， 则返回1，否则返回0
     * @example
     * ```javascript
     *
     * //editor 是编辑器实例
     * editor.queryCommandState( 'insertvideo' );
     * ```
     */
    me.commands["insertvideo1"] = {
        execCommand: function (cmd, videoObjs, type){
            videoObjs = utils.isArray(videoObjs)?videoObjs:[videoObjs];
            var html = [],id = 'tmpVedio', cl;
            for(var i=0,vi,len = videoObjs.length;i<len;i++){
                vi = videoObjs[i];
                cl = (type == 'upload' ? 'edui-upload-video video-js vjs-default-skin':'edui-faked-video');
                html.push(creatInsertStr( vi.url, vi.width || 420,  vi.height || 280, id + i, null, cl, 'iframe'));
            }
            alert(html.join(""));
            me.execCommand("inserthtml",html.join(""),true);
            alert(videoObjs.length);
            var rng = this.selection.getRange();
            for(var i= 0,len=videoObjs.length;i<len;i++){
                var img = this.document.getElementById('tmpVedio'+i);
                domUtils.removeAttributes(img,'id');
                rng.selectNode(img).select();
                me.execCommand('imagefloat1',videoObjs[i].align)//
            }
        },
        queryCommandState : function(){
            var img = me.selection.getRange().getClosedNode(),
                flag = img && (img.className == "edui-faked-video" || img.className.indexOf("edui-upload-video")!=-1);
            return flag ? 1 : 0;
        }
    };
	
	/**
	 * 图片对齐方式
	 * @command imagefloat
	 * @method execCommand
	 * @remind 值center为独占一行居中
	 * @param { String } cmd 命令字符串
	 * @param { String } align 对齐方式，可传left、right、none、center
	 * @remaind center表示图片独占一行
	 * @example
	 * ```javascript
	 * editor.execCommand( 'imagefloat', 'center' );
	 * ```
	 */
	
	/**
	 * 如果选区所在位置是图片区域
	 * @command imagefloat
	 * @method queryCommandValue
	 * @param { String } cmd 命令字符串
	 * @return { String } 返回图片对齐方式
	 * @example
	 * ```javascript
	 * editor.queryCommandValue( 'imagefloat' );
	 * ```
	 */
	
	me.commands['imagefloat1'] = {
	    execCommand:function (cmd, align) {
	        var me = this,
	            range = me.selection.getRange();
	        if (!range.collapsed) {
	            var img = range.getClosedNode();
	            if (img) {
	                switch (align) {
	                    case 'left':
	                    case 'right':
	                    case 'none':
	                        var pN = img.parentNode, tmpNode, pre, next;
	                        while (dtd.$inline[pN.tagName] || pN.tagName == 'A') {
	                            pN = pN.parentNode;
	                        }
	                        tmpNode = pN;
	                        if (tmpNode.tagName == 'P' && domUtils.getStyle(tmpNode, 'text-align') == 'center') {
	                            if (!domUtils.isBody(tmpNode) && domUtils.getChildCount(tmpNode, function (node) {
	                                return !domUtils.isBr(node) && !domUtils.isWhitespace(node);
	                            }) == 1) {
	                                pre = tmpNode.previousSibling;
	                                next = tmpNode.nextSibling;
	                                if (pre && next && pre.nodeType == 1 && next.nodeType == 1 && pre.tagName == next.tagName && domUtils.isBlockElm(pre)) {
	                                    pre.appendChild(tmpNode.firstChild);
	                                    while (next.firstChild) {
	                                        pre.appendChild(next.firstChild);
	                                    }
	                                    domUtils.remove(tmpNode);
	                                    domUtils.remove(next);
	                                } else {
	                                    domUtils.setStyle(tmpNode, 'text-align', '');
	                                }
	
	
	                            }
	
	                            range.selectNode(img).select();
	                        }
	                        domUtils.setStyle(img, 'float', align == 'none' ? '' : align);
	                        if(align == 'none'){
	                            domUtils.removeAttributes(img,'align');
	                        }
	
	                        break;
	                    case 'center':
	                        if (me.queryCommandValue('imagefloat') != 'center') {
	                            pN = img.parentNode;
	                            domUtils.setStyle(img, 'float', '');
	                            domUtils.removeAttributes(img,'align');
	                            tmpNode = img;
	                            while (pN && domUtils.getChildCount(pN, function (node) {
	                                return !domUtils.isBr(node) && !domUtils.isWhitespace(node);
	                            }) == 1
	                                && (dtd.$inline[pN.tagName] || pN.tagName == 'A')) {
	                                tmpNode = pN;
	                                pN = pN.parentNode;
	                            }
	                            range.setStartBefore(tmpNode).setCursor(false);
	                            pN = me.document.createElement('div');
	                            pN.appendChild(tmpNode);
	                            domUtils.setStyle(tmpNode, 'float', '');
	
	                            me.execCommand('insertHtml', '<p id="_img_parent_tmp" style="text-align:center">' + pN.innerHTML + '</p>');
	
	                            tmpNode = me.document.getElementById('_img_parent_tmp');
	                            tmpNode.removeAttribute('id');
	                            tmpNode = tmpNode.firstChild;
	                            range.selectNode(tmpNode).select();
	                            //去掉后边多余的元素
	                            next = tmpNode.parentNode.nextSibling;
	                            if (next && domUtils.isEmptyNode(next)) {
	                                domUtils.remove(next);
	                            }
	
	                        }
	
	                        break;
	                }
	
	            }
	        }
	    },
	    queryCommandValue:function () {
	        var range = this.selection.getRange(),
	            startNode, floatStyle;
	        if (range.collapsed) {
	            return 'none';
	        }
	        startNode = range.getClosedNode();
	        if (startNode && startNode.nodeType == 1) {
	            floatStyle = domUtils.getComputedStyle(startNode, 'float') || startNode.getAttribute('align');
	
	            if (floatStyle == 'none') {
	                floatStyle = domUtils.getComputedStyle(startNode.parentNode, 'text-align') == 'center' ? 'center' : floatStyle;
	            }
	            return {
	                left:1,
	                right:1,
	                center:1
	            }[floatStyle] ? floatStyle : 'none';
	        }
	        return 'none';
	
	
	    },
	    queryCommandState:function () {
	        var range = this.selection.getRange(),
	            startNode;
	
	        if (range.collapsed)  return -1;
	
	        startNode = range.getClosedNode();
	        if (startNode && startNode.nodeType == 1) {
	            return 0;
	        }
	        return -1;
	    }
	};

    //创建dialog
    var dialog = new UE.ui.Dialog({
        //指定弹出层中页面的路径，这里只能支持页面,因为跟addCustomizeDialog.js相同目录，所以无需加路径
        iframeUrl:'../tencentvideo/video/video.html',
        //需要指定当前的编辑器实例
        editor:editor,
        //指定dialog的名字
        name:uiName,
        //dialog的标题
        title:"腾讯视频",

        //指定dialog的外围样式
        cssRules:"width:600px;height:400px;",
		
        //如果给出了buttons就代表dialog有确定和取消
        buttons:[
            {
                className:'edui-okbutton',
                label:'确定',
                onclick:function () {
                    dialog.close(true);
                }
            },
            {
                className:'edui-cancelbutton',
                label:'取消',
                onclick:function () {
                    dialog.close(false);
                }
            }
        ]});

    //参考addCustomizeButton.js
    var btn = new UE.ui.Button({
        name:'dialogbutton' + uiName,
        title:'腾讯视频',
        //需要添加的额外样式，指定icon图标，这里默认使用一个重复的icon
        cssRules :'background: url(../tencentvideo/video/images/tencentvideo_icon.png) !important;background-size: 20px 20px !important;',
        onclick:function () {
            //渲染dialog
            dialog.render();
            dialog.open();
        }
    });

    return btn;
}/*index 指定添加到工具栏上的那个位置，默认时追加到最后,editorId 指定这个UI是那个编辑器实例上的，默认是页面上所有的编辑器都会添加这个按钮*/);