import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t,t as n}from"./transactionMessages-CFOSNaFy.js";import{n as r,t as i}from"./TransactionSharedPaymentNote-DwRmv0Bj.js";var a,o,s,c,l;e((()=>{n(),r(),a={title:`Atoms/Transactions/TransactionSharedPaymentNote`,component:i,args:{label:t.recordTotal(`¥120,000`)}},o={name:`记录级维度（主金额为本账户份额）`},s={name:`主金额为命中明细全额`,args:{label:t.accountShareAndRecordTotal(t.currentAccountSubject,`¥50,000`,`¥120,000`)}},c={name:`组头`,args:{label:t.groupSummary(1,t.currentAccountSubject,`¥50,000`,`¥120,000`)}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "记录级维度（主金额为本账户份额）"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "主金额为命中明细全额",
  args: {
    label: transactionSharedPaymentMessages.accountShareAndRecordTotal(transactionSharedPaymentMessages.currentAccountSubject, "¥50,000", "¥120,000")
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "组头",
  args: {
    label: transactionSharedPaymentMessages.groupSummary(1, transactionSharedPaymentMessages.currentAccountSubject, "¥50,000", "¥120,000")
  }
}`,...c.parameters?.docs?.source}}},l=[`RecordTotal`,`AccountShareAndRecordTotal`,`GroupSummary`]}))();export{s as AccountShareAndRecordTotal,c as GroupSummary,o as RecordTotal,l as __namedExportsOrder,a as default};