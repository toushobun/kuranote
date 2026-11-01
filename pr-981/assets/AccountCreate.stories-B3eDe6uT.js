import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,o as n,t as r}from"./accountHolders-Bb_kmsPg.js";import{n as i,r as a}from"./AccountCreate-CWiIfyHg.js";var o,s,c,l;e((()=>{n(),a(),o={title:`Templates/Accounts/AccountCreateTemplate`,component:i,args:{baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:r,ledgerName:`家庭账本`,placeholderHolderOptions:t}},s={name:`新增账户页面`},c={name:`从记一笔进入`,args:{returnTo:`/transactions/new?method=transfer`}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "新增账户页面"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "从记一笔进入",
  args: {
    returnTo: "/transactions/new?method=transfer"
  }
}`,...c.parameters?.docs?.source}}},l=[`Default`,`FromTransaction`]}))();export{s as Default,c as FromTransaction,l as __namedExportsOrder,o as default};