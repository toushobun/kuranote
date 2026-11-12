import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{$ as i,At as a,Nt as o,Pt as s,a as c,et as l,ft as u,jt as d,mt as f,nt as p,r as m,rt as h,t as g}from"./DefaultPropsProvider-BKxRfWYI.js";import{a as _,i as v,n as y,o as b,t as x}from"./memoTheme-D4FluK3h.js";import{i as S,o as C,t as w}from"./utils-DIk0ymYl.js";import{n as T,t as E}from"./createSimplePaletteValueFilter-88pE_DMp.js";function D(e){return h(`MuiCircularProgress`,e)}var O=t((()=>{i(),p(),l(`MuiCircularProgress`,[`root`,`determinate`,`indeterminate`,`colorPrimary`,`colorSecondary`,`svg`,`track`,`circle`,`circleDisableShrink`])})),k,A,j,M,N,P,F,I,L,R,z,B,V,H=t((()=>{k=e(n(),1),s(),a(),v(),x(),g(),b(),T(),C(),O(),A=r(),j=44,M=f`
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
`,P=typeof M==`string`?null:u`
        animation: ${M} 1.4s linear infinite;
      `,F=typeof N==`string`?null:u`
        animation: ${N} 1.4s ease-in-out infinite;
      `,I=e=>{let{classes:t,variant:n,color:r,disableShrink:i}=e;return d({root:[`root`,n,`color${_(r)}`],svg:[`svg`],track:[`track`],circle:[`circle`,i&&`circleDisableShrink`]},D,t)},L=c(`span`,{name:`MuiCircularProgress`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],t[`color${_(n.color)}`]]}})(y(({theme:e})=>{let t=w(e,{animation:`none`});return{display:`inline-block`,variants:[{props:{variant:`determinate`},style:{...S(e,`transform`)}},{props:{variant:`indeterminate`},style:P||{animation:`${M} 1.4s linear infinite`}},...t?[{props:{variant:`indeterminate`},style:t}]:[],...Object.entries(e.palette).filter(E()).map(([t])=>({props:{color:t},style:{color:(e.vars||e).palette[t].main}}))]}})),R=c(`svg`,{name:`MuiCircularProgress`,slot:`Svg`})({display:`block`}),z=c(`circle`,{name:`MuiCircularProgress`,slot:`Circle`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.circle,n.disableShrink&&t.circleDisableShrink]}})(y(({theme:e})=>{let t=w(e,{animation:`none`});return{stroke:`currentColor`,variants:[{props:{variant:`determinate`},style:{...S(e,`stroke-dashoffset`)}},{props:{variant:`indeterminate`},style:{strokeDasharray:`80px, 200px`,strokeDashoffset:0}},{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:F||{animation:`${N} 1.4s ease-in-out infinite`}},...t?[{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:t}]:[]]}})),B=c(`circle`,{name:`MuiCircularProgress`,slot:`Track`})(y(({theme:e})=>({stroke:`currentColor`,opacity:(e.vars||e).palette.action.activatedOpacity}))),V=k.forwardRef(function(e,t){let n=m({props:e,name:`MuiCircularProgress`}),{className:r,color:i=`primary`,disableShrink:a=!1,enableTrackSlot:s=!1,min:c,max:l,size:u=40,style:d,thickness:f=3.6,value:p=n.min??0,variant:h=`indeterminate`,...g}=n,_=c??0,v=l??100,y={...n,color:i,disableShrink:a,size:u,thickness:f,value:p,variant:h,enableTrackSlot:s},b=I(y),x={},S={},C={};if(h===`determinate`){let e=2*Math.PI*((j-f)/2),t=v-_;x.strokeDasharray=e.toFixed(3),x.strokeDashoffset=t>0?`${((v-p)/t*e).toFixed(3)}px`:`${e.toFixed(3)}px`,S.transform=`rotate(-90deg)`,C[`aria-valuenow`]=p,C[`aria-valuemin`]=_,C[`aria-valuemax`]=v}return(0,A.jsx)(L,{className:o(b.root,r),style:{width:u,height:u,...S,...d},ownerState:y,ref:t,role:`progressbar`,...C,...g,children:(0,A.jsxs)(R,{className:b.svg,ownerState:y,viewBox:`${j/2} ${j/2} ${j} ${j}`,children:[s?(0,A.jsx)(B,{className:b.track,ownerState:y,cx:j,cy:j,r:(j-f)/2,fill:`none`,strokeWidth:f,"aria-hidden":`true`}):null,(0,A.jsx)(z,{className:b.circle,style:x,ownerState:y,cx:j,cy:j,r:(j-f)/2,fill:`none`,strokeWidth:f})]})})})})),U=t((()=>{H(),O(),O()}));export{V as n,H as r,U as t};