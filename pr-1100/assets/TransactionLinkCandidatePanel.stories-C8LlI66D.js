import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionLinkCandidatePanel-zyMDbMya.js";import{a as o,c as s,i as c,l,n as u,o as d,r as f}from"./transactionLinkCandidateFixtures-D35GQOAL.js";var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O;t((()=>{p=r(),m=e(n()),i(),u(),{userEvent:h,within:g}=__STORYBOOK_MODULE_TEST__,_={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:a,args:{accountCurrency:`JPY`,kind:`refund`,merchantId:`amazon`,merchantName:`Amazon`,loadPageAction:f,onChange:()=>void 0,value:null},render:function(e){let[t,n]=(0,m.useState)(e.value);return(0,p.jsx)(a,{...e,value:t,onChange:n})}},v={name:`退款 · 商家三笔支出 · 未选`},y={name:`退款 · 未选收款账户`,args:{accountCurrency:void 0}},b={name:`退款 · 同商家优先 · 包含其他商家`,args:{loadPageAction:c}},x={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,loadPageAction:d,merchantId:void 0,value:l}},S={name:`编辑 · 已关联原支出不在首页`,args:{value:s}},C={name:`报销 · 多商家同名明细`,args:{kind:`reimbursement`,loadPageAction:o}},w={name:`退款 · 部分与全额核销候选`},T={name:`已结清 · 默认收起`},E={name:`已结清 · 展开后显示候选`,play:async({canvasElement:e})=>{let t=g(e);await h.click(await t.findByRole(`button`,{name:`已结清的支出（1 笔）`}))}},D={name:`已结清 · 搜索结果中展开`,play:async({canvasElement:e})=>{let t=g(e);await h.type(t.getByRole(`textbox`,{name:`搜索原支出`}),`外套`),await h.click(await t.findByRole(`button`,{name:`已结清的支出（1 笔）`}))}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选"
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "退款 · 未选收款账户",
  args: {
    accountCurrency: undefined
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "退款 · 同商家优先 · 包含其他商家",
  args: {
    loadPageAction: loadMerchantPriorityPage
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadPageAction: loadReimbursementPage,
    merchantId: undefined,
    value: selectedCandidate
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "编辑 · 已关联原支出不在首页",
  args: {
    value: offPageCandidate
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "报销 · 多商家同名明细",
  args: {
    kind: "reimbursement",
    loadPageAction: loadMixedMerchantPage
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "退款 · 部分与全额核销候选"
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 默认收起"
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 展开后显示候选",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "已结清的支出（1 笔）"
    }));
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 搜索结果中展开",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", {
      name: "搜索原支出"
    }), "外套");
    await userEvent.click(await canvas.findByRole("button", {
      name: "已结清的支出（1 笔）"
    }));
  }
}`,...D.parameters?.docs?.source}}},O=[`Refund`,`RefundWithoutAccount`,`RefundMerchantFirst`,`Reimbursement`,`EditOffPageSelection`,`MultipleMerchants`,`PartiallyAndFullySettled`,`SettledCollapsed`,`SettledExpanded`,`SettledSearch`]}))();export{S as EditOffPageSelection,C as MultipleMerchants,w as PartiallyAndFullySettled,v as Refund,b as RefundMerchantFirst,y as RefundWithoutAccount,x as Reimbursement,T as SettledCollapsed,E as SettledExpanded,D as SettledSearch,O as __namedExportsOrder,_ as default};