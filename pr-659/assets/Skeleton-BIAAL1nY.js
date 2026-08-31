import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{$ as i,A as a,a as o,ct as s,et as c,ft as l,k as u,mt as d,nt as f,r as p,rt as m,s as h,st as g,t as _}from"./DefaultPropsProvider-BrOASIGE.js";import{a as v,o as y}from"./createSimplePaletteValueFilter-BYycgg0u.js";import{o as b,t as x}from"./utils-DIk0ymYl.js";import{C as S,T as C,b as w}from"./iframe-DJTMrJFl.js";function T(e){return m(`MuiSkeleton`,e)}var E=t((()=>{i(),f(),c(`MuiSkeleton`,[`root`,`text`,`rectangular`,`rounded`,`circular`,`pulse`,`wave`,`withChildren`,`fitContent`,`heightAuto`])})),D,O,k,A,j,M,N,P,F,I=t((()=>{D=e(n(),1),s(),u(),w(),o(),v(),_(),b(),E(),O=r(),k=e=>{let{classes:t,variant:n,animation:r,hasChildren:i,width:o,height:s}=e;return a({root:[`root`,n,r,i&&`withChildren`,i&&!o&&`fitContent`,i&&!s&&`heightAuto`]},T,t)},A=d`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`,j=d`
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
`,M=typeof A==`string`?null:l`
        animation: ${A} 2s ease-in-out 0.5s infinite;
      `,N=typeof j==`string`?null:l`
        &::after {
          animation: ${j} 2s linear 0.5s infinite;
        }
      `,P=h(`span`,{name:`MuiSkeleton`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],n.animation!==!1&&t[n.animation],n.hasChildren&&t.withChildren,n.hasChildren&&!n.width&&t.fitContent,n.hasChildren&&!n.height&&t.heightAuto]}})(y(({theme:e})=>{let t=S(e.shape.borderRadius)||`px`,n=C(e.shape.borderRadius),r=x(e,{animation:`none`}),i=x(e,{"&::after":{animation:`none`,display:`none`}});return{display:`block`,backgroundColor:e.vars?e.vars.palette.Skeleton.bg:e.alpha(e.palette.text.primary,e.palette.mode===`light`?.11:.13),height:`1.2em`,variants:[{props:{variant:`text`},style:{marginTop:0,marginBottom:0,height:`auto`,transformOrigin:`0 55%`,transform:`scale(1, 0.60)`,borderRadius:`${n}${t}/${Math.round(n/.6*10)/10}${t}`,"&:empty:before":{content:`"\\00a0"`}}},{props:{variant:`circular`},style:{borderRadius:`50%`}},{props:{variant:`rounded`},style:{borderRadius:(e.vars||e).shape.borderRadius}},{props:({ownerState:e})=>e.hasChildren,style:{"& > *":{visibility:`hidden`}}},{props:({ownerState:e})=>e.hasChildren&&!e.width,style:{maxWidth:`fit-content`}},{props:({ownerState:e})=>e.hasChildren&&!e.height,style:{height:`auto`}},{props:{animation:`pulse`},style:M||{animation:`${A} 2s ease-in-out 0.5s infinite`}},...r?[{props:{animation:`pulse`},style:r}]:[],{props:{animation:`wave`},style:{position:`relative`,overflow:`hidden`,WebkitMaskImage:`-webkit-radial-gradient(white, black)`,"&::after":{background:`linear-gradient(
                90deg,
                transparent,
                ${(e.vars||e).palette.action.hover},
                transparent
              )`,content:`""`,position:`absolute`,transform:`translateX(-100%)`,bottom:0,left:0,right:0,top:0}}},{props:{animation:`wave`},style:N||{"&::after":{animation:`${j} 2s linear 0.5s infinite`}}},...i?[{props:{animation:`wave`},style:i}]:[]]}})),F=D.forwardRef(function(e,t){let n=p({props:e,name:`MuiSkeleton`}),{animation:r=`pulse`,className:i,component:a=`span`,height:o,style:s,variant:c=`text`,width:l,...u}=n,d={...n,animation:r,component:a,variant:c,hasChildren:!!u.children};return(0,O.jsx)(P,{as:a,ref:t,className:g(k(d).root,i),ownerState:d,...u,style:{width:l,height:o,...s}})})})),L=t((()=>{I(),E(),E()}));export{F as n,I as r,L as t};