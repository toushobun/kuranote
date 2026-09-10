import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{$ as i,A as a,a as o,ct as s,et as c,ft as l,k as u,mt as d,nt as f,r as p,rt as m,s as h,st as g,t as _}from"./DefaultPropsProvider-BrOASIGE.js";import{a as v,i as y,n as b,o as x,r as S,t as C}from"./createSimplePaletteValueFilter-BYycgg0u.js";import{i as w,o as T,t as E}from"./utils-DIk0ymYl.js";function D(e){return m(`MuiCircularProgress`,e)}var O=t((()=>{i(),f(),c(`MuiCircularProgress`,[`root`,`determinate`,`indeterminate`,`colorPrimary`,`colorSecondary`,`svg`,`track`,`circle`,`circleDisableShrink`])})),k,A,j,M,N,P,F,I,L,R,z,B,V,H=t((()=>{k=e(n(),1),s(),u(),o(),v(),_(),y(),b(),T(),O(),A=r(),j=44,M=d`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`,N=d`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: -126px;
  }
`,P=typeof M==`string`?null:l`
        animation: ${M} 1.4s linear infinite;
      `,F=typeof N==`string`?null:l`
        animation: ${N} 1.4s ease-in-out infinite;
      `,I=e=>{let{classes:t,variant:n,color:r,disableShrink:i}=e;return a({root:[`root`,n,`color${S(r)}`],svg:[`svg`],track:[`track`],circle:[`circle`,i&&`circleDisableShrink`]},D,t)},L=h(`span`,{name:`MuiCircularProgress`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],t[`color${S(n.color)}`]]}})(x(({theme:e})=>{let t=E(e,{animation:`none`});return{display:`inline-block`,variants:[{props:{variant:`determinate`},style:{...w(e,`transform`)}},{props:{variant:`indeterminate`},style:P||{animation:`${M} 1.4s linear infinite`}},...t?[{props:{variant:`indeterminate`},style:t}]:[],...Object.entries(e.palette).filter(C()).map(([t])=>({props:{color:t},style:{color:(e.vars||e).palette[t].main}}))]}})),R=h(`svg`,{name:`MuiCircularProgress`,slot:`Svg`})({display:`block`}),z=h(`circle`,{name:`MuiCircularProgress`,slot:`Circle`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.circle,n.disableShrink&&t.circleDisableShrink]}})(x(({theme:e})=>{let t=E(e,{animation:`none`});return{stroke:`currentColor`,variants:[{props:{variant:`determinate`},style:{...w(e,`stroke-dashoffset`)}},{props:{variant:`indeterminate`},style:{strokeDasharray:`80px, 200px`,strokeDashoffset:0}},{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:F||{animation:`${N} 1.4s ease-in-out infinite`}},...t?[{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:t}]:[]]}})),B=h(`circle`,{name:`MuiCircularProgress`,slot:`Track`})(x(({theme:e})=>({stroke:`currentColor`,opacity:(e.vars||e).palette.action.activatedOpacity}))),V=k.forwardRef(function(e,t){let n=p({props:e,name:`MuiCircularProgress`}),{className:r,color:i=`primary`,disableShrink:a=!1,enableTrackSlot:o=!1,min:s,max:c,size:l=40,style:u,thickness:d=3.6,value:f=n.min??0,variant:m=`indeterminate`,...h}=n,_=s??0,v=c??100,y={...n,color:i,disableShrink:a,size:l,thickness:d,value:f,variant:m,enableTrackSlot:o},b=I(y),x={},S={},C={};if(m===`determinate`){let e=2*Math.PI*((j-d)/2),t=v-_;x.strokeDasharray=e.toFixed(3),x.strokeDashoffset=t>0?`${((v-f)/t*e).toFixed(3)}px`:`${e.toFixed(3)}px`,S.transform=`rotate(-90deg)`,C[`aria-valuenow`]=f,C[`aria-valuemin`]=_,C[`aria-valuemax`]=v}return(0,A.jsx)(L,{className:g(b.root,r),style:{width:l,height:l,...S,...u},ownerState:y,ref:t,role:`progressbar`,...C,...h,children:(0,A.jsxs)(R,{className:b.svg,ownerState:y,viewBox:`${j/2} ${j/2} ${j} ${j}`,children:[o?(0,A.jsx)(B,{className:b.track,ownerState:y,cx:j,cy:j,r:(j-d)/2,fill:`none`,strokeWidth:d,"aria-hidden":`true`}):null,(0,A.jsx)(z,{className:b.circle,style:x,ownerState:y,cx:j,cy:j,r:(j-d)/2,fill:`none`,strokeWidth:d})]})})})})),U=t((()=>{H(),O(),O()}));export{V as n,H as r,U as t};