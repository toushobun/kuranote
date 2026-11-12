import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionLinkCandidatePanel-BccBR2_4.js";import{a as o,i as s,n as c,o as l,r as u,s as d}from"./transactionLinkCandidateFixtures-AC-d_qUv.js";var f,p,m,h,g,_,v,y;t((()=>{f=r(),p=e(n()),i(),c(),m={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:a,args:{accountCurrency:`JPY`,kind:`refund`,merchantId:`amazon`,merchantName:`Amazon`,loadPageAction:u,onChange:()=>void 0,value:null},render:function(e){let[t,n]=(0,p.useState)(e.value);return(0,f.jsx)(a,{...e,value:t,onChange:n})}},h={name:`退款 · 商家三笔支出 · 未选`},g={name:`退款 · 无商家候选回退全部`,args:{loadPageAction:s}},_={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,loadPageAction:o,merchantId:void 0,value:d}},v={name:`编辑 · 已关联原支出不在首页`,args:{value:l}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "退款 · 无商家候选回退全部",
  args: {
    loadPageAction: loadFallbackCandidatePage
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadPageAction: loadReimbursementPage,
    merchantId: undefined,
    value: selectedCandidate
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "编辑 · 已关联原支出不在首页",
  args: {
    value: offPageCandidate
  }
}`,...v.parameters?.docs?.source}}},y=[`Refund`,`RefundFallback`,`Reimbursement`,`EditOffPageSelection`]}))();export{v as EditOffPageSelection,h as Refund,g as RefundFallback,_ as Reimbursement,y as __namedExportsOrder,m as default};