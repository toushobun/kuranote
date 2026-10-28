import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{I as i,L as a,St as o,_t as s,a as c,ft as l,lt as u,m as d,pt as f,r as p,s as m,t as h,ut as g,vt as _,wt as v}from"./DefaultPropsProvider-BWoWYWbL.js";import{c as y,d as b,f as x,l as S,m as C,n as ee,o as te,p as w,r as T,s as E,t as D,u as ne}from"./useReducedMotion-CQDQnS_1.js";function O(e){try{return e.matches(`:focus-visible`)}catch{}return!1}var k=t((()=>{})),re=t((()=>{k()}));function ie(e){let{focusableWhenDisabled:t,disabled:n,composite:r=!1,tabIndex:i=0,isNativeButton:a}=e,o=r&&t!==!1,s=r&&t===!1;return ae.useMemo(()=>{let e={onKeyDown(e){n&&t&&e.key!==`Tab`&&e.preventDefault()}};return r||(e.tabIndex=i,!a&&n&&(e.tabIndex=t?i:-1)),(a&&(t||o)||!a&&n)&&(e[`aria-disabled`]=n),a&&(!t||s)&&(e.disabled=n),e},[r,n,t,o,s,a,i])}var ae,oe=t((()=>{ae=e(n(),1)}));function se(e){let{nativeButton:t,nativeButtonProp:n,internalNativeButton:r=t,allowInferredHostMismatch:i=!1,disabled:a,type:o,hasFormAction:s=!1,tabIndex:c=0,focusableWhenDisabled:l,stopEventPropagation:u=!1,onBeforeKeyDown:d,onBeforeKeyUp:f}=e,p=A.useRef(null),m=l===!0,h=ie({focusableWhenDisabled:m,disabled:a,isNativeButton:t,tabIndex:c}),g=A.useCallback(()=>{let e=p.current;return e==null?t:e.tagName===`BUTTON`?!0:!!(e.tagName===`A`&&e.href)},[t]),_=A.useMemo(()=>{let e=m?{}:{tabIndex:a?-1:c};return t?(e.type=o===void 0&&!s?`button`:o,m||(e.disabled=a)):(e.role=`button`,!m&&a&&(e[`aria-disabled`]=a)),m?{...e,...h}:e},[a,m,h,s,t,c,o]);return{getButtonProps:A.useCallback((e=j)=>{let{onClick:t,onKeyDown:n,onKeyUp:r,...i}=e,o=e=>{if(u&&e.stopPropagation(),a){e.preventDefault();return}t?.(e)},s=e=>{if(m&&h.onKeyDown(e),!a&&(d?.(e),n?.(e),!(e.target!==e.currentTarget||g()))){if(e.key===` `){e.preventDefault();return}e.key===`Enter`&&(e.preventDefault(),e.currentTarget.click())}},c=e=>{a||(f?.(e),r?.(e),e.target===e.currentTarget&&!g()&&e.key===` `&&!e.defaultPrevented&&e.currentTarget.click())};return{..._,...i,onClick:o,onKeyDown:s,onKeyUp:c}},[_,a,m,h,g,d,f,u]),rootRef:p}}var A,j,ce=t((()=>{A=e(n(),1),oe(),j={}})),M=t((()=>{S()}));function le(){return ue.use()}function N(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}var P,ue,F=t((()=>{P=e(n(),1),M(),ue=class e{static create(){return new e}static use(){let t=ne(e.create).current,[n,r]=P.useState(!1);return t.shouldMount=n,t.setShouldMount=r,P.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=N(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}}})),I=t((()=>{F()})),de=t((()=>{E()}));function L(e){let{className:t,classes:n,pulsate:r=!1,rippleX:i,rippleY:a,rippleSize:o,in:c,onExited:l,timeout:u}=e,[d,f]=R.useState(!1),p=te(),m=R.useRef(!1),h=R.useRef(l);h.current=l;let g=l!=null,_=s(t,n.ripple,n.rippleVisible,r&&n.ripplePulsate),v={width:o,height:o,top:-(o/2)+a,left:-(o/2)+i},y=s(n.child,d&&n.childLeaving,r&&n.childPulsate);return!c&&!d&&f(!0),R.useEffect(()=>{!c&&g?m.current||(m.current=!0,p.start(u,()=>{m.current=!1,h.current?.()})):(m.current=!1,p.clear())},[p,g,c,u]),(0,z.jsx)(`span`,{className:_,style:v,children:(0,z.jsx)(`span`,{className:y})})}var R,z,B=t((()=>{R=e(n(),1),_(),T(),z=r()})),V,H=t((()=>{u(),V=g(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`])}));function U(e,t){let n=new Set(t),r=new Map,i=[];for(let t of e)n.has(t)?i.length>0&&(r.set(t,i),i=[]):i.push(t);let a=[];for(let e of t){let t=r.get(e);t&&a.push(...t),a.push(e)}return a.push(...i),a}function W({event:e,element:t,center:n}){let r=t?t.getBoundingClientRect():{width:0,height:0,left:0,top:0},i,a;if(n||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)i=Math.round(r.width/2),a=Math.round(r.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;i=Math.round(t-r.left),a=Math.round(n-r.top)}let o;if(n)o=Math.sqrt((2*r.width**2+r.height**2)/3),o%2==0&&(o+=1);else{let e=Math.max(Math.abs((t?t.clientWidth:0)-i),i)*2+2,n=Math.max(Math.abs((t?t.clientHeight:0)-a),a)*2+2;o=Math.sqrt(e**2+n**2)}return{rippleX:i,rippleY:a,rippleSize:o}}function fe(e){if(e.motion.reducedMotion===`always`)return null;let t=o`
    &.${V.rippleVisible} {
      animation-name: ${me};
      animation-duration: ${q}ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
    }

    &.${V.ripplePulsate} {
      animation-duration: ${e.transitions.duration.shorter}ms;
    }

    & .${V.childLeaving} {
      animation-name: ${he};
      animation-duration: ${q}ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
    }

    & .${V.childPulsate} {
      animation-name: ${ge};
      animation-duration: 2500ms;
      animation-timing-function: ${e.transitions.easing.easeInOut};
      animation-iteration-count: infinite;
      animation-delay: 200ms;
    }
  `;return e.motion.reducedMotion===`system`?o`
      @media (prefers-reduced-motion: no-preference) {
        ${t}
      }
    `:t}var G,K,q,J,Y,pe,me,he,ge,_e,ve,ye,be=t((()=>{G=e(n(),1),_(),de(),T(),c(),h(),B(),H(),b(),D(),K=r(),q=550,J={},Y=[],pe=()=>{},me=v`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,he=v`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,ge=v`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,_e=m(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),ve=m(L,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${V.rippleVisible} {
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
  & .${V.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${V.childLeaving} {
    opacity: 0;
  }

  & .${V.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
  }

  ${({theme:e})=>fe(e)}
`,ye=G.forwardRef(function(e,t){let n=p({props:e,name:`MuiTouchRipple`}),r=ee(d().motion.reducedMotion,!1),{center:i=!1,classes:a=J,className:o,...c}=n,[l,u]=G.useState({items:Y,order:Y}),f=l.items,m=G.useRef(0),h=G.useRef(null),g=G.useRef(!1);y(()=>(g.current=!0,()=>{g.current=!1})),G.useEffect(()=>{h.current&&=(h.current(),null)},[f]);let _=G.useRef(!1),v=te(),b=G.useRef(null),S=G.useRef(null),C=x(e=>{g.current&&u(t=>{let n=t.items.filter(t=>t.key!==e);return{items:n,order:U(t.order.filter(t=>t!==e),n.filter(e=>!e.exiting).map(e=>e.key))}})}),w=x(e=>{let{pulsate:t,rippleX:n,rippleY:r,rippleSize:i,cb:a}=e,o=m.current;m.current+=1,u(e=>{let a=[...e.items,{key:o,pulsate:t,rippleX:n,rippleY:r,rippleSize:i,exiting:!1}];return{items:a,order:U(e.order,a.filter(e=>!e.exiting).map(e=>e.key))}}),h.current=a}),T=x((e=J,t=J,n=pe)=>{let{pulsate:r=!1,center:a=i||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&_.current){_.current=!1;return}e?.type===`touchstart`&&(_.current=!0);let{rippleX:s,rippleY:c,rippleSize:l}=W({event:e,element:o?null:S.current,center:a});e?.touches?b.current===null&&(b.current=()=>{w({pulsate:r,rippleX:s,rippleY:c,rippleSize:l,cb:n})},v.start(80,()=>{b.current&&=(b.current(),null)})):w({pulsate:r,rippleX:s,rippleY:c,rippleSize:l,cb:n})}),E=x(()=>{T(J,{pulsate:!0})}),D=x((e,t)=>{if(v.clear(),e?.type===`touchend`&&b.current){b.current(),b.current=null,v.start(0,()=>{D(e,t)});return}b.current=null,u(e=>{let t=e.items.findIndex(e=>!e.exiting);if(t===-1)return e;let n=e.items.slice();return n[t]={...n[t],exiting:!0},{items:n,order:U(e.order,n.filter(e=>!e.exiting).map(e=>e.key))}}),h.current=t});G.useImperativeHandle(t,()=>({pulsate:E,start:T,stop:D}),[E,T,D]);let ne=new Map(f.map(e=>[e.key,e])),O=l.order.map(e=>ne.get(e)).filter(Boolean);return(0,K.jsx)(_e,{className:s(V.root,a.root,o),ref:S,...c,children:O.map(e=>(0,K.jsx)(ve,{classes:{ripple:s(a.ripple,V.ripple),rippleVisible:s(a.rippleVisible,V.rippleVisible),ripplePulsate:s(a.ripplePulsate,V.ripplePulsate),child:s(a.child,V.child),childLeaving:s(a.childLeaving,V.childLeaving),childPulsate:s(a.childPulsate,V.childPulsate)},timeout:r.shouldReduceMotion?0:q,pulsate:e.pulsate,rippleX:e.rippleX,rippleY:e.rippleY,rippleSize:e.rippleSize,in:!e.exiting,onExited:()=>C(e.key)},e.key))})})}));function xe(e){return f(`MuiButtonBase`,e)}var Se,X=t((()=>{u(),l(),Se=g(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`])}));function Z(e,t,n,r=!1){return x(i=>(n&&n(i),r||e[t](i),!0))}var Q,Ce,we,Te,Ee,$=t((()=>{Q=e(n(),1),_(),i(),re(),c(),h(),w(),b(),ce(),I(),be(),X(),Ce=r(),we=e=>{let{disabled:t,focusVisible:n,focusVisibleClassName:r,suppressFocusVisible:i,classes:o}=e,s=a({root:[`root`,t&&`disabled`,n&&!i&&`focusVisible`]},xe,o);return n&&!i&&r&&(s.root+=` ${r}`),s},Te=m(`button`,{name:`MuiButtonBase`,slot:`Root`})({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${Se.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`}}),Ee=Q.forwardRef(function(e,t){let n=p({props:e,name:`MuiButtonBase`}),{action:r,centerRipple:i=!1,children:a,className:o,component:c=`button`,disabled:l=!1,disableRipple:u=!1,disableTouchRipple:d=!1,focusRipple:f=!1,focusVisibleClassName:m,focusableWhenDisabled:h,suppressFocusVisible:g=!1,internalNativeButton:_,LinkComponent:v=`a`,nativeButton:y,onBlur:b,onClick:S,onContextMenu:ee,onDragLeave:te,onFocus:w,onFocusVisible:T,onKeyDown:E,onKeyUp:D,onMouseDown:ne,onMouseLeave:k,onMouseUp:re,onTouchEnd:ie,onTouchMove:ae,onTouchStart:oe,tabIndex:A=0,TouchRippleProps:j,touchRippleRef:ce,type:M,...N}=n,P=!!(N.href||N.to),ue=!!N.formAction,F=c;F===`button`&&P&&(F=v);let I=typeof F==`string`?F===`button`:_??!1,de=y??I,L=le(),R=C(L.ref,ce),[z,B]=Q.useState(!1);(l||g)&&z&&B(!1);let V=x(e=>{f&&!e.repeat&&z&&e.key===` `&&L.stop(e,()=>{L.start(e)})}),H=x(e=>{f&&e.key===` `&&z&&!e.defaultPrevented&&L.stop(e,()=>{L.pulsate(e)})}),{getButtonProps:U,rootRef:W}=se({nativeButton:de,nativeButtonProp:y,internalNativeButton:I,allowInferredHostMismatch:P||typeof F==`string`,disabled:l,type:M,hasFormAction:ue,tabIndex:A,onBeforeKeyDown:V,onBeforeKeyUp:H}),{onClick:fe,onKeyDown:G,onKeyUp:K,...q}=U({onClick:S,onKeyDown:E,onKeyUp:D});Q.useImperativeHandle(r,()=>({focusVisible:()=>{B(!0),W.current.focus()}}),[W]);let J=L.shouldMount&&!u&&!l;Q.useEffect(()=>{z&&f&&!u&&L.pulsate()},[u,f,z,L]);let Y=Z(L,`start`,ne,d),pe=Z(L,`stop`,ee,d),me=Z(L,`stop`,te,d),he=Z(L,`stop`,re,d),ge=Z(L,`stop`,e=>{z&&e.preventDefault(),k&&k(e)},d),_e=Z(L,`start`,oe,d),ve=Z(L,`stop`,ie,d),be=Z(L,`stop`,ae,d),xe=Z(L,`stop`,e=>{O(e.target)||B(!1),b&&b(e)},!1),Se=x(e=>{W.current||=e.currentTarget,!g&&O(e.target)&&(B(!0),T&&T(e)),w&&w(e)}),X={};P&&(X.tabIndex=l?-1:A,l&&(X[`aria-disabled`]=l),X.type=M);let Ee=C(t,W),$={...n,centerRipple:i,component:c,disabled:l,disableRipple:u,disableTouchRipple:d,focusRipple:f,suppressFocusVisible:g,tabIndex:A,focusVisible:z},De=we($);return(0,Ce.jsxs)(Te,{as:F,className:s(De.root,o),ownerState:$,onBlur:xe,onClick:fe,onContextMenu:pe,onFocus:Se,onKeyDown:G,onKeyUp:K,onMouseDown:Y,onMouseLeave:ge,onMouseUp:he,onDragLeave:me,onTouchEnd:ve,onTouchMove:be,onTouchStart:_e,ref:Ee,...P?X:q,...N,children:[a,J?(0,Ce.jsx)(ye,{ref:R,center:i,...j}):null]})})})),De=t((()=>{$(),X(),X(),H(),H()}));export{k as a,re as i,Ee as n,O as o,$ as r,De as t};