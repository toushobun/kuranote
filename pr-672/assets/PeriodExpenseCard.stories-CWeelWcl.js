import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{m as n,o as r}from"./transactions-CCekvR34.js";import{n as i,t as a}from"./Typography-CwLqrFKa.js";import{n as o,t as s}from"./SectionCard-xDXmqXpP.js";function c({expense:e,label:t,recordCount:n}){return(0,l.jsxs)(s,{sx:{borderRadius:1,flex:1,p:1.8},children:[(0,l.jsx)(i,{sx:{color:`text.secondary`,fontSize:12,mb:.6},children:t}),(0,l.jsxs)(i,{sx:{color:`var(--user-theme-negative-amount)`,fontSize:20,fontWeight:900,lineHeight:1.2},children:[`-`,r(e)]}),n>0?(0,l.jsxs)(i,{sx:{color:`text.secondary`,fontSize:11,mt:.4},children:[`共 `,n,` 笔记录`]}):null]})}var l,u=e((()=>{l=t(),a(),o(),n(),c.__docgenInfo={description:``,methods:[],displayName:`PeriodExpenseCard`,props:{expense:{required:!0,tsType:{name:`string`},description:``},label:{required:!0,tsType:{name:`string`},description:``},recordCount:{required:!0,tsType:{name:`number`},description:``}}}})),d,f,p,m,h;e((()=>{u(),d={title:`Molecules/Dashboard/PeriodExpenseCard`,component:c,args:{label:`今日支出`,expense:`3200`,recordCount:5}},f={name:`周期支出卡片`},p={name:`本周支出`,args:{label:`本周支出`,expense:`18500`,recordCount:12}},m={name:`无支出`,args:{label:`今日支出`,expense:`0`,recordCount:0}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "周期支出卡片"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "本周支出",
  args: {
    label: "本周支出",
    expense: "18500",
    recordCount: 12
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "无支出",
  args: {
    label: "今日支出",
    expense: "0",
    recordCount: 0
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`Weekly`,`Zero`]}))();export{f as Default,p as Weekly,m as Zero,h as __namedExportsOrder,d as default};