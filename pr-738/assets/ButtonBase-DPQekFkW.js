import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{$ as i,A as a,Y as o,a as s,ct as c,et as l,ft as u,k as d,mt as f,nt as p,p as m,q as h,r as g,rt as _,s as v,st as y,t as b}from"./DefaultPropsProvider-BrOASIGE.js";import{r as ee,t as x}from"./useForkRef-CQ_aSVtl.js";function S(e){let t=C.useRef(e);return o(()=>{t.current=e}),C.useRef((...e)=>(0,t.current)(...e)).current}var C,w=t((()=>{C=e(n(),1),h()})),T=t((()=>{w()})),E,te=t((()=>{x(),E=ee}));function ne(e){try{return e.matches(`:focus-visible`)}catch{}return!1}var re=t((()=>{})),D=t((()=>{re()})),O,k=t((()=>{T(),O=S}));function ie(e){let{focusableWhenDisabled:t,disabled:n,composite:r=!1,tabIndex:i=0,isNativeButton:a}=e,o=r&&t!==!1,s=r&&t===!1;return ae.useMemo(()=>{let e={onKeyDown(e){n&&t&&e.key!==`Tab`&&e.preventDefault()}};return r||(e.tabIndex=i,!a&&n&&(e.tabIndex=t?i:-1)),(a&&(t||o)||!a&&n)&&(e[`aria-disabled`]=n),a&&(!t||s)&&(e.disabled=n),e},[r,n,t,o,s,a,i])}var ae,oe=t((()=>{ae=e(n(),1)}));function se(e){let{nativeButton:t,nativeButtonProp:n,internalNativeButton:r=t,allowInferredHostMismatch:i=!1,disabled:a,type:o,hasFormAction:s=!1,tabIndex:c=0,focusableWhenDisabled:l,stopEventPropagation:u=!1,onBeforeKeyDown:d,onBeforeKeyUp:f}=e,p=A.useRef(null),m=l===!0,h=ie({focusableWhenDisabled:m,disabled:a,isNativeButton:t,tabIndex:c}),g=A.useCallback(()=>{let e=p.current;return e==null?t:e.tagName===`BUTTON`?!0:!!(e.tagName===`A`&&e.href)},[t]),_=A.useMemo(()=>{let e=m?{}:{tabIndex:a?-1:c};return t?(e.type=o===void 0&&!s?`button`:o,m||(e.disabled=a)):(e.role=`button`,!m&&a&&(e[`aria-disabled`]=a)),m?{...e,...h}:e},[a,m,h,s,t,c,o]);return{getButtonProps:A.useCallback((e=ce)=>{let{onClick:t,onKeyDown:n,onKeyUp:r,...i}=e,o=e=>{if(u&&e.stopPropagation(),a){e.preventDefault();return}t?.(e)},s=e=>{if(m&&h.onKeyDown(e),!a&&(d?.(e),n?.(e),!(e.target!==e.currentTarget||g()))){if(e.key===` `){e.preventDefault();return}e.key===`Enter`&&(e.preventDefault(),e.currentTarget.click())}},c=e=>{a||(f?.(e),r?.(e),e.target===e.currentTarget&&!g()&&e.key===` `&&!e.defaultPrevented&&e.currentTarget.click())};return{..._,...i,onClick:o,onKeyDown:s,onKeyUp:c}},[_,a,m,h,g,d,f,u]),rootRef:p}}var A,ce,le=t((()=>{A=e(n(),1),oe(),ce={}}));function j(e,t){let n=M.useRef(N);return n.current===N&&(n.current=e(t)),n}var M,N,P=t((()=>{M=e(n(),1),N={}})),F=t((()=>{P()}));function ue(){return L.use()}function de(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}var I,L,fe=t((()=>{I=e(n(),1),F(),L=class e{static create(){return new e}static use(){let t=j(e.create).current,[n,r]=I.useState(!1);return t.shouldMount=n,t.setShouldMount=r,I.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=de(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}}})),R=t((()=>{fe()}));function z(e){pe.useEffect(e,me)}var pe,me,he=t((()=>{pe=e(n(),1),me=[]})),B=t((()=>{he()}));function V(){let e=j(H.create).current;return z(e.disposeEffect),e}var H,ge=t((()=>{P(),he(),H=class e{static create(){return new e}currentId=null;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=null,t()},e)}clear=()=>{this.currentId!==null&&(clearTimeout(this.currentId),this.currentId=null)};disposeEffect=()=>this.clear}})),U=t((()=>{ge()}));function _e(e){let{className:t,classes:n,pulsate:r=!1,rippleX:i,rippleY:a,rippleSize:o,in:s,onExited:c,timeout:l}=e,[u,d]=W.useState(!1),f=V(),p=W.useRef(!1),m=W.useRef(c);m.current=c;let h=c!=null,g=y(t,n.ripple,n.rippleVisible,r&&n.ripplePulsate),_={width:o,height:o,top:-(o/2)+a,left:-(o/2)+i},v=y(n.child,u&&n.childLeaving,r&&n.childPulsate);return!s&&!u&&d(!0),W.useEffect(()=>{!s&&h?p.current||(p.current=!0,f.start(l,()=>{p.current=!1,m.current?.()})):(p.current=!1,f.clear())},[f,h,s,l]),(0,G.jsx)(`span`,{className:g,style:_,children:(0,G.jsx)(`span`,{className:v})})}var W,G,ve=t((()=>{W=e(n(),1),c(),U(),G=r()})),K,q=t((()=>{i(),K=l(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`])}));function ye(e){let[t,n]=J.useState(()=>({enabled:e,matches:e?null:!1})),r=t.matches;return t.enabled!==e&&(r=null,e||(r=!1)),o(()=>{let r=t=>{n(n=>n.enabled===e&&n.matches===t?n:{enabled:e,matches:t})};if(!e){t.enabled&&r(!1);return}if(typeof window>`u`||typeof window.matchMedia!=`function`){r(!1);return}let i=window.matchMedia(Se),a=()=>{r(i.matches)};return a(),i.addEventListener(`change`,a),()=>{i.removeEventListener(`change`,a)}},[e,t.enabled]),r}function be(e){let t=e?Ee:Te,[n,r]=J.useMemo(()=>{if(!e||typeof window>`u`||typeof window.matchMedia!=`function`)return[Te,De];let t=window.matchMedia(Se);return[()=>t.matches,e=>(t.addEventListener(`change`,e),()=>{t.removeEventListener(`change`,e)})]},[e]);return Oe(r,n,t)}function xe(e,t){let n=ke(!t&&e===`system`),r=!t&&(e===`always`||e===`system`&&n!==!1);return J.useMemo(()=>({shouldReduceMotion:r,getTransitionTiming(e){return r?{duration:Y,delay:Ce}:e}}),[r])}var J,Se,Y,Ce,we,Te,Ee,De,Oe,ke,Ae=t((()=>{J=e(n(),1),h(),Se=`(prefers-reduced-motion: reduce)`,Y=0,Ce=`0ms`,we=()=>{},Te=()=>!1,Ee=()=>!0,De=()=>we,Oe={...J}.useSyncExternalStore,ke=Oe===void 0?ye:be}));function je(e,t){let n=new Set(t),r=new Map,i=[];for(let t of e)n.has(t)?i.length>0&&(r.set(t,i),i=[]):i.push(t);let a=[];for(let e of t){let t=r.get(e);t&&a.push(...t),a.push(e)}return a.push(...i),a}function Me({event:e,element:t,center:n}){let r=t?t.getBoundingClientRect():{width:0,height:0,left:0,top:0},i,a;if(n||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)i=Math.round(r.width/2),a=Math.round(r.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;i=Math.round(t-r.left),a=Math.round(n-r.top)}let o;if(n)o=Math.sqrt((2*r.width**2+r.height**2)/3),o%2==0&&(o+=1);else{let e=Math.max(Math.abs((t?t.clientWidth:0)-i),i)*2+2,n=Math.max(Math.abs((t?t.clientHeight:0)-a),a)*2+2;o=Math.sqrt(e**2+n**2)}return{rippleX:i,rippleY:a,rippleSize:o}}function Ne(e){if(e.motion.reducedMotion===`always`)return null;let t=u`
    &.${K.rippleVisible} {
      animation-name: ${Re};
      animation-duration: ${Fe}ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
    }

    &.${K.ripplePulsate} {
      animation-duration: ${e.transitions.duration.shorter}ms;
    }

    & .${K.childLeaving} {
      animation-name: ${ze};
      animation-duration: ${Fe}ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
    }

    & .${K.childPulsate} {
      animation-name: ${Be};
      animation-duration: 2500ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
      animation-iteration-count: infinite;
      animation-delay: 200ms;
    }
  `;return e.motion.reducedMotion===`system`?u`
      @media (prefers-reduced-motion: no-preference) {
        ${t}
      }
    `:t}var X,Pe,Fe,Z,Ie,Le,Re,ze,Be,Ve,He,Ue,We=t((()=>{X=e(n(),1),c(),B(),U(),s(),b(),ve(),q(),k(),Ae(),Pe=r(),Fe=550,Z={},Ie=[],Le=()=>{},Re=f`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,ze=f`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,Be=f`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,Ve=v(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),He=v(_e,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${K.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
  }

  /*
   * Order matters: 'child', 'childLeaving' and 'childPulsate' apply to the same
   * element with equal specificity, so the later rule wins. 'child' must come
   * before 'childLeaving' so the leaving 'opacity: 0' takes precedence. A focus
   * (pulsate) ripple keeps 'pulsateKeyframe' (no opacity animation) on exit, so
   * it relies on this static 'opacity: 0' to disappear on blur instead of
   * lingering until removal.
   */
  & .${K.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${K.childLeaving} {
    opacity: 0;
  }

  & .${K.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
  }

  ${({theme:e})=>Ne(e)}
`,Ue=X.forwardRef(function(e,t){let n=g({props:e,name:`MuiTouchRipple`}),r=xe(m().motion.reducedMotion,!1),{center:i=!1,classes:a=Z,className:o,...s}=n,[c,l]=X.useState({items:Ie,order:Ie}),u=c.items,d=X.useRef(0),f=X.useRef(null),p=X.useRef(!1);z(()=>(p.current=!0,()=>{p.current=!1})),X.useEffect(()=>{f.current&&=(f.current(),null)},[u]);let h=X.useRef(!1),_=V(),v=X.useRef(null),b=X.useRef(null),ee=O(e=>{p.current&&l(t=>{let n=t.items.filter(t=>t.key!==e);return{items:n,order:je(t.order.filter(t=>t!==e),n.filter(e=>!e.exiting).map(e=>e.key))}})}),x=O(e=>{let{pulsate:t,rippleX:n,rippleY:r,rippleSize:i,cb:a}=e,o=d.current;d.current+=1,l(e=>{let a=[...e.items,{key:o,pulsate:t,rippleX:n,rippleY:r,rippleSize:i,exiting:!1}];return{items:a,order:je(e.order,a.filter(e=>!e.exiting).map(e=>e.key))}}),f.current=a}),S=O((e=Z,t=Z,n=Le)=>{let{pulsate:r=!1,center:a=i||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&h.current){h.current=!1;return}e?.type===`touchstart`&&(h.current=!0);let{rippleX:s,rippleY:c,rippleSize:l}=Me({event:e,element:o?null:b.current,center:a});e?.touches?v.current===null&&(v.current=()=>{x({pulsate:r,rippleX:s,rippleY:c,rippleSize:l,cb:n})},_.start(80,()=>{v.current&&=(v.current(),null)})):x({pulsate:r,rippleX:s,rippleY:c,rippleSize:l,cb:n})}),C=O(()=>{S(Z,{pulsate:!0})}),w=O((e,t)=>{if(_.clear(),e?.type===`touchend`&&v.current){v.current(),v.current=null,_.start(0,()=>{w(e,t)});return}v.current=null,l(e=>{let t=e.items.findIndex(e=>!e.exiting);if(t===-1)return e;let n=e.items.slice();return n[t]={...n[t],exiting:!0},{items:n,order:je(e.order,n.filter(e=>!e.exiting).map(e=>e.key))}}),f.current=t});X.useImperativeHandle(t,()=>({pulsate:C,start:S,stop:w}),[C,S,w]);let T=new Map(u.map(e=>[e.key,e])),E=c.order.map(e=>T.get(e)).filter(Boolean);return(0,Pe.jsx)(Ve,{className:y(K.root,a.root,o),ref:b,...s,children:E.map(e=>(0,Pe.jsx)(He,{classes:{ripple:y(a.ripple,K.ripple),rippleVisible:y(a.rippleVisible,K.rippleVisible),ripplePulsate:y(a.ripplePulsate,K.ripplePulsate),child:y(a.child,K.child),childLeaving:y(a.childLeaving,K.childLeaving),childPulsate:y(a.childPulsate,K.childPulsate)},timeout:r.shouldReduceMotion?0:Fe,pulsate:e.pulsate,rippleX:e.rippleX,rippleY:e.rippleY,rippleSize:e.rippleSize,in:!e.exiting,onExited:()=>ee(e.key)},e.key))})})}));function Ge(e){return _(`MuiButtonBase`,e)}var Ke,qe=t((()=>{i(),p(),Ke=l(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`])}));function Q(e,t,n,r=!1){return O(i=>(n&&n(i),r||e[t](i),!0))}var $,Je,Ye,Xe,Ze,Qe=t((()=>{$=e(n(),1),c(),d(),D(),s(),b(),te(),k(),le(),R(),We(),qe(),Je=r(),Ye=e=>{let{disabled:t,focusVisible:n,focusVisibleClassName:r,suppressFocusVisible:i,classes:o}=e,s=a({root:[`root`,t&&`disabled`,n&&!i&&`focusVisible`]},Ge,o);return n&&!i&&r&&(s.root+=` ${r}`),s},Xe=v(`button`,{name:`MuiButtonBase`,slot:`Root`})({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${Ke.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`}}),Ze=$.forwardRef(function(e,t){let n=g({props:e,name:`MuiButtonBase`}),{action:r,centerRipple:i=!1,children:a,className:o,component:s=`button`,disabled:c=!1,disableRipple:l=!1,disableTouchRipple:u=!1,focusRipple:d=!1,focusVisibleClassName:f,focusableWhenDisabled:p,suppressFocusVisible:m=!1,internalNativeButton:h,LinkComponent:_=`a`,nativeButton:v,onBlur:b,onClick:ee,onContextMenu:x,onDragLeave:S,onFocus:C,onFocusVisible:w,onKeyDown:T,onKeyUp:te,onMouseDown:re,onMouseLeave:D,onMouseUp:k,onTouchEnd:ie,onTouchMove:ae,onTouchStart:oe,tabIndex:A=0,TouchRippleProps:ce,touchRippleRef:le,type:j,...M}=n,N=!!(M.href||M.to),P=!!M.formAction,F=s;F===`button`&&N&&(F=_);let de=typeof F==`string`?F===`button`:h??!1,I=v??de,L=ue(),fe=E(L.ref,le),[R,z]=$.useState(!1);(c||m)&&R&&z(!1);let pe=O(e=>{d&&!e.repeat&&R&&e.key===` `&&L.stop(e,()=>{L.start(e)})}),me=O(e=>{d&&e.key===` `&&R&&!e.defaultPrevented&&L.stop(e,()=>{L.pulsate(e)})}),{getButtonProps:he,rootRef:B}=se({nativeButton:I,nativeButtonProp:v,internalNativeButton:de,allowInferredHostMismatch:N||typeof F==`string`,disabled:c,type:j,hasFormAction:P,tabIndex:A,onBeforeKeyDown:pe,onBeforeKeyUp:me}),{onClick:V,onKeyDown:H,onKeyUp:ge,...U}=he({onClick:ee,onKeyDown:T,onKeyUp:te});$.useImperativeHandle(r,()=>({focusVisible:()=>{z(!0),B.current.focus()}}),[B]);let _e=L.shouldMount&&!l&&!c;$.useEffect(()=>{R&&d&&!l&&L.pulsate()},[l,d,R,L]);let W=Q(L,`start`,re,u),G=Q(L,`stop`,x,u),ve=Q(L,`stop`,S,u),K=Q(L,`stop`,k,u),q=Q(L,`stop`,e=>{R&&e.preventDefault(),D&&D(e)},u),ye=Q(L,`start`,oe,u),be=Q(L,`stop`,ie,u),xe=Q(L,`stop`,ae,u),J=Q(L,`stop`,e=>{ne(e.target)||z(!1),b&&b(e)},!1),Se=O(e=>{B.current||=e.currentTarget,!m&&ne(e.target)&&(z(!0),w&&w(e)),C&&C(e)}),Y={};N&&(Y.tabIndex=c?-1:A,c&&(Y[`aria-disabled`]=c),Y.type=j);let Ce=E(t,B),we={...n,centerRipple:i,component:s,disabled:c,disableRipple:l,disableTouchRipple:u,focusRipple:d,suppressFocusVisible:m,tabIndex:A,focusVisible:R},Te=Ye(we);return(0,Je.jsxs)(Xe,{as:F,className:y(Te.root,o),ownerState:we,onBlur:J,onClick:V,onContextMenu:G,onFocus:Se,onKeyDown:H,onKeyUp:ge,onMouseDown:W,onMouseLeave:q,onMouseUp:K,onDragLeave:ve,onTouchEnd:be,onTouchMove:xe,onTouchStart:ye,ref:Ce,...N?Y:U,...M,children:[a,_e?(0,Je.jsx)(Ue,{ref:fe,center:i,...ce}):null]})})})),$e=t((()=>{Qe(),qe(),qe(),q(),q()}));export{te as _,xe as a,w as b,ge as c,j as d,k as f,ne as g,re as h,Ae as i,V as l,D as m,Ze as n,U as o,O as p,Qe as r,H as s,$e as t,P as u,E as v,S as x,T as y};