import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./iframe-Dr6Odk_Y.js";import{m as i,o as a}from"./transactions-CCekvR34.js";import{n as o,t as s}from"./Typography-CwLqrFKa.js";import{n as c,t as l}from"./SectionCard-BYgSXQYM.js";function u({expense:e,label:t,recordCount:n}){return(0,d.jsxs)(l,{sx:{borderRadius:`${r.radius.md}px`,flex:1,p:1.8},children:[(0,d.jsx)(o,{sx:{color:`text.secondary`,fontSize:12,mb:.6},children:t}),(0,d.jsxs)(o,{sx:{color:`var(--user-theme-negative-amount)`,fontSize:20,fontWeight:900,lineHeight:1.2},children:[`-`,a(e)]}),n>0?(0,d.jsxs)(o,{sx:{color:`text.secondary`,fontSize:11,mt:.4},children:[`共 `,n,` 笔记录`]}):null]})}var d,f=e((()=>{d=t(),s(),c(),n(),i(),u.__docgenInfo={description:``,methods:[],displayName:`PeriodExpenseCard`,props:{expense:{required:!0,tsType:{name:`string`},description:``},label:{required:!0,tsType:{name:`string`},description:``},recordCount:{required:!0,tsType:{name:`number`},description:``}}}})),p,m,h,g,_;e((()=>{f(),p={title:`Molecules/Dashboard/PeriodExpenseCard`,component:u,args:{label:`今日支出`,expense:`3200`,recordCount:5}},m={name:`周期支出卡片`},h={name:`本周支出`,args:{label:`本周支出`,expense:`18500`,recordCount:12}},g={name:`无支出`,args:{label:`今日支出`,expense:`0`,recordCount:0}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "周期支出卡片"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "本周支出",
  args: {
    label: "本周支出",
    expense: "18500",
    recordCount: 12
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "无支出",
  args: {
    label: "今日支出",
    expense: "0",
    recordCount: 0
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`Weekly`,`Zero`]}))();export{m as Default,h as Weekly,g as Zero,_ as __namedExportsOrder,p as default};