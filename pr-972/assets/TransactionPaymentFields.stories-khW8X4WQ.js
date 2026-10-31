import{i as e}from"./preload-helper-D2yxXLVK.js";import{D as t,T as n,t as r}from"./transaction-o08VyBtJ.js";import{i,n as a}from"./useTransactionPaymentFields-Dra_cXuU.js";import{n as o,t as s}from"./TransactionPaymentFields-Wi5GFFln.js";function c({itemAmounts:e=m,payments:t,...n}){let r=t??[{accountId:d.id,amount:``,key:1}];return{accountOptions:u,multiAccountPaymentEnabled:!0,onAccountChange:()=>void 0,onAddPayment:()=>void 0,onAmountChange:()=>void 0,onAmountCommit:()=>void 0,onRemovePayment:()=>void 0,payments:r,reconciliation:i({currency:`JPY`,itemAmounts:e,payments:r}),showEmptyAccountHelper:!1,...n}}function l(e){return[{accountId:d.id,amount:e[0],key:1},{accountId:f.id,amount:e[1],key:2}]}var u,d,f,p,m,h=e((()=>{a(),u=[{currency:`JPY`,id:`00000000-0000-4000-8000-000000000061`,name:`礼品卡`},{currency:`JPY`,id:`00000000-0000-4000-8000-000000000062`,name:`信用卡`},{currency:`USD`,id:`00000000-0000-4000-8000-000000000063`,name:`美元卡`}],[d,f]=u,p={currency:`JPY`,id:`00000000-0000-4000-8000-000000000064`,name:`现金`},m=[`3500`]})),g,_,v,y,b,x,S,C;e((()=>{r(),o(),h(),g={title:`Organisms/Transactions/TransactionPaymentFields`,component:s,args:c({})},_={name:`单账户（默认）`},v={name:`多账户平衡（行数已达同币种账户数）`,args:c({payments:l([`2000`,`1500`])})},y={name:`多账户不平衡`,args:c({payments:l([`2000`,``])})},b={name:`含 0 金额行`,args:c({payments:l([`3500`,`0`])})},x={name:`没有其他同币种账户（不显示添加入口）`,args:c({accountOptions:[u[0],u[2]]})},S={name:`多账户显示错误时保留添加入口`,args:c({accountOptions:[...u,p],fieldError:t[n.paymentTotalMismatch],payments:l([`2000`,``])})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "单账户（默认）"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "多账户平衡（行数已达同币种账户数）",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["2000", "1500"])
  })
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "多账户不平衡",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["2000", ""])
  })
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "含 0 金额行",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["3500", "0"])
  })
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "没有其他同币种账户（不显示添加入口）",
  args: createPaymentFieldsProps({
    accountOptions: [paymentFieldsAccountOptions[0]!, paymentFieldsAccountOptions[2]!]
  })
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "多账户显示错误时保留添加入口",
  args: createPaymentFieldsProps({
    accountOptions: [...paymentFieldsAccountOptions, paymentFieldsCashAccount],
    fieldError: transactionPaymentValidationErrorMessages[transactionErrorCodes.paymentTotalMismatch],
    payments: createPaymentRows(["2000", ""])
  })
}`,...S.parameters?.docs?.source}}},C=[`SingleAccount`,`MultiAccountBalanced`,`MultiAccountUnbalanced`,`MultiAccountWithZeroAmount`,`SingleAccountWithoutAddableAccount`,`MultiAccountWithFieldError`]}))();export{v as MultiAccountBalanced,y as MultiAccountUnbalanced,S as MultiAccountWithFieldError,b as MultiAccountWithZeroAmount,_ as SingleAccount,x as SingleAccountWithoutAddableAccount,C as __namedExportsOrder,g as default};