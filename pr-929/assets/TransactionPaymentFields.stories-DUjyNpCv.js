import{i as e}from"./preload-helper-D2yxXLVK.js";import{D as t,T as n,t as r}from"./transaction-CmOK97S3.js";import{i,n as a,r as o,t as s}from"./TransactionPaymentFields-z1xndwgA.js";function c({itemAmounts:e=p,payments:t,...n}){let r=t??[{accountId:d.id,amount:``,key:1}];return{accountOptions:u,canAddPayment:!0,onAccountChange:()=>void 0,onAddPayment:()=>void 0,onAmountChange:()=>void 0,onRemovePayment:()=>void 0,payments:r,reconciliation:i({currency:`JPY`,itemAmounts:e,payments:r}),showEmptyAccountHelper:!1,...n}}function l(e){return[{accountId:d.id,amount:e[0],key:1},{accountId:f.id,amount:e[1],key:2}]}var u,d,f,p,m=e((()=>{o(),u=[{currency:`JPY`,id:`00000000-0000-4000-8000-000000000061`,name:`礼品卡`},{currency:`JPY`,id:`00000000-0000-4000-8000-000000000062`,name:`信用卡`},{currency:`USD`,id:`00000000-0000-4000-8000-000000000063`,name:`美元卡`}],[d,f]=u,p=[`3500`]})),h,g,_,v,y,b,x;e((()=>{r(),a(),m(),h={title:`Organisms/Transactions/TransactionPaymentFields`,component:s,args:c({})},g={name:`单账户（默认）`},_={name:`多账户平衡`,args:c({payments:l([`2000`,`1500`])})},v={name:`多账户不平衡`,args:c({payments:l([`2000`,``])})},y={name:`含 0 金额行`,args:c({payments:l([`3500`,`0`])})},b={name:`多账户后又加了收入明细`,args:c({canAddPayment:!1,fieldError:t[n.paymentMultiAccountNotAllowed],payments:l([`2000`,`1500`])})},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "单账户（默认）"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "多账户平衡",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["2000", "1500"])
  })
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "多账户不平衡",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["2000", ""])
  })
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "含 0 金额行",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["3500", "0"])
  })
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "多账户后又加了收入明细",
  args: createPaymentFieldsProps({
    canAddPayment: false,
    fieldError: transactionPaymentValidationErrorMessages[transactionErrorCodes.paymentMultiAccountNotAllowed],
    payments: createPaymentRows(["2000", "1500"])
  })
}`,...b.parameters?.docs?.source}}},x=[`SingleAccount`,`MultiAccountBalanced`,`MultiAccountUnbalanced`,`MultiAccountWithZeroAmount`,`MultiAccountWithIncomeItem`]}))();export{_ as MultiAccountBalanced,v as MultiAccountUnbalanced,b as MultiAccountWithIncomeItem,y as MultiAccountWithZeroAmount,g as SingleAccount,x as __namedExportsOrder,h as default};