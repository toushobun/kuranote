import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{$ as i,At as a,Nt as o,Pt as s,R as c,a as l,et as u,ft as d,jt as f,mt as p,nt as m,r as ee,rt as h,t as g,z as te}from"./DefaultPropsProvider-BKxRfWYI.js";import{a as _,i as v,n as y,o as ne,t as re}from"./memoTheme-D4FluK3h.js";import{i as b,o as ie,t as x}from"./utils-DIk0ymYl.js";import{n as ae,t as S}from"./createSimplePaletteValueFilter-88pE_DMp.js";import{n as C,t as oe}from"./Typography-B_0Lz4TE.js";import{R as se,g as ce,h as w,v as le,y as ue,z as de}from"./iframe-CeaJ1pnF.js";import{n as T,t as fe}from"./Stack-CedAN9w3.js";import{n as pe,t as me}from"./actionPendingMessages-B03PK8BF.js";import{n as he,t as ge}from"./SoftCard-Cm8Cy2H-.js";import{n as _e,t as ve}from"./PrimaryActionButton-7swy8Kto.js";import{s as ye,t as be}from"./ledgerSetupMessages-BgFDxITC.js";import{n as xe,t as Se}from"./LedgerSetupAbandonButton-BO1HyqiE.js";import{a as Ce,o as we}from"./ledgerSetupWizardSteps-Cj6YU1Dv.js";import{n as Te,t as Ee}from"./ledgerSetupProgressSummary-CL5S1WUF.js";function De(e){return h(`MuiLinearProgress`,e)}var E=t((()=>{i(),m(),u(`MuiLinearProgress`,[`root`,`colorPrimary`,`colorSecondary`,`determinate`,`indeterminate`,`buffer`,`query`,`dashed`,`bar`,`bar1`,`bar2`])})),D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,Oe=t((()=>{D=e(n(),1),s(),a(),c(),v(),re(),ae(),g(),ne(),ie(),E(),O=r(),k=4,A={},j=p`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`,M=typeof j==`string`?null:d`
        animation: ${j} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
      `,N=p`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`,P=typeof N==`string`?null:d`
        animation: ${N} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
      `,F=p`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`,I=typeof F==`string`?null:d`
        animation: ${F} 3s infinite linear;
      `,L=e=>{let{classes:t,variant:n,color:r}=e;return f({root:[`root`,`color${_(r)}`,n],dashed:[`dashed`],bar1:[`bar`,`bar1`],bar2:[`bar`,`bar2`,n===`buffer`&&`color${_(r)}`]},De,t)},R=(e,t)=>e.vars?e.vars.palette.LinearProgress[`${t}Bg`]:e.palette.mode===`light`?e.lighten(e.palette[t].main,.62):e.darken(e.palette[t].main,.5),z=l(`span`,{name:`MuiLinearProgress`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[`color${_(n.color)}`],t[n.variant]]}})(y(({theme:e})=>({position:`relative`,overflow:`hidden`,display:`block`,height:4,zIndex:0,"@media print":{colorAdjust:`exact`},variants:[...Object.entries(e.palette).filter(S()).map(([t])=>({props:{color:t},style:{backgroundColor:R(e,t)}})),{props:({ownerState:e})=>e.color===`inherit`&&e.variant!==`buffer`,style:{"&::before":{content:`""`,position:`absolute`,left:0,top:0,right:0,bottom:0,backgroundColor:`currentColor`,opacity:.3}}},{props:{variant:`buffer`},style:{backgroundColor:`transparent`}},{props:{variant:`query`},style:{transform:`rotate(180deg)`}}]}))),B=l(`span`,{name:`MuiLinearProgress`,slot:`Dashed`})(y(({theme:e})=>({position:`absolute`,marginTop:0,height:`100%`,width:`100%`,backgroundSize:`10px 10px`,backgroundPosition:`0 -23px`,variants:[{props:{color:`inherit`},style:{opacity:.3,backgroundImage:`radial-gradient(currentColor 0%, currentColor 16%, transparent 42%)`}},...Object.entries(e.palette).filter(S()).map(([t])=>{let n=R(e,t);return{props:{color:t},style:{backgroundImage:`radial-gradient(${n} 0%, ${n} 16%, transparent 42%)`}}})]})),I||{animation:`${F} 3s infinite linear`},y(({theme:e})=>x(e,{animation:`none`})||A)),V=l(`span`,{name:`MuiLinearProgress`,slot:`Bar1`,overridesResolver:(e,t)=>[t.bar,t.bar1]})(y(({theme:e})=>{let t=x(e,{animation:`none`,left:`30%`,right:`auto`,width:`40%`});return{width:`100%`,position:`absolute`,left:0,bottom:0,top:0,...b(e,`transform`,{duration:`0.2s`,easing:`linear`}),transformOrigin:`left`,variants:[{props:{color:`inherit`},style:{backgroundColor:`currentColor`}},...Object.entries(e.palette).filter(S()).map(([t])=>({props:{color:t},style:{backgroundColor:(e.vars||e).palette[t].main}})),{props:{variant:`determinate`},style:{...b(e,`transform`,{duration:`.${k}s`,easing:`linear`})}},{props:{variant:`buffer`},style:{zIndex:1,...b(e,`transform`,{duration:`.${k}s`,easing:`linear`})}},{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:{width:`auto`}},{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:M||{animation:`${j} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`}},...t?[{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:t}]:[]]}})),H=l(`span`,{name:`MuiLinearProgress`,slot:`Bar2`,overridesResolver:(e,t)=>[t.bar,t.bar2]})(y(({theme:e})=>{let t=x(e,{animation:`none`,display:`none`});return{width:`100%`,position:`absolute`,left:0,bottom:0,top:0,...b(e,`transform`,{duration:`0.2s`,easing:`linear`}),transformOrigin:`left`,variants:[...Object.entries(e.palette).filter(S()).map(([t])=>({props:{color:t},style:{"--LinearProgressBar2-barColor":(e.vars||e).palette[t].main}})),{props:({ownerState:e})=>e.variant!==`buffer`&&e.color!==`inherit`,style:{backgroundColor:`var(--LinearProgressBar2-barColor, currentColor)`}},{props:({ownerState:e})=>e.variant!==`buffer`&&e.color===`inherit`,style:{backgroundColor:`currentColor`}},{props:{color:`inherit`},style:{opacity:.3}},...Object.entries(e.palette).filter(S()).map(([t])=>({props:{color:t,variant:`buffer`},style:{backgroundColor:R(e,t),...b(e,`transform`,{duration:`.${k}s`,easing:`linear`})}})),{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:{width:`auto`}},{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:P||{animation:`${N} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite`}},...t?[{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:t}]:[]]}})),U=D.forwardRef(function(e,t){let n=ee({props:e,name:`MuiLinearProgress`}),{className:r,color:i=`primary`,max:a,min:s,value:c,valueBuffer:l,variant:u=`indeterminate`,...d}=n,f={...n,color:i,variant:u},p=s??0,m=a??100,h=L(f),g=te(),_={},v={bar1:{},bar2:{}};if((u===`determinate`||u===`buffer`)&&c!==void 0){let e=m-p,t=(c-p)/e*100-100;g&&(t=-t),v.bar1.transform=e>0?`translateX(${t}%)`:`translateX(-100%)`,_[`aria-valuenow`]=c,_[`aria-valuemin`]=p,_[`aria-valuemax`]=m}if(u===`buffer`&&l!==void 0){let e=m-p,t=(l-p)/e*100-100;g&&(t=-t),v.bar2.transform=e>0?`translateX(${t}%)`:`translateX(-100%)`}return(0,O.jsxs)(z,{className:o(h.root,r),ownerState:f,role:`progressbar`,..._,ref:t,...d,children:[u===`buffer`?(0,O.jsx)(B,{className:h.dashed,ownerState:f}):null,(0,O.jsx)(V,{className:h.bar1,ownerState:f,style:v.bar1}),u===`determinate`?null:(0,O.jsx)(H,{className:h.bar2,ownerState:f,style:v.bar2})]})})})),ke=t((()=>{Oe(),E(),E()}));function W({abandonAction:e,onAbandoned:t,onContinue:n,pending:r=!1,setup:i}){let[a,o]=(0,K.useState)(!1),s=Ee(i.step),c=q.continueCardTitle(i.name);return(0,G.jsx)(ge,{"aria-label":c,component:`section`,sx:Y,children:(0,G.jsxs)(T,{spacing:1.75,children:[(0,G.jsxs)(T,{direction:`row`,spacing:1.5,sx:{alignItems:`center`},children:[(0,G.jsx)(de,{"aria-hidden":`true`,sx:X,children:(0,G.jsx)(Ce,{})}),(0,G.jsxs)(T,{spacing:.4,sx:{flex:1,minWidth:0},children:[(0,G.jsx)(C,{component:`h2`,sx:Z,children:c}),(0,G.jsx)(C,{color:`textSecondary`,variant:`body2`,children:s.description})]})]}),(0,G.jsxs)(T,{direction:`row`,spacing:1.25,sx:{alignItems:`center`},children:[(0,G.jsx)(U,{"aria-label":q.progressLabel,"aria-valuetext":s.stepCountText,sx:Q,value:Math.round(s.ratio*100),variant:`determinate`}),(0,G.jsx)(C,{color:`textSecondary`,sx:$,children:s.stepCountText})]}),(0,G.jsx)(ve,{disabled:a,fullWidth:!0,onClick:n,pending:r,pendingLabel:me.continue,children:q.continue}),(0,G.jsx)(Se,{onBusyChange:o,action:e,ledgerId:i.id,ledgerName:i.name,onSuccess:t})]})})}var G,K,q,J,Y,X,Z,Q,$,Ae=t((()=>{G=r(),K=e(n()),we(),se(),ke(),fe(),oe(),xe(),_e(),he(),be(),pe(),Te(),ce(),le(),q=ye,J=`var(--user-theme-field-card-selected-border)`,Y={backgroundColor:`var(--user-theme-field-card-selected-bg)`,borderRadius:`${w.radius.xl}px`,p:2},X={alignItems:`center`,bgcolor:`var(--user-theme-card-bg)`,borderRadius:`50%`,color:J,display:`inline-flex`,flexShrink:0,height:52,justifyContent:`center`,width:52,"& .MuiSvgIcon-root":{fontSize:30}},Z={...ue.cardTitle,fontSize:17,fontWeight:900,overflowWrap:`anywhere`},Q={bgcolor:`var(--user-theme-card-bg)`,borderRadius:`${w.radius.full}px`,flex:1,height:6,"& .MuiLinearProgress-bar":{bgcolor:J,borderRadius:`${w.radius.full}px`}},$={flexShrink:0,fontSize:12,fontWeight:700},W.__docgenInfo={description:`首页「继续创建」卡片：当前没有已完成账本、但有创建中账本时显示。`,methods:[],displayName:`LedgerSetupContinueCard`,props:{abandonAction:{required:!0,tsType:{name:`LedgerSetupAbandonAction`},description:``},onAbandoned:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},onContinue:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},pending:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},setup:{required:!0,tsType:{name:`LedgerSetupInProgressSummary`},description:``}}}}));export{Ae as n,W as t};