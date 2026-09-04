import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionTypeNavigation-975h9FiO.js";var o,s,c,l,u,d;t((()=>{o=r(),s=e(n()),i(),c={title:`Molecules/Transactions/TransactionTypeNavigation`,component:a,render:function(e){let[t,n]=(0,s.useState)(e.activeType??`normal`);return(0,o.jsx)(a,{...e,activeType:t,onChange:n})},args:{activeType:`normal`,onChange:()=>void 0}},l={name:`收支选中`,args:{activeType:`normal`}},u={name:`转账选中`,args:{activeType:`transfer`}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "收支选中",
  args: {
    activeType: "normal"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "转账选中",
  args: {
    activeType: "transfer"
  }
}`,...u.parameters?.docs?.source}}},d=[`Normal`,`Transfer`]}))();export{l as Normal,u as Transfer,d as __namedExportsOrder,c as default};