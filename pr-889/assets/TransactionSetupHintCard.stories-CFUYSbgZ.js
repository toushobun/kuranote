import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t,i as n,n as r,s as i}from"./paths-D7uT-HPS.js";import{a,i as o,n as s,r as c,t as l}from"./transactionSetupHint-77dKb8t0.js";function u(e){if(!e)throw Error(`hint is required`);return e}var d,f,p,m,h,g;e((()=>{n(),a(),c(),d={title:`Organisms/Transactions/TransactionSetupHintCard`,component:o,args:{addAccountHref:r(t(`expense`)),addMerchantHref:i(t(`expense`)),hint:u(l({accountCount:0,merchantCount:0}))}},f={name:`账户、商家都没有`},p={name:`只缺商家`,args:{hint:u(l({accountCount:1,merchantCount:0}))}},m={name:`只缺账户`,args:{hint:u(l({accountCount:0,merchantCount:1}))}},h={name:`转账 · 只有 1 个账户`,args:{addAccountHref:r(t(`transfer`)),addMerchantHref:void 0,hint:u(s(1))}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "账户、商家都没有"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "只缺商家",
  args: {
    hint: requireHint(getNormalTransactionSetupHint({
      accountCount: 1,
      merchantCount: 0
    }))
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "只缺账户",
  args: {
    hint: requireHint(getNormalTransactionSetupHint({
      accountCount: 0,
      merchantCount: 1
    }))
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "转账 · 只有 1 个账户",
  args: {
    addAccountHref: accountsCreateHref(transactionsNewHref("transfer")),
    addMerchantHref: undefined,
    hint: requireHint(getTransferTransactionSetupHint(1))
  }
}`,...h.parameters?.docs?.source}}},g=[`MissingAccountAndMerchant`,`MissingMerchant`,`MissingAccount`,`TransferOneAccount`]}))();export{m as MissingAccount,f as MissingAccountAndMerchant,p as MissingMerchant,h as TransferOneAccount,g as __namedExportsOrder,d as default};