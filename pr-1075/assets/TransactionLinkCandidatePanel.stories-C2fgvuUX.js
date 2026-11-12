import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionLinkCandidatePanel-C7Pf3gau.js";import{a as o,i as s,n as c,o as l,r as u,t as d}from"./transactionLinkCandidateFixtures-CCopLNRt.js";var f,p,m,h,g,_,v;t((()=>{f=r(),p=e(n()),i(),d(),m={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:a,args:{accountCurrency:`JPY`,kind:`refund`,merchantId:`amazon`,merchantName:`Amazon`,loadInitialViewAction:u,loadSearchPageAction:c,onChange:()=>void 0,value:null},render:function(e){let[t,n]=(0,p.useState)(e.value);return(0,f.jsx)(a,{...e,value:t,onChange:n})}},h={name:`退款 · 商家三笔支出 · 未选`},g={name:`退款 · 无商家候选回退全部`,args:{loadInitialViewAction:s}},_={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,loadInitialViewAction:o,merchantId:void 0,value:l}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "退款 · 无商家候选回退全部",
  args: {
    loadInitialViewAction: loadFallbackCandidateView
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadInitialViewAction: loadReimbursementView,
    merchantId: undefined,
    value: selectedCandidate
  }
}`,..._.parameters?.docs?.source}}},v=[`Refund`,`RefundFallback`,`Reimbursement`]}))();export{h as Refund,g as RefundFallback,_ as Reimbursement,v as __namedExportsOrder,m as default};