(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{26:function(e,t,a){e.exports=a(44)},44:function(e,t,a){"use strict";a.r(t);var n=a(0),o=a.n(n),r=a(7),i=a.n(r),l=a(6),p=a(3),c=a(1),d=a(5);function u(){var e=Object(l.a)(["\n* {\n  box-sizing: border-box;\n}\nbody {\n  margin: 0;\n}\n\n.ReactModal__Body--open {\n  overflow: hidden;\n  width: 100%;\n  height: 100%;\n}\n\n.ReactModal__Overlay {\n  opacity: 0;\n  transition: opacity ","ms ease-out;\n}\n.ReactModal__Overlay--after-open {\n  opacity: 1;\n}\n.ReactModal__Overlay--before-close {\n  opacity: 0;\n}\n\n.ReactModal__Content {\n  opacity: 0;\n  transform: scale(0.7);\n  transition: all ","ms ease-in;\n}\n.ReactModal__Content--after-open {\n  opacity: 1;\n  transform: scale(1);\n}\n.ReactModal__Content--before-close {\n  opacity: 0;\n  transform: scale(0.7);\n}\n"]);return u=function(){return e},e}function s(){var e=Object(l.a)(["\n  position: absolute;\n  width: 100%;\n  padding: ","px;\n  transition: all ","s ease-in-out;\n  font-weight: bold;\n"]);return s=function(){return e},e}function x(){var e=Object(l.a)(["\n  opacity: ",";\n  transition: all ","s ease-in-out;\n  font-weight: bold;\n"]);return x=function(){return e},e}var y,f=500,m=600,h=20,b=d.default.span(x(),function(e){return e.show?1:0},f/1e3),w=d.default.div(s(),h,f/1e3),g=100,T=Object(d.createGlobalStyle)(u(),g,g);!function(e){e[e.Text=0]="Text",e[e.TextCode=1]="TextCode",e[e.TextHide=2]="TextHide",e[e.TextShowLast=3]="TextShowLast",e[e.TextMoveTo=4]="TextMoveTo",e[e.TextMoveFrom=5]="TextMoveFrom",e[e.NewLine=6]="NewLine",e[e.OptionFail=7]="OptionFail",e[e.OptionPass=8]="OptionPass"}(y||(y={}));var O=a(9),C=a(20),E=a(21),v=a(23),S=a(22),L=a(25),j=a(8),F=a(2),k=a.n(F),N=function(){function e(){this.el.style.zIndex="1"}function t(){this.el.style.zIndex="-1"}var a=new k.a.Burst({left:0,top:0,count:8,radius:{50:150},children:{shape:"line",stroke:["white","#FFE217","#FC46AD","#D0D202","#B8E986","#D0D202"],scale:1,scaleX:{1:0},degreeShift:"rand(-90, 90)",radius:"rand(20, 40)",delay:"rand(0, 150)",isForce3d:!0},onStart:e,onComplete:t}),n=new k.a.Burst({left:0,top:0,count:4,angle:45,radius:{0:450},children:{shape:"line",stroke:"#4ACAD9",scale:1,scaleX:{1:0},radius:100,duration:450,isForce3d:!0,easing:"cubic.inout"},onStart:e,onComplete:t}),o={left:0,top:0,scale:{0:1}},r=new k.a.Shape(Object(j.a)({},o,{fill:"none",stroke:"white",strokeWidth:4,opacity:{.25:0},radius:250,duration:600,onStart:e,onComplete:t})),i=new k.a.Shape(Object(j.a)({},o,{fill:"white",opacity:{.5:0},radius:30,onStart:e,onComplete:t}));return function(e){a.tune({x:e.pageX,y:e.pageY}).generate().replay(),n.tune({x:e.pageX,y:e.pageY}).replay(),r.tune({x:e.pageX,y:e.pageY}).replay(),i.tune({x:e.pageX,y:e.pageY}).replay()}}(),R=function(){function e(){this.el.style.zIndex="1"}function t(){this.el.style.zIndex="-1"}var a="#FD5061",n="#29363B",o="white",r="#A50710",i=new k.a.Burst({left:0,top:0,count:3,radius:0,degree:0,isShowEnd:!1,children:{fill:[a,o,n],radius:"stagger(200, 2)",scale:{.25:3},duration:500,delay:"stagger(50)",easing:["cubic.out","cubic.out","cubic.out"],isForce3d:!0},onStart:e,onComplete:t}),l=new k.a.Burst({left:0,top:0,count:5,radius:{50:250},children:{fill:"white",shape:"line",stroke:[o,r],strokeWidth:12,radius:"rand(30, 60)",radiusY:0,scale:{1:0},pathScale:"rand(.5, 1)",degreeShift:"rand(-360, 360)",isForce3d:!0},onStart:e,onComplete:t}),p=new k.a.Burst({top:0,left:0,count:3,radius:{0:250},children:{shape:["circle","rect"],points:5,fill:[o,r],radius:"rand(30, 60)",scale:{1:0},pathScale:"rand(.5, 1)",isForce3d:!0},onStart:e,onComplete:t}),c={left:0,top:0,fill:o,scale:{.2:1},opacity:{1:0},isForce3d:!0,isShowEnd:!1},d=new k.a.Shape(Object(j.a)({},c,{radius:200,onStart:e,onComplete:t})),u=new k.a.Shape(Object(j.a)({},c,{radius:240,easing:"cubic.out",delay:150,onStart:e,onComplete:t}));return function(e){l.tune({x:e.pageX,y:e.pageY}).generate().replay(),p.tune({x:e.pageX,y:e.pageY}).generate().replay(),d.tune({x:e.pageX,y:e.pageY}).replay(),u.tune({x:e.pageX,y:e.pageY}).replay(),i.tune({x:e.pageX,y:e.pageY}).replay()}}(),B=function(){var e=function(e){function t(){return Object(C.a)(this,t),Object(v.a)(this,Object(S.a)(t).apply(this,arguments))}return Object(L.a)(t,e),Object(E.a)(t,[{key:"getShape",value:function(){return'<path d="M5.51132201,34.7776271 L33.703781,32.8220808 L44.4592855,6.74813038 C45.4370587,4.30369752 47.7185293,3 50,3 C52.2814707,3 54.5629413,4.30369752 55.5407145,6.74813038 L66.296219,32.8220808 L94.488678,34.7776271 C99.7034681,35.1035515 101.984939,41.7850013 97.910884,45.2072073 L75.9109883,63.1330483 L82.5924381,90.3477341 C83.407249,94.4217888 80.4739296,97.6810326 77.0517236,97.6810326 C76.0739505,97.6810326 74.9332151,97.3551083 73.955442,96.7032595 L49.8370378,81.8737002 L26.044558,96.7032595 C25.0667849,97.3551083 23.9260495,97.6810326 22.9482764,97.6810326 C19.3631082,97.6810326 16.2668266,94.4217888 17.4075619,90.3477341 L23.9260495,63.2960105 L2.08911601,45.2072073 C-1.98493875,41.7850013 0.296531918,35.1035515 5.51132201,34.7776271 Z" />'}}]),t}(k.a.CustomShape);k.a.addShape("star",e);var t=new k.a.Shape({left:0,top:0,stroke:"#FF9C00",strokeWidth:Object(O.a)({},56,0),fill:"none",scale:{0:1,easing:"quad.out"},radius:28,duration:450}),a=new k.a.Burst({left:0,top:0,radius:{6:25},angle:45,children:{shape:"star",radius:28/2.2,fill:"#FD7932",degreeShift:"stagger(0,-5)",duration:700,delay:200,easing:"quad.out"}}),n=new k.a.Shape({left:0,top:0,shape:"star",fill:"#FF9C00",scale:{0:1},easing:"elastic.out",duration:1600,delay:300,radius:28/2.35}),o=new k.a.Timeline({speed:1.5});return o.add(a,t,n),function(e){a.tune(e),t.tune(e),n.tune(e),o.replay()}}();function M(e){var t=e.data;return o.a.createElement(c.Card,{width:"100%",style:{maxWidth:m-2*h},borderRadius:"5px",backgroundColor:"#272822",p:"10px"},o.a.createElement(c.Flex,null,t.map(function(e,t){return o.a.createElement(c.Text,{key:t,fontWeight:"bold",color:e.isGreen?"#a6e22e":"#f92672"},e.text)})))}var _=function(e){var t=e.data,a=e.show,r=e.onFail,i=e.onNext,l=e.increaseStar,d=Object(n.useState)(0),u=Object(p.a)(d,2),s=u[0],x=u[1],g=Object(n.useState)(0),T=Object(p.a)(g,2),O=T[0],C=T[1],E=Object(n.useRef)(null),v=Object(n.useRef)(null),S=Object(n.useRef)(null),L=Object(n.useRef)(null);function j(e){if(N(e),x(1),L.current&&v.current){var t=v.current.getBoundingClientRect();L.current.style.left="".concat(t.left,"px"),L.current.style.top="".concat(t.top,"px"),L.current.style.width="".concat(t.width,"px"),L.current.textContent=v.current.textContent||"",setTimeout(function(){if(L.current&&E.current){var e=E.current.getBoundingClientRect();L.current.style.left="".concat(e.left,"px"),L.current.style.top="".concat(e.top,"px")}l()},f)}setTimeout(function(){x(2)},2*f),setTimeout(function(){i()},3*f)}function F(e){if(C(1),S.current){var t=e.currentTarget.children[1].getBoundingClientRect();S.current.style.left="".concat(t.left,"px"),S.current.style.top="".concat(t.top,"px"),S.current.style.width="".concat(t.width,"px"),S.current.textContent=e.currentTarget.dataset.text||""}setTimeout(function(){C(2)},2*f),setTimeout(function(){r()},4*f),R(e)}var k=t.filter(function(e){return e.type===y.OptionPass||e.type===y.OptionFail}),B=t.filter(function(e){return e.type!==y.OptionPass&&e.type!==y.OptionFail});return o.a.createElement(o.a.Fragment,null,o.a.createElement(w,{style:{opacity:a&&!O?1:0}},o.a.createElement(c.Box,null,B.map(function(e,t){return o.a.createElement(o.a.Fragment,{key:t},e.type===y.NewLine&&o.a.createElement(c.Box,{mb:e.data}),e.type===y.TextCode&&o.a.createElement(M,{data:e.data}),e.type===y.Text&&e.data,e.type===y.TextHide&&o.a.createElement(b,{show:!s},e.data),e.type===y.TextShowLast&&o.a.createElement(b,{show:2===s},e.data),e.type===y.TextMoveTo&&o.a.createElement(b,{ref:E,show:2===s},e.data))})),o.a.createElement(c.Box,{mb:"20px"}),o.a.createElement(c.Card,{width:"100%",p:"20px",my:5,bg:s?"black":"#272822",borderRadius:8,style:{maxWidth:m-2*h}},k.map(function(e,t){return o.a.createElement(o.a.Fragment,{key:t},o.a.createElement(c.Flex,{onClick:e.type===y.OptionFail?F:j,"data-text":e.data},o.a.createElement(b,{show:!s,style:{color:"#a6e22e",flex:"0 0 22px"}},"".concat(t+1,") ")),o.a.createElement(b,{ref:e.type===y.OptionFail?void 0:v,show:!s},e.data)),t<k.length-1&&o.a.createElement(c.Box,{mb:"10px"}))}))),o.a.createElement(b,{ref:S,show:1===O,style:{color:"red",position:"absolute"}}),o.a.createElement(b,{ref:L,show:1===s,style:{position:"absolute"}}))},z=a(14),A=a.n(z);function P(e){var t=e.children,a=e.isOpen,r=e.onRequestClose,i=e.contentStyle,l=e.shouldCloseOnOverlayClick,p=void 0===l||l,c={overlay:X,content:i};return Object(n.useEffect)(function(){var e=function(e){a&&e.preventDefault()};return window.addEventListener("touchmove",e),function(){window.removeEventListener("touchmove",e)}},[a]),o.a.createElement(A.a,{isOpen:a,contentLabel:"PodoModal",shouldCloseOnOverlayClick:p,onRequestClose:r,closeTimeoutMS:g,style:c},t)}A.a.setAppElement("#root");var X={position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0, 0, 0, 0.5)",zIndex:100};function D(e){var t=e.data,a=e.onClose,r=Object(n.useState)(!1),i=Object(p.a)(r,2),l=i[0],d=i[1],u=Object(n.useState)(!1),s=Object(p.a)(u,2),x=s[0],y=s[1];return t?o.a.createElement(c.Box,null,o.a.createElement(c.Card,{fontSize:"16px",width:1,p:"20px",my:"20px",bg:"#f6f6ff",borderRadius:8,boxShadow:"0 2px 16px rgba(0, 0, 0, 0.25)"},o.a.createElement(c.Text,{textAlign:"left"},"[\uc0dd\uac01\ud574\ubcf4\uae30]"),t.thinkTexts.map(function(e,t){return o.a.createElement(c.Text,{key:t,textAlign:"left"},e)})),o.a.createElement(c.Box,{mb:"20px"}),o.a.createElement(c.Box,null,!l&&o.a.createElement(c.Button,{bg:"magenta",onClick:function(){return d(!l)}},"\ud78c\ud2b8\ubcf4\uae30"),l&&o.a.createElement(c.Card,{fontSize:"16px",width:1,p:"20px",bg:"#f6f6ff",borderRadius:8,boxShadow:"0 2px 16px rgba(0, 0, 0, 0.25)"},o.a.createElement(c.Text,{textAlign:"left"},"[\ud78c\ud2b8]"),t.hintTexts.map(function(e,t){return o.a.createElement(c.Text,{key:t,textAlign:"left"},e)}))),o.a.createElement(c.Box,{mb:"20px"}),o.a.createElement(c.Box,null,!x&&o.a.createElement(c.Button,{bg:"magenta",onClick:function(){return y(!x)}},"\ub2f5\uc774 \uad81\uae08\ud558\ub2e4\uba74"),x&&o.a.createElement(c.Card,{fontSize:"16px",width:1,p:"20px",bg:"#f6f6ff",borderRadius:8,boxShadow:"0 2px 16px rgba(0, 0, 0, 0.25)"},o.a.createElement(c.Flex,{flexDirection:"column"},o.a.createElement(c.Image,{src:"http://image.yes24.com/Goods/60763065/800x0"}),o.a.createElement(c.Text,{mx:"10px",mt:"20px",textAlign:"left"},"\uc81c\uac00 \uc9d1\ud544\ud55c [",o.a.createElement(c.Link,{href:"http://www.yes24.com/Product/Goods/60763065?scode=029",target:"_blank"},"\uc2e4\uc804 \ub9ac\uc561\ud2b8 \ud504\ub85c\uadf8\ub798\ubc0d"),"]\uc5d0\uc11c \uc790\uc138\ud55c \ub0b4\uc6a9\uc744 \ud655\uc778\ud558\uc2e4 \uc218 \uc788\uc2b5\ub2c8\ub2e4^^")))),o.a.createElement(c.Box,{mb:"20px"}),o.a.createElement(c.Button,{width:"150px",onClick:a},"\ub2eb\uae30")):null}function G(){var e=Object(l.a)(["\n  max-width: ","px;\n  height: 100vh;\n  margin: 0 auto;\n  background-color: black;\n  color: white;\n"]);return G=function(){return e},e}var I=d.default.div(G(),m),Y=[[{type:y.TextCode,data:[{text:"<input type="},{text:'"text"',isGreen:!0},{text:" />"}]},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\uc704 \ucf54\ub4dc\ub97c \ube0c\ub77c\uc6b0\uc800 \ucf58\uc194\uc5d0 \uc785\ub825\ud558\uba74"},{type:y.TextHide,data:" \uadf8 \uacb0\uacfc\ub294?"},{type:y.NewLine,data:"8px"},{type:y.TextMoveTo,data:"syntax \uc5d0\ub7ec\uac00 \ub09c\ub2e4."},{type:y.OptionFail,data:"\ub9ac\uc561\ud2b8 element object\uac00 \ucd9c\ub825\ub41c\ub2e4."},{type:y.OptionFail,data:"import React from 'react' \ucf54\ub4dc\uac00 \uc5c6\uc5b4\uc11c \uc5d0\ub7ec\uac00 \ub09c\ub2e4."},{type:y.OptionPass,data:"syntax \uc5d0\ub7ec\uac00 \ub09c\ub2e4."}],[{type:y.TextCode,data:[{text:"<input type="},{text:'"text"',isGreen:!0},{text:" />"}]},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\uc704 \ucf54\ub4dc\ub97c \ube0c\ub77c\uc6b0\uc800 \ucf58\uc194\uc5d0 \uc785\ub825\ud558\uba74"},{type:y.NewLine,data:"8px"},{type:y.Text,data:"syntax \uc5d0\ub7ec\uac00 \ub09c\ub2e4."},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\uc774 \uc5d0\ub7ec\ub97c \ud574\uacb0\ud558\ub294\ub370 \uc0ac\uc6a9\ub418\ub294 \ub3c4\uad6c\ub294"},{type:y.TextHide,data:"?"},{type:y.NewLine,data:"8px"},{type:y.TextMoveTo,data:"babel"},{type:y.TextShowLast,data:"\uc774\ub2e4."},{type:y.OptionFail,data:"webpack"},{type:y.OptionPass,data:"babel"},{type:y.OptionFail,data:"polyfill"}],[{type:y.TextCode,data:[{text:"<input type="},{text:'"text"',isGreen:!0},{text:" />"}]},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\uc704 \ucf54\ub4dc\ub97c \ube0c\ub77c\uc6b0\uc800 \ucf58\uc194\uc5d0 \uc785\ub825\ud558\uba74"},{type:y.NewLine,data:"8px"},{type:y.Text,data:"syntax \uc5d0\ub7ec\uac00 \ub09c\ub2e4."},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\uc774 \uc5d0\ub7ec\ub97c \ud574\uacb0\ud558\ub294\ub370 \uc0ac\uc6a9\ub418\ub294 \ub3c4\uad6c\ub294"},{type:y.NewLine,data:"8px"},{type:y.Text,data:"babel\uc774\ub2e4."},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\ub2e4\uc74c \uc911 \uc798\ubabb\ub41c \uc124\uba85\uc740?"},{type:y.OptionPass,data:"babel\uc740 \ub7f0\ud0c0\uc784\uc5d0 \uc704 \ucf54\ub4dc\ub97c \uc790\ubc14\uc2a4\ud06c\ub9bd\ud2b8 \ubb38\ubc95\uc73c\ub85c \ubcc0\ud658\ud55c\ub2e4."},{type:y.OptionFail,data:"babel\uc740 \uc704 \ucf54\ub4dc\ub97c React.createElement \ud568\uc218\ub97c \ud638\ucd9c\ud558\ub294 \ucf54\ub4dc\ub85c \ubcc0\ud658\ud55c\ub2e4."},{type:y.OptionFail,data:"babel\uc740 \ub9ac\uc561\ud2b8\ubfd0\ub9cc \uc544\ub2c8\ub77c vue.js\uc5d0\uc11c\ub3c4 \uc0ac\uc6a9\ub41c\ub2e4."}],[{type:y.TextCode,data:[{text:"<a href={"},{text:"data1",isGreen:!0},{text:"} />"}]},{type:y.NewLine,data:"8px"},{type:y.Text,data:"data1\uc758 \ucd9c\ucc98\ub85c \ubd80\uc801\uc808\ud55c \uac83\uc740"},{type:y.TextHide,data:"?"},{type:y.NewLine,data:"8px"},{type:y.TextMoveTo,data:"\ucef4\ud3ec\ub10c\ud2b8 \uc678\ubd80\uc758 let \ubcc0\uc218"},{type:y.TextShowLast,data:"\uc774\ub2e4."},{type:y.OptionFail,data:"\ucef4\ud3ec\ub10c\ud2b8\uc758 state"},{type:y.OptionFail,data:"\ucef4\ud3ec\ub10c\ud2b8 \uc678\ubd80\uc758 const \ubcc0\uc218"},{type:y.OptionPass,data:"\ucef4\ud3ec\ub10c\ud2b8 \uc678\ubd80\uc758 let \ubcc0\uc218"}],[{type:y.TextCode,data:[{text:"<a href={"},{text:"data1",isGreen:!0},{text:"} />"}]},{type:y.NewLine,data:"8px"},{type:y.Text,data:"data1\uc758 \ucd9c\ucc98\ub85c \ubd80\uc801\uc808\ud55c \uac83\uc740"},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\ucef4\ud3ec\ub10c\ud2b8 \uc678\ubd80\uc758 let \ubcc0\uc218\uc774\ub2e4."},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\uadf8 \uc774\uc720\uc5d0 \ub300\ud55c \uc124\uba85\uc73c\ub85c \uc801\uc808\ud55c \uac83\uc740"},{type:y.TextHide,data:"?"},{type:y.NewLine,data:"8px"},{type:y.TextMoveTo,data:"\ub9ac\uc561\ud2b8\uac00 \ub370\uc774\ud130\uc758 \ubcc0\uacbd \uc2dc\uc810\uc744 \ubaa8\ub974\uae30 \ub54c\ubb38"},{type:y.TextShowLast,data:"\uc774\ub2e4."},{type:y.OptionFail,data:"\uba54\ubaa8\ub9ac\ub97c \ud6a8\uc728\uc801\uc73c\ub85c \uc0ac\uc6a9\ud560 \uc218 \uc5c6\uae30 \ub54c\ubb38"},{type:y.OptionFail,data:"\ub80c\ub354\ub9c1 \uc131\ub2a5\uc5d0 \ubd80\uc815\uc801\uc778 \uc601\ud5a5\uc744 \uc8fc\uae30 \ub54c\ubb38"},{type:y.OptionPass,data:"\ub9ac\uc561\ud2b8\uac00 \ub370\uc774\ud130\uc758 \ubcc0\uacbd \uc2dc\uc810\uc744 \ubaa8\ub974\uae30 \ub54c\ubb38"}],[{type:y.TextCode,data:[{text:"<a href={"},{text:"data1",isGreen:!0},{text:"} />"}]},{type:y.NewLine,data:"8px"},{type:y.Text,data:"data1\uc758 \ucd9c\ucc98\ub85c \ubd80\uc801\uc808\ud55c \uac83\uc740"},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\ucef4\ud3ec\ub10c\ud2b8 \uc678\ubd80\uc758 let \ubcc0\uc218\uc774\ub2e4."},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\uadf8 \uc774\uc720\uc5d0 \ub300\ud55c \uc124\uba85\uc73c\ub85c \uc801\uc808\ud55c \uac83\uc740"},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\ub9ac\uc561\ud2b8\uac00 \ub370\uc774\ud130\uc758 \ubcc0\uacbd \uc2dc\uc810\uc744 \ubaa8\ub974\uae30 \ub54c\ubb38\uc774\ub2e4."},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\ub54c\ub85c\ub294 \ub370\uc774\ud130\uac00 \ubcc0\uacbd\ub418\uc9c0 \uc54a\uc544\ub3c4 \ub80c\ub354 \ud568\uc218\uac00 \ud638\ucd9c\ub3fc\uc11c \uc131\ub2a5\uc5d0 \ubd80\uc815\uc801\uc778 \uc601\ud5a5\uc744 \uc900\ub2e4."},{type:y.NewLine,data:"8px"},{type:y.Text,data:"\ub2e4\uc74c \uc911 \uc774\ub97c \ud574\uacb0\ud558\uae30 \uc704\ud55c \ubc29\ubc95\uc774 \uc544\ub2cc \uac83\uc740?"},{type:y.OptionPass,data:"\ud074\ub798\uc2a4\ud615 \ucef4\ud3ec\ub10c\ud2b8\ub97c \ub9ac\uc561\ud2b8 \ud6c5\uc73c\ub85c \ubcc0\uacbd\ud558\uae30"},{type:y.OptionFail,data:"shouldComponentUpdate \ub610\ub294 React.memo \uc0ac\uc6a9\ud558\uae30"},{type:y.OptionFail,data:"\ub80c\ub354 \ud568\uc218\uc5d0\uc11c \uc0c8\ub85c\uc6b4 \uac1d\uccb4, \ubc30\uc5f4, \ud568\uc218 \uc0dd\uc131\ud558\uc9c0 \uc54a\uae30"}]],q=[{quizIndex:3,thinkTexts:["babel\uacfc polyfill\uc740 \uc8fc\ub85c \uc624\ub798\ub41c \ube0c\ub77c\uc6b0\uc800\uc5d0\uc11c \ucd5c\uc2e0 \ubb38\ubc95\uc744 \uc0ac\uc6a9\ud558\uae30 \uc704\ud55c \uc6a9\ub3c4\ub85c \uc4f0\uc778\ub2e4.","\uadf8\ub807\ub2e4\uba74 \ub458\uc758 \ucc28\uc774\uc810\uc740 \ubb34\uc5c7\uc77c\uae4c?"],hintTexts:["babel\uacfc polyfill\uc774 \uc2e4\ud589\ub418\ub294 \uc2dc\uc810\uc740 \uac01\uac01 \uc5b8\uc81c\uc778\uac00?"]},{quizIndex:6,thinkTexts:["\ub9ac\ub355\uc2a4\uc640 \ucef4\ud3ec\ub10c\ud2b8 state\ub294 \ubd88\ubcc0 \uac1d\uccb4\ub85c \uad00\ub9ac\ud558\ub77c\ub294 \uc598\uae30\uc744 \ub9ce\uc774 \ud55c\ub2e4.","\uadf8 \uc774\uc720\ub97c \ub9ac\uc561\ud2b8\uc758 \ub80c\ub354\ub9c1 \uc131\ub2a5 \uce21\uba74\uc5d0\uc11c \uc124\uba85\ud574\ubcf4\uc790."],hintTexts:["shouldComponentUpdate \ub610\ub294 React.memo\uc758 \uc5ed\ud560\uc744 \uc0dd\uac01\ud574\ubcf4\uc790."]}],H=function(){var e=Object(n.useState)(0),t=Object(p.a)(e,2),a=t[0],r=t[1],i=Object(n.useState)(0),l=Object(p.a)(i,2),d=l[0],u=l[1],s=Object(n.useState)(null),x=Object(p.a)(s,2),y=x[0],h=x[1],b=Object(n.useState)(!1),w=Object(p.a)(b,2),g=w[0],O=w[1],C=Object(n.useState)(!0),E=Object(p.a)(C,2),v=E[0],S=E[1],L=Object(n.useState)(0),j=Object(p.a)(L,2),F=j[0],k=j[1],N=Object(n.useRef)(null);function R(){k(F+1),r(0),u(0)}function M(){S(!1),O(!0),setTimeout(function(){S(!0)},1),setTimeout(function(){O(!1),r(a+1)},f);var e=q.find(function(e){return e.quizIndex===a+1});e&&h(e)}function z(e){if(N.current){var t=N.current.getBoundingClientRect(),a=t.left+t.width/2-40,n=t.top+t.height/2-3;B({x:a,y:n}),e||u(d+1)}}return Object(n.useEffect)(function(){z(!0)},[]),o.a.createElement(I,{key:F},o.a.createElement(c.Flex,{p:"20px",justifyContent:"space-between",fontSize:"20px"},o.a.createElement(c.Text,{flex:"1 0"},"\ub9ac\uc561\ud2b8 \ud034\uc988 ",1+Math.floor(a/3),"-",a%3+1),o.a.createElement(c.Text,{ref:N,flex:"0 0 auto",textAlign:"right"},d," / 9")),Y.map(function(e,t){return(a===t-1&&g||a===t)&&o.a.createElement(_,{key:t,show:a===t-1&&v||a===t,onFail:R,onNext:M,increaseStar:z,data:e})}),o.a.createElement(T,null),o.a.createElement(P,{isOpen:!!y,onRequestClose:function(){return h(null)},contentStyle:{margin:"10vh auto",height:"80vh",maxWidth:"".concat(m-60,"px"),top:0,right:"5vw",left:"5vw",bottom:void 0,boxSizing:"border-box",textAlign:"center"}},o.a.createElement(D,{data:y,onClose:function(){return h(null)}})))};i.a.render(o.a.createElement(H,null),document.getElementById("root"))}},[[26,1,2]]]);
//# sourceMappingURL=main.254659ca.chunk.js.map