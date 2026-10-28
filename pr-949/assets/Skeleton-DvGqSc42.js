import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{I as i,L as a,St as o,_t as s,a as c,ft as l,lt as u,pt as d,r as f,s as p,t as m,ut as h,vt as g,wt as _}from"./DefaultPropsProvider-BWoWYWbL.js";import{i as v,r as y}from"./capitalize-CSpJYPmH.js";import{o as b,t as x}from"./utils-DIk0ymYl.js";import{E as S,j as C,k as w}from"./iframe-CC0csfxX.js";function T(e){return d(`MuiSkeleton`,e)}var E=t((()=>{u(),l(),h(`MuiSkeleton`,[`root`,`text`,`rectangular`,`rounded`,`circular`,`pulse`,`wave`,`withChildren`,`fitContent`,`heightAuto`])})),D,O,k,A,j,M,N,P,F,I=t((()=>{D=e(n(),1),g(),i(),S(),c(),y(),m(),b(),E(),O=r(),k=e=>{let{classes:t,variant:n,animation:r,hasChildren:i,width:o,height:s}=e;return a({root:[`root`,n,r,i&&`withChildren`,i&&!o&&`fitContent`,i&&!s&&`heightAuto`]},T,t)},A=_`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`,j=_`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`,M=typeof A==`string`?null:o`
        animation: ${A} 2s ease-in-out 0.5s infinite;
      `,N=typeof j==`string`?null:o`
        &::after {
          animation: ${j} 2s linear 0.5s infinite;
        }
      `,P=p(`span`,{name:`MuiSkeleton`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],n.animation!==!1&&t[n.animation],n.hasChildren&&t.withChildren,n.hasChildren&&!n.width&&t.fitContent,n.hasChildren&&!n.height&&t.heightAuto]}})(v(({theme:e})=>{let t=w(e.shape.borderRadius)||`px`,n=C(e.shape.borderRadius),r=x(e,{animation:`none`}),i=x(e,{"&::after":{animation:`none`,display:`none`}});return{display:`block`,backgroundColor:e.vars?e.vars.palette.Skeleton.bg:e.alpha(e.palette.text.primary,e.palette.mode===`light`?.11:.13),height:`1.2em`,variants:[{props:{variant:`text`},style:{marginTop:0,marginBottom:0,height:`auto`,transformOrigin:`0 55%`,transform:`scale(1, 0.60)`,borderRadius:`${n}${t}/${Math.round(n/.6*10)/10}${t}`,"&:empty:before":{content:`"\\00a0"`}}},{props:{variant:`circular`},style:{borderRadius:`50%`}},{props:{variant:`rounded`},style:{borderRadius:(e.vars||e).shape.borderRadius}},{props:({ownerState:e})=>e.hasChildren,style:{"& > *":{visibility:`hidden`}}},{props:({ownerState:e})=>e.hasChildren&&!e.width,style:{maxWidth:`fit-content`}},{props:({ownerState:e})=>e.hasChildren&&!e.height,style:{height:`auto`}},{props:{animation:`pulse`},style:M||{animation:`${A} 2s ease-in-out 0.5s infinite`}},...r?[{props:{animation:`pulse`},style:r}]:[],{props:{animation:`wave`},style:{position:`relative`,overflow:`hidden`,WebkitMaskImage:`-webkit-radial-gradient(white, black)`,"&::after":{background:`linear-gradient(
                90deg,
                transparent,
                ${(e.vars||e).palette.action.hover},
                transparent
              )`,content:`""`,position:`absolute`,transform:`translateX(-100%)`,bottom:0,left:0,right:0,top:0}}},{props:{animation:`wave`},style:N||{"&::after":{animation:`${j} 2s linear 0.5s infinite`}}},...i?[{props:{animation:`wave`},style:i}]:[]]}})),F=D.forwardRef(function(e,t){let n=f({props:e,name:`MuiSkeleton`}),{animation:r=`pulse`,className:i,component:a=`span`,height:o,style:c,variant:l=`text`,width:u,...d}=n,p={...n,animation:r,component:a,variant:l,hasChildren:!!d.children};return(0,O.jsx)(P,{as:a,ref:t,className:s(k(p).root,i),ownerState:p,...d,style:{width:u,height:o,...c}})})})),L=t((()=>{I(),E(),E()}));export{F as n,I as r,L as t};