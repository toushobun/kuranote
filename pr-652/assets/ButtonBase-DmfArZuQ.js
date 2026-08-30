import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{$ as i,A as a,Y as o,a as s,ct as c,et as l,ft as u,k as d,mt as f,nt as p,p as m,q as h,r as g,rt as _,s as v,st as y,t as b}from"./DefaultPropsProvider-BrOASIGE.js";function x(...e){let t=S.useRef(void 0),n=S.useCallback(t=>{let n=e.map(e=>{if(e==null)return null;if(typeof e==`function`){let n=e,r=n(t);return typeof r==`function`?r:()=>{n(null)}}return e.current=t,()=>{e.current=null}});return()=>{n.forEach(e=>e?.())}},e);return S.useMemo(()=>e.every(e=>e==null)?null:e=>{t.current&&=(t.current(),void 0),e!=null&&(t.current=n(e))},e)}var S,C=t((()=>{S=e(n(),1)})),w=t((()=>{C()}));function T(e){let t=E.useRef(e);return o(()=>{t.current=e}),E.useRef((...e)=>(0,t.current)(...e)).current}var E,D=t((()=>{E=e(n(),1),h()})),ee=t((()=>{D()})),O,k=t((()=>{w(),O=x}));function te(e){try{return e.matches(`:focus-visible`)}catch{}return!1}var ne=t((()=>{})),re=t((()=>{ne()})),A,ie=t((()=>{ee(),A=T}));function ae(e){let{focusableWhenDisabled:t,disabled:n,composite:r=!1,tabIndex:i=0,isNativeButton:a}=e,o=r&&t!==!1,s=r&&t===!1;return j.useMemo(()=>{let e={onKeyDown(e){n&&t&&e.key!==`Tab`&&e.preventDefault()}};return r||(e.tabIndex=i,!a&&n&&(e.tabIndex=t?i:-1)),(a&&(t||o)||!a&&n)&&(e[`aria-disabled`]=n),a&&(!t||s)&&(e.disabled=n),e},[r,n,t,o,s,a,i])}var j,oe=t((()=>{j=e(n(),1)}));function se(e){let{nativeButton:t,nativeButtonProp:n,internalNativeButton:r=t,allowInferredHostMismatch:i=!1,disabled:a,type:o,hasFormAction:s=!1,tabIndex:c=0,focusableWhenDisabled:l,stopEventPropagation:u=!1,onBeforeKeyDown:d,onBeforeKeyUp:f}=e,p=M.useRef(null),m=l===!0,h=ae({focusableWhenDisabled:m,disabled:a,isNativeButton:t,tabIndex:c}),g=M.useCallback(()=>{let e=p.current;return e==null?t:e.tagName===`BUTTON`?!0:!!(e.tagName===`A`&&e.href)},[t]),_=M.useMemo(()=>{let e=m?{}:{tabIndex:a?-1:c};return t?(e.type=o===void 0&&!s?`button`:o,m||(e.disabled=a)):(e.role=`button`,!m&&a&&(e[`aria-disabled`]=a)),m?{...e,...h}:e},[a,m,h,s,t,c,o]);return{getButtonProps:M.useCallback((e=N)=>{let{onClick:t,onKeyDown:n,onKeyUp:r,...i}=e,o=e=>{if(u&&e.stopPropagation(),a){e.preventDefault();return}t?.(e)},s=e=>{if(m&&h.onKeyDown(e),!a&&(d?.(e),n?.(e),!(e.target!==e.currentTarget||g()))){if(e.key===` `){e.preventDefault();return}e.key===`Enter`&&(e.preventDefault(),e.currentTarget.click())}},c=e=>{a||(f?.(e),r?.(e),e.target===e.currentTarget&&!g()&&e.key===` `&&!e.defaultPrevented&&e.currentTarget.click())};return{..._,...i,onClick:o,onKeyDown:s,onKeyUp:c}},[_,a,m,h,g,d,f,u]),rootRef:p}}var M,N,P=t((()=>{M=e(n(),1),oe(),N={}}));function F(e,t){let n=ce.useRef(I);return n.current===I&&(n.current=e(t)),n}var ce,I,L=t((()=>{ce=e(n(),1),I={}})),le=t((()=>{L()}));function ue(){return B.use()}function R(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}var z,B,V=t((()=>{z=e(n(),1),le(),B=class e{static create(){return new e}static use(){let t=F(e.create).current,[n,r]=z.useState(!1);return t.shouldMount=n,t.setShouldMount=r,z.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=R(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}}})),de=t((()=>{V()}));function fe(e){pe.useEffect(e,H)}var pe,H,me=t((()=>{pe=e(n(),1),H=[]})),he=t((()=>{me()}));function U(){let e=F(W.create).current;return fe(e.disposeEffect),e}var W,ge=t((()=>{L(),me(),W=class e{static create(){return new e}currentId=null;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=null,t()},e)}clear=()=>{this.currentId!==null&&(clearTimeout(this.currentId),this.currentId=null)};disposeEffect=()=>this.clear}})),G=t((()=>{ge()}));function _e(e){let{className:t,classes:n,pulsate:r=!1,rippleX:i,rippleY:a,rippleSize:o,in:s,onExited:c,timeout:l}=e,[u,d]=K.useState(!1),f=U(),p=K.useRef(!1),m=K.useRef(c);m.current=c;let h=c!=null,g=y(t,n.ripple,n.rippleVisible,r&&n.ripplePulsate),_={width:o,height:o,top:-(o/2)+a,left:-(o/2)+i},v=y(n.child,u&&n.childLeaving,r&&n.childPulsate);return!s&&!u&&d(!0),K.useEffect(()=>{!s&&h?p.current||(p.current=!0,f.start(l,()=>{p.current=!1,m.current?.()})):(p.current=!1,f.clear())},[f,h,s,l]),(0,q.jsx)(`span`,{className:g,style:_,children:(0,q.jsx)(`span`,{className:v})})}var K,q,ve=t((()=>{K=e(n(),1),c(),G(),q=r()})),J,ye=t((()=>{i(),J=l(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`])}));function be(e){let[t,n]=Y.useState(()=>({enabled:e,matches:e?null:!1})),r=t.matches;return t.enabled!==e&&(r=null,e||(r=!1)),o(()=>{let r=t=>{n(n=>n.enabled===e&&n.matches===t?n:{enabled:e,matches:t})};if(!e){t.enabled&&r(!1);return}if(typeof window>`u`||typeof window.matchMedia!=`function`){r(!1);return}let i=window.matchMedia(Ce),a=()=>{r(i.matches)};return a(),i.addEventListener(`change`,a),()=>{i.removeEventListener(`change`,a)}},[e,t.enabled]),r}function xe(e){let t=e?Oe:De,[n,r]=Y.useMemo(()=>{if(!e||typeof window>`u`||typeof window.matchMedia!=`function`)return[De,ke];let t=window.matchMedia(Ce);return[()=>t.matches,e=>(t.addEventListener(`change`,e),()=>{t.removeEventListener(`change`,e)})]},[e]);return Ae(r,n,t)}function Se(e,t){let n=je(!t&&e===`system`),r=!t&&(e===`always`||e===`system`&&n!==!1);return Y.useMemo(()=>({shouldReduceMotion:r,getTransitionTiming(e){return r?{duration:we,delay:Te}:e}}),[r])}var Y,Ce,we,Te,Ee,De,Oe,ke,Ae,je,Me=t((()=>{Y=e(n(),1),h(),Ce=`(prefers-reduced-motion: reduce)`,we=0,Te=`0ms`,Ee=()=>{},De=()=>!1,Oe=()=>!0,ke=()=>Ee,Ae={...Y}.useSyncExternalStore,je=Ae===void 0?be:xe}));function Ne(e,t){let n=new Set(t),r=new Map,i=[];for(let t of e)n.has(t)?i.length>0&&(r.set(t,i),i=[]):i.push(t);let a=[];for(let e of t){let t=r.get(e);t&&a.push(...t),a.push(e)}return a.push(...i),a}function Pe({event:e,element:t,center:n}){let r=t?t.getBoundingClientRect():{width:0,height:0,left:0,top:0},i,a;if(n||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)i=Math.round(r.width/2),a=Math.round(r.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;i=Math.round(t-r.left),a=Math.round(n-r.top)}let o;if(n)o=Math.sqrt((2*r.width**2+r.height**2)/3),o%2==0&&(o+=1);else{let e=Math.max(Math.abs((t?t.clientWidth:0)-i),i)*2+2,n=Math.max(Math.abs((t?t.clientHeight:0)-a),a)*2+2;o=Math.sqrt(e**2+n**2)}return{rippleX:i,rippleY:a,rippleSize:o}}function Fe(e){if(e.motion.reducedMotion===`always`)return null;let t=u`
    &.${J.rippleVisible} {
      animation-name: ${Be};
      animation-duration: ${Le}ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
    }

    &.${J.ripplePulsate} {
      animation-duration: ${e.transitions.duration.shorter}ms;
    }

    & .${J.childLeaving} {
      animation-name: ${Ve};
      animation-duration: ${Le}ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
    }

    & .${J.childPulsate} {
      animation-name: ${He};
      animation-duration: 2500ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
      animation-iteration-count: infinite;
      animation-delay: 200ms;
    }
  `;return e.motion.reducedMotion===`system`?u`
      @media (prefers-reduced-motion: no-preference) {
        ${t}
      }
    `:t}var X,Ie,Le,Z,Re,ze,Be,Ve,He,Ue,We,Ge,Ke=t((()=>{X=e(n(),1),c(),he(),G(),s(),b(),ve(),ye(),ie(),Me(),Ie=r(),Le=550,Z={},Re=[],ze=()=>{},Be=f`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,Ve=f`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,He=f`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,Ue=v(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),We=v(_e,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${J.rippleVisible} {
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
  & .${J.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${J.childLeaving} {
    opacity: 0;
  }

  & .${J.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
  }

  ${({theme:e})=>Fe(e)}
`,Ge=X.forwardRef(function(e,t){let n=g({props:e,name:`MuiTouchRipple`}),r=Se(m().motion.reducedMotion,!1),{center:i=!1,classes:a=Z,className:o,...s}=n,[c,l]=X.useState({items:Re,order:Re}),u=c.items,d=X.useRef(0),f=X.useRef(null),p=X.useRef(!1);fe(()=>(p.current=!0,()=>{p.current=!1})),X.useEffect(()=>{f.current&&=(f.current(),null)},[u]);let h=X.useRef(!1),_=U(),v=X.useRef(null),b=X.useRef(null),x=A(e=>{p.current&&l(t=>{let n=t.items.filter(t=>t.key!==e);return{items:n,order:Ne(t.order.filter(t=>t!==e),n.filter(e=>!e.exiting).map(e=>e.key))}})}),S=A(e=>{let{pulsate:t,rippleX:n,rippleY:r,rippleSize:i,cb:a}=e,o=d.current;d.current+=1,l(e=>{let a=[...e.items,{key:o,pulsate:t,rippleX:n,rippleY:r,rippleSize:i,exiting:!1}];return{items:a,order:Ne(e.order,a.filter(e=>!e.exiting).map(e=>e.key))}}),f.current=a}),C=A((e=Z,t=Z,n=ze)=>{let{pulsate:r=!1,center:a=i||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&h.current){h.current=!1;return}e?.type===`touchstart`&&(h.current=!0);let{rippleX:s,rippleY:c,rippleSize:l}=Pe({event:e,element:o?null:b.current,center:a});e?.touches?v.current===null&&(v.current=()=>{S({pulsate:r,rippleX:s,rippleY:c,rippleSize:l,cb:n})},_.start(80,()=>{v.current&&=(v.current(),null)})):S({pulsate:r,rippleX:s,rippleY:c,rippleSize:l,cb:n})}),w=A(()=>{C(Z,{pulsate:!0})}),T=A((e,t)=>{if(_.clear(),e?.type===`touchend`&&v.current){v.current(),v.current=null,_.start(0,()=>{T(e,t)});return}v.current=null,l(e=>{let t=e.items.findIndex(e=>!e.exiting);if(t===-1)return e;let n=e.items.slice();return n[t]={...n[t],exiting:!0},{items:n,order:Ne(e.order,n.filter(e=>!e.exiting).map(e=>e.key))}}),f.current=t});X.useImperativeHandle(t,()=>({pulsate:w,start:C,stop:T}),[w,C,T]);let E=new Map(u.map(e=>[e.key,e])),D=c.order.map(e=>E.get(e)).filter(Boolean);return(0,Ie.jsx)(Ue,{className:y(J.root,a.root,o),ref:b,...s,children:D.map(e=>(0,Ie.jsx)(We,{classes:{ripple:y(a.ripple,J.ripple),rippleVisible:y(a.rippleVisible,J.rippleVisible),ripplePulsate:y(a.ripplePulsate,J.ripplePulsate),child:y(a.child,J.child),childLeaving:y(a.childLeaving,J.childLeaving),childPulsate:y(a.childPulsate,J.childPulsate)},timeout:r.shouldReduceMotion?0:Le,pulsate:e.pulsate,rippleX:e.rippleX,rippleY:e.rippleY,rippleSize:e.rippleSize,in:!e.exiting,onExited:()=>x(e.key)},e.key))})})}));function qe(e){return _(`MuiButtonBase`,e)}var Je,Ye=t((()=>{i(),p(),Je=l(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`])}));function Q(e,t,n,r=!1){return A(i=>(n&&n(i),r||e[t](i),!0))}var $,Xe,Ze,Qe,$e,et=t((()=>{$=e(n(),1),c(),d(),re(),s(),b(),k(),ie(),P(),de(),Ke(),Ye(),Xe=r(),Ze=e=>{let{disabled:t,focusVisible:n,focusVisibleClassName:r,suppressFocusVisible:i,classes:o}=e,s=a({root:[`root`,t&&`disabled`,n&&!i&&`focusVisible`]},qe,o);return n&&!i&&r&&(s.root+=` ${r}`),s},Qe=v(`button`,{name:`MuiButtonBase`,slot:`Root`})({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${Je.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`}}),$e=$.forwardRef(function(e,t){let n=g({props:e,name:`MuiButtonBase`}),{action:r,centerRipple:i=!1,children:a,className:o,component:s=`button`,disabled:c=!1,disableRipple:l=!1,disableTouchRipple:u=!1,focusRipple:d=!1,focusVisibleClassName:f,focusableWhenDisabled:p,suppressFocusVisible:m=!1,internalNativeButton:h,LinkComponent:_=`a`,nativeButton:v,onBlur:b,onClick:x,onContextMenu:S,onDragLeave:C,onFocus:w,onFocusVisible:T,onKeyDown:E,onKeyUp:D,onMouseDown:ee,onMouseLeave:k,onMouseUp:ne,onTouchEnd:re,onTouchMove:ie,onTouchStart:ae,tabIndex:j=0,TouchRippleProps:oe,touchRippleRef:M,type:N,...P}=n,F=!!(P.href||P.to),ce=!!P.formAction,I=s;I===`button`&&F&&(I=_);let L=typeof I==`string`?I===`button`:h??!1,le=v??L,R=ue(),z=O(R.ref,M),[B,V]=$.useState(!1);(c||m)&&B&&V(!1);let de=A(e=>{d&&!e.repeat&&B&&e.key===` `&&R.stop(e,()=>{R.start(e)})}),fe=A(e=>{d&&e.key===` `&&B&&!e.defaultPrevented&&R.stop(e,()=>{R.pulsate(e)})}),{getButtonProps:pe,rootRef:H}=se({nativeButton:le,nativeButtonProp:v,internalNativeButton:L,allowInferredHostMismatch:F||typeof I==`string`,disabled:c,type:N,hasFormAction:ce,tabIndex:j,onBeforeKeyDown:de,onBeforeKeyUp:fe}),{onClick:me,onKeyDown:he,onKeyUp:U,...W}=pe({onClick:x,onKeyDown:E,onKeyUp:D});$.useImperativeHandle(r,()=>({focusVisible:()=>{V(!0),H.current.focus()}}),[H]);let ge=R.shouldMount&&!l&&!c;$.useEffect(()=>{B&&d&&!l&&R.pulsate()},[l,d,B,R]);let G=Q(R,`start`,ee,u),_e=Q(R,`stop`,S,u),K=Q(R,`stop`,C,u),q=Q(R,`stop`,ne,u),ve=Q(R,`stop`,e=>{B&&e.preventDefault(),k&&k(e)},u),J=Q(R,`start`,ae,u),ye=Q(R,`stop`,re,u),be=Q(R,`stop`,ie,u),xe=Q(R,`stop`,e=>{te(e.target)||V(!1),b&&b(e)},!1),Se=A(e=>{H.current||=e.currentTarget,!m&&te(e.target)&&(V(!0),T&&T(e)),w&&w(e)}),Y={};F&&(Y.tabIndex=c?-1:j,c&&(Y[`aria-disabled`]=c),Y.type=N);let Ce=O(t,H),we={...n,centerRipple:i,component:s,disabled:c,disableRipple:l,disableTouchRipple:u,focusRipple:d,suppressFocusVisible:m,tabIndex:j,focusVisible:B},Te=Ze(we);return(0,Xe.jsxs)(Qe,{as:I,className:y(Te.root,o),ownerState:we,onBlur:xe,onClick:me,onContextMenu:_e,onFocus:Se,onKeyDown:he,onKeyUp:U,onMouseDown:G,onMouseLeave:ve,onMouseUp:q,onDragLeave:K,onTouchEnd:ye,onTouchMove:be,onTouchStart:J,ref:Ce,...F?Y:W,...P,children:[a,ge?(0,Xe.jsx)(Ge,{ref:z,center:i,...oe}):null]})})})),tt=t((()=>{et(),Ye(),Ye(),ye(),ye()}));export{C,w as S,k as _,Se as a,D as b,ge as c,F as d,ie as f,te as g,ne as h,Me as i,U as l,re as m,$e as n,G as o,A as p,et as r,W as s,tt as t,L as u,O as v,x as w,T as x,ee as y};