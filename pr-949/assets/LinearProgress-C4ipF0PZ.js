import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{I as i,J as a,L as o,St as s,Y as c,_t as l,a as u,ft as d,lt as f,pt as p,r as m,s as h,t as g,ut as _,vt as v,wt as y}from"./DefaultPropsProvider-BWoWYWbL.js";import{i as b,n as x,r as S,t as C}from"./capitalize-CSpJYPmH.js";import{i as w,o as T,t as E}from"./utils-DIk0ymYl.js";import{n as D,t as O}from"./createSimplePaletteValueFilter-88pE_DMp.js";function k(e){return p(`MuiLinearProgress`,e)}var A=t((()=>{f(),d(),_(`MuiLinearProgress`,[`root`,`colorPrimary`,`colorSecondary`,`determinate`,`indeterminate`,`buffer`,`query`,`dashed`,`bar`,`bar1`,`bar2`])})),j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J=t((()=>{j=e(n(),1),v(),i(),a(),u(),S(),D(),g(),x(),T(),A(),M=r(),N=4,P={},F=y`
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
`,I=typeof F==`string`?null:s`
        animation: ${F} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
      `,L=y`
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
`,R=typeof L==`string`?null:s`
        animation: ${L} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
      `,z=y`
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
`,B=typeof z==`string`?null:s`
        animation: ${z} 3s infinite linear;
      `,V=e=>{let{classes:t,variant:n,color:r}=e;return o({root:[`root`,`color${C(r)}`,n],dashed:[`dashed`],bar1:[`bar`,`bar1`],bar2:[`bar`,`bar2`,n===`buffer`&&`color${C(r)}`]},k,t)},H=(e,t)=>e.vars?e.vars.palette.LinearProgress[`${t}Bg`]:e.palette.mode===`light`?e.lighten(e.palette[t].main,.62):e.darken(e.palette[t].main,.5),U=h(`span`,{name:`MuiLinearProgress`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[`color${C(n.color)}`],t[n.variant]]}})(b(({theme:e})=>({position:`relative`,overflow:`hidden`,display:`block`,height:4,zIndex:0,"@media print":{colorAdjust:`exact`},variants:[...Object.entries(e.palette).filter(O()).map(([t])=>({props:{color:t},style:{backgroundColor:H(e,t)}})),{props:({ownerState:e})=>e.color===`inherit`&&e.variant!==`buffer`,style:{"&::before":{content:`""`,position:`absolute`,left:0,top:0,right:0,bottom:0,backgroundColor:`currentColor`,opacity:.3}}},{props:{variant:`buffer`},style:{backgroundColor:`transparent`}},{props:{variant:`query`},style:{transform:`rotate(180deg)`}}]}))),W=h(`span`,{name:`MuiLinearProgress`,slot:`Dashed`})(b(({theme:e})=>({position:`absolute`,marginTop:0,height:`100%`,width:`100%`,backgroundSize:`10px 10px`,backgroundPosition:`0 -23px`,variants:[{props:{color:`inherit`},style:{opacity:.3,backgroundImage:`radial-gradient(currentColor 0%, currentColor 16%, transparent 42%)`}},...Object.entries(e.palette).filter(O()).map(([t])=>{let n=H(e,t);return{props:{color:t},style:{backgroundImage:`radial-gradient(${n} 0%, ${n} 16%, transparent 42%)`}}})]})),B||{animation:`${z} 3s infinite linear`},b(({theme:e})=>E(e,{animation:`none`})||P)),G=h(`span`,{name:`MuiLinearProgress`,slot:`Bar1`,overridesResolver:(e,t)=>[t.bar,t.bar1]})(b(({theme:e})=>{let t=E(e,{animation:`none`,left:`30%`,right:`auto`,width:`40%`});return{width:`100%`,position:`absolute`,left:0,bottom:0,top:0,...w(e,`transform`,{duration:`0.2s`,easing:`linear`}),transformOrigin:`left`,variants:[{props:{color:`inherit`},style:{backgroundColor:`currentColor`}},...Object.entries(e.palette).filter(O()).map(([t])=>({props:{color:t},style:{backgroundColor:(e.vars||e).palette[t].main}})),{props:{variant:`determinate`},style:{...w(e,`transform`,{duration:`.${N}s`,easing:`linear`})}},{props:{variant:`buffer`},style:{zIndex:1,...w(e,`transform`,{duration:`.${N}s`,easing:`linear`})}},{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:{width:`auto`}},{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:I||{animation:`${F} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`}},...t?[{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:t}]:[]]}})),K=h(`span`,{name:`MuiLinearProgress`,slot:`Bar2`,overridesResolver:(e,t)=>[t.bar,t.bar2]})(b(({theme:e})=>{let t=E(e,{animation:`none`,display:`none`});return{width:`100%`,position:`absolute`,left:0,bottom:0,top:0,...w(e,`transform`,{duration:`0.2s`,easing:`linear`}),transformOrigin:`left`,variants:[...Object.entries(e.palette).filter(O()).map(([t])=>({props:{color:t},style:{"--LinearProgressBar2-barColor":(e.vars||e).palette[t].main}})),{props:({ownerState:e})=>e.variant!==`buffer`&&e.color!==`inherit`,style:{backgroundColor:`var(--LinearProgressBar2-barColor, currentColor)`}},{props:({ownerState:e})=>e.variant!==`buffer`&&e.color===`inherit`,style:{backgroundColor:`currentColor`}},{props:{color:`inherit`},style:{opacity:.3}},...Object.entries(e.palette).filter(O()).map(([t])=>({props:{color:t,variant:`buffer`},style:{backgroundColor:H(e,t),...w(e,`transform`,{duration:`.${N}s`,easing:`linear`})}})),{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:{width:`auto`}},{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:R||{animation:`${L} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite`}},...t?[{props:({ownerState:e})=>e.variant===`indeterminate`||e.variant===`query`,style:t}]:[]]}})),q=j.forwardRef(function(e,t){let n=m({props:e,name:`MuiLinearProgress`}),{className:r,color:i=`primary`,max:a,min:o,value:s,valueBuffer:u,variant:d=`indeterminate`,...f}=n,p={...n,color:i,variant:d},h=o??0,g=a??100,_=V(p),v=c(),y={},b={bar1:{},bar2:{}};if((d===`determinate`||d===`buffer`)&&s!==void 0){let e=g-h,t=(s-h)/e*100-100;v&&(t=-t),b.bar1.transform=e>0?`translateX(${t}%)`:`translateX(-100%)`,y[`aria-valuenow`]=s,y[`aria-valuemin`]=h,y[`aria-valuemax`]=g}if(d===`buffer`&&u!==void 0){let e=g-h,t=(u-h)/e*100-100;v&&(t=-t),b.bar2.transform=e>0?`translateX(${t}%)`:`translateX(-100%)`}return(0,M.jsxs)(U,{className:l(_.root,r),ownerState:p,role:`progressbar`,...y,ref:t,...f,children:[d===`buffer`?(0,M.jsx)(W,{className:_.dashed,ownerState:p}):null,(0,M.jsx)(G,{className:_.bar1,ownerState:p,style:b.bar1}),d===`determinate`?null:(0,M.jsx)(K,{className:_.bar2,ownerState:p,style:b.bar2})]})})})),Y=t((()=>{J(),A(),A()}));export{q as n,J as r,Y as t};