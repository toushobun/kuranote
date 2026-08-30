import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,n}from"./dashboard-BDnkYHh6.js";import{n as r,t as i}from"./DashboardRecentTransactions-k523ZdfM.js";var a,o,s,c,l;e((()=>{t(),r(),a={title:`Organisms/Dashboard/RecentTransactions`,component:i,args:{hasLedger:!0,transactions:[n()]}},o={name:`最近记录`},s={name:`空状态`,args:{transactions:[]}},c={name:`无账本空状态`,args:{hasLedger:!1,transactions:[]}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "最近记录"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "空状态",
  args: {
    transactions: []
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "无账本空状态",
  args: {
    hasLedger: false,
    transactions: []
  }
}`,...c.parameters?.docs?.source}}},l=[`Default`,`Empty`,`NoLedger`]}))();export{o as Default,s as Empty,c as NoLedger,l as __namedExportsOrder,a as default};