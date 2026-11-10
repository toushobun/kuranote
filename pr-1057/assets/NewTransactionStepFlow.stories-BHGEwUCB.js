import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n,t as r}from"./transactionStepFlowStoryUtils-Bmi9kHIO.js";import{n as i,r as a}from"./transactionStepFlow-jHa4zbU7.js";import{n as o,t as s}from"./NewTransactionStepFlow-BaQ5lc1N.js";import{i as c,t as l}from"./transactionReceipt-BN12jKlD.js";var u,d,f,p,m;e((()=>{r(),l(),a(),o(),u={title:`Templates/Transactions/NewTransactionStepFlow`,component:s,decorators:[...n,t],args:{action:async()=>({}),accountOptions:i.accounts,addPresetsAction:async()=>({}),categoryOptions:c.categoryOptions,frequentMerchants:i.frequentMerchants,ledgerId:`ledger-1`,loadPresetsAction:async()=>({}),merchantOptions:i.merchants,merchantTags:i.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!1},parameters:{viewport:{defaultViewport:`mobile2`}}},d={name:`从商家记账`},f={name:`常用商家为空（含获取失败）`,args:{frequentMerchants:[]}},p={name:`账户周转（同一外框，可切回从商家记账）`,args:{initialMethod:`transfer`}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "从商家记账"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "常用商家为空（含获取失败）",
  args: {
    frequentMerchants: []
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "账户周转（同一外框，可切回从商家记账）",
  args: {
    initialMethod: "transfer"
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`NoFrequentMerchants`,`Transfer`]}))();export{d as Default,f as NoFrequentMerchants,p as Transfer,m as __namedExportsOrder,u as default};