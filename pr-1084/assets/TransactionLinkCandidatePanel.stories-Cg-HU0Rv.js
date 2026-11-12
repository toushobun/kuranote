import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionLinkCandidatePanel-DW1ThhS_.js";import{a as o,c as s,i as c,l,n as u,o as d,r as f}from"./transactionLinkCandidateFixtures-Du3yZPOc.js";var p,m,h,g,_,v,y,b,x;t((()=>{p=r(),m=e(n()),i(),u(),h={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:a,args:{accountCurrency:`JPY`,kind:`refund`,merchantId:`amazon`,merchantName:`Amazon`,loadPageAction:f,onChange:()=>void 0,value:null},render:function(e){let[t,n]=(0,m.useState)(e.value);return(0,p.jsx)(a,{...e,value:t,onChange:n})}},g={name:`退款 · 商家三笔支出 · 未选`},_={name:`退款 · 无商家候选回退全部`,args:{loadPageAction:c}},v={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,loadPageAction:d,merchantId:void 0,value:l}},y={name:`编辑 · 已关联原支出不在首页`,args:{value:s}},b={name:`报销 · 多商家同名明细`,args:{kind:`reimbursement`,loadPageAction:o}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "退款 · 无商家候选回退全部",
  args: {
    loadPageAction: loadFallbackCandidatePage
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadPageAction: loadReimbursementPage,
    merchantId: undefined,
    value: selectedCandidate
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "编辑 · 已关联原支出不在首页",
  args: {
    value: offPageCandidate
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "报销 · 多商家同名明细",
  args: {
    kind: "reimbursement",
    loadPageAction: loadMixedMerchantPage
  }
}`,...b.parameters?.docs?.source}}},x=[`Refund`,`RefundFallback`,`Reimbursement`,`EditOffPageSelection`,`MultipleMerchants`]}))();export{y as EditOffPageSelection,b as MultipleMerchants,g as Refund,_ as RefundFallback,v as Reimbursement,x as __namedExportsOrder,h as default};