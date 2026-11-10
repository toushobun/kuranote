import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t,i as n,n as r}from"./paths-CKJJfhDL.js";import{i,n as a,r as o,t as s}from"./transactionSetupHint-DON7qxFN.js";function c(e){if(!e)throw Error(`hint is required`);return e}var l,u,d,f;e((()=>{n(),i(),a(),l={title:`Organisms/Transactions/TransactionSetupHintCard`,component:o,args:{addAccountHref:r(t({method:`transfer`})),hint:c(s(0))}},u={name:`转账 · 没有账户`},d={name:`转账 · 只有 1 个账户`,args:{hint:c(s(1))}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "转账 · 没有账户"
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "转账 · 只有 1 个账户",
  args: {
    hint: requireHint(getTransferTransactionSetupHint(1))
  }
}`,...d.parameters?.docs?.source}}},f=[`TransferNoAccount`,`TransferOneAccount`]}))();export{u as TransferNoAccount,d as TransferOneAccount,f as __namedExportsOrder,l as default};