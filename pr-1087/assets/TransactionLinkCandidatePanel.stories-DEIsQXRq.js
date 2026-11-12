import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionLinkCandidatePanel-BwIJtALT.js";import{a as o,c as s,i as c,l,n as u,o as d,r as f}from"./transactionLinkCandidateFixtures-CwKxjk-m.js";var p,m,h,g,_,v,y,b,x,S,C;t((()=>{p=r(),m=e(n()),i(),u(),h={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:a,args:{accountCurrency:`JPY`,kind:`refund`,merchantId:`amazon`,merchantName:`Amazon`,loadPageAction:f,onChange:()=>void 0,value:null},render:function(e){let[t,n]=(0,m.useState)(e.value);return(0,p.jsx)(a,{...e,value:t,onChange:n})}},g={name:`退款 · 商家三笔支出 · 未选`},_={name:`退款 · 未选收款账户`,args:{accountCurrency:void 0}},v={name:`退款 · 无商家候选回退全部`,args:{loadPageAction:c}},y={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,loadPageAction:d,merchantId:void 0,value:l}},b={name:`编辑 · 已关联原支出不在首页`,args:{value:s}},x={name:`报销 · 多商家同名明细`,args:{kind:`reimbursement`,loadPageAction:o}},S={name:`退款 · 部分与全额核销候选`},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "退款 · 未选收款账户",
  args: {
    accountCurrency: undefined
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "退款 · 无商家候选回退全部",
  args: {
    loadPageAction: loadFallbackCandidatePage
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadPageAction: loadReimbursementPage,
    merchantId: undefined,
    value: selectedCandidate
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "编辑 · 已关联原支出不在首页",
  args: {
    value: offPageCandidate
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "报销 · 多商家同名明细",
  args: {
    kind: "reimbursement",
    loadPageAction: loadMixedMerchantPage
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "退款 · 部分与全额核销候选"
}`,...S.parameters?.docs?.source}}},C=[`Refund`,`RefundWithoutAccount`,`RefundFallback`,`Reimbursement`,`EditOffPageSelection`,`MultipleMerchants`,`PartiallyAndFullySettled`]}))();export{b as EditOffPageSelection,x as MultipleMerchants,S as PartiallyAndFullySettled,g as Refund,v as RefundFallback,_ as RefundWithoutAccount,y as Reimbursement,C as __namedExportsOrder,h as default};