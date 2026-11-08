import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{$ as i,At as a,Ct as o,Dt as s,Ot as c,St as l,a as u,et as d,ft as f,i as p,jt as m,l as h,nt as g,r as _,rt as v,s as y,t as b,ut as x}from"./DefaultPropsProvider-BzqxTj0s.js";import{i as S,o as C,t as w}from"./utils-DIk0ymYl.js";import{n as T,t as E}from"./createSimplePaletteValueFilter-88pE_DMp.js";function D(e){return v(`MuiCircularProgress`,e)}var O=t((()=>{i(),g(),d(`MuiCircularProgress`,[`root`,`determinate`,`indeterminate`,`colorPrimary`,`colorSecondary`,`svg`,`track`,`circle`,`circleDisableShrink`])})),k,A,j,M,N,P,F,I,L,R,z,B,V,H=t((()=>{k=e(n(),1),m(),s(),y(),p(),b(),o(),T(),C(),O(),A=r(),j=44,M=f`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`,N=f`
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
`,P=typeof M==`string`?null:x`
        animation: ${M} 1.4s linear infinite;
      `,F=typeof N==`string`?null:x`
        animation: ${N} 1.4s ease-in-out infinite;
      `,I=e=>{let{classes:t,variant:n,color:r,disableShrink:i}=e;return c({root:[`root`,n,`color${l(r)}`],svg:[`svg`],track:[`track`],circle:[`circle`,i&&`circleDisableShrink`]},D,t)},L=h(`span`,{name:`MuiCircularProgress`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],t[`color${l(n.color)}`]]}})(u(({theme:e})=>{let t=w(e,{animation:`none`});return{display:`inline-block`,variants:[{props:{variant:`determinate`},style:{...S(e,`transform`)}},{props:{variant:`indeterminate`},style:P||{animation:`${M} 1.4s linear infinite`}},...t?[{props:{variant:`indeterminate`},style:t}]:[],...Object.entries(e.palette).filter(E()).map(([t])=>({props:{color:t},style:{color:(e.vars||e).palette[t].main}}))]}})),R=h(`svg`,{name:`MuiCircularProgress`,slot:`Svg`})({display:`block`}),z=h(`circle`,{name:`MuiCircularProgress`,slot:`Circle`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.circle,n.disableShrink&&t.circleDisableShrink]}})(u(({theme:e})=>{let t=w(e,{animation:`none`});return{stroke:`currentColor`,variants:[{props:{variant:`determinate`},style:{...S(e,`stroke-dashoffset`)}},{props:{variant:`indeterminate`},style:{strokeDasharray:`80px, 200px`,strokeDashoffset:0}},{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:F||{animation:`${N} 1.4s ease-in-out infinite`}},...t?[{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:t}]:[]]}})),B=h(`circle`,{name:`MuiCircularProgress`,slot:`Track`})(u(({theme:e})=>({stroke:`currentColor`,opacity:(e.vars||e).palette.action.activatedOpacity}))),V=k.forwardRef(function(e,t){let n=_({props:e,name:`MuiCircularProgress`}),{className:r,color:i=`primary`,disableShrink:o=!1,enableTrackSlot:s=!1,min:c,max:l,size:u=40,style:d,thickness:f=3.6,value:p=n.min??0,variant:m=`indeterminate`,...h}=n,g=c??0,v=l??100,y={...n,color:i,disableShrink:o,size:u,thickness:f,value:p,variant:m,enableTrackSlot:s},b=I(y),x={},S={},C={};if(m===`determinate`){let e=2*Math.PI*((j-f)/2),t=v-g;x.strokeDasharray=e.toFixed(3),x.strokeDashoffset=t>0?`${((v-p)/t*e).toFixed(3)}px`:`${e.toFixed(3)}px`,S.transform=`rotate(-90deg)`,C[`aria-valuenow`]=p,C[`aria-valuemin`]=g,C[`aria-valuemax`]=v}return(0,A.jsx)(L,{className:a(b.root,r),style:{width:u,height:u,...S,...d},ownerState:y,ref:t,role:`progressbar`,...C,...h,children:(0,A.jsxs)(R,{className:b.svg,ownerState:y,viewBox:`${j/2} ${j/2} ${j} ${j}`,children:[s?(0,A.jsx)(B,{className:b.track,ownerState:y,cx:j,cy:j,r:(j-f)/2,fill:`none`,strokeWidth:f,"aria-hidden":`true`}):null,(0,A.jsx)(z,{className:b.circle,style:x,ownerState:y,cx:j,cy:j,r:(j-f)/2,fill:`none`,strokeWidth:f})]})})})})),U=t((()=>{H(),O(),O()}));export{V as n,H as r,U as t};