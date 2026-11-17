import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{a as i,i as a,n as o,r as s,s as c,t as l}from"./TransactionLinkCandidatePanel-Bhtcy6Fa.js";import{a as u,c as d,i as f,l as p,n as m,o as h,r as g,t as _}from"./transactionLinkCandidateFixtures-C0I3QXCg.js";var v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V;t((()=>{v=r(),y=e(n()),o(),m(),c(),s(),{userEvent:b,within:x}=__STORYBOOK_MODULE_TEST__,S={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:l,args:{accountCurrency:`JPY`,kind:`refund`,merchantId:`amazon`,merchantName:`Amazon`,loadPageAction:g,onChange:()=>void 0,value:null},render:function(e){let[t,n]=(0,y.useState)(e.value);return(0,v.jsx)(l,{...e,value:t,onChange:n})}},C={name:`退款 · 商家三笔支出 · 未选`},w={name:`退款 · 未选收款账户`,args:{accountCurrency:void 0}},T={name:`退款 · 同商家优先 · 包含其他商家`,args:{loadPageAction:f}},E={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,loadPageAction:h,merchantId:void 0,value:p}},D={name:`编辑 · 已关联原支出不在首页`,args:{value:d}},O={name:`报销 · 多商家同名明细`,args:{kind:`reimbursement`,loadPageAction:u}},k={name:`退款 · 部分与全额核销候选`},A={name:`已结清 · 默认收起`},j={name:`已结清 · 展开后显示候选`,play:async({canvasElement:e})=>{let t=x(e);await b.click(await t.findByRole(`button`,{name:`已结清的支出（1 笔）`}))}},M={name:`已结清 · 搜索结果中展开`,play:async({canvasElement:e})=>{let t=x(e);await b.type(t.getByRole(`textbox`,{name:`搜索原支出`}),`外套`),await b.click(await t.findByRole(`button`,{name:`已结清的支出（1 笔）`}))}},N={name:`退款 · 小票锁定优先于历史商家`,args:{loadPageAction:async e=>({...await f(e),historyMerchantIds:[`amazon`]}),lockedAmounts:new Map([[p.id,`200`]])}},P=[{..._[0],merchantId:`lawson`,merchantName:`罗森`},{..._[1],merchantId:`amazon`,merchantName:`Amazon`},{..._[2],merchantId:`family`,merchantName:`全家`},{..._[3],merchantId:`amazon`,merchantName:`Amazon`}],F=async e=>{let t=P.filter(t=>a(t,e.currency,e.query??``)&&(e.settled?Number(t.remainingRefundableAmount)<=0:Number(t.remainingRefundableAmount)>0)),n=e.offset??0;return{items:t.slice(n,n+20),nextOffset:n+20<t.length?n+20:null,settledCount:P.filter(t=>a(t,e.currency,e.query??``)&&Number(t.remainingRefundableAmount)<=0).length,historyMerchantIds:[`lawson`],...n===0?{groupCounts:{history:1,sameMerchant:1,other:1}}:{}}},I={name:`方案 A · 退款 · 历史 / 同商家 / 其他 / 已结清`,args:{loadPageAction:F}},L={name:`方案 A · 报销 · 历史与其他待报销`,args:{kind:`reimbursement`,merchantId:`amazon`,loadPageAction:async e=>({...await F(e),groupCounts:{history:1,sameMerchant:0,other:2}})}},R={name:`方案 A · 入口 B + 已在小票上`,args:{lockedAmounts:new Map([[P[0].id,`200`]]),loadPageAction:F},render:function(e){let[t,n]=(0,y.useState)(e.value);return(0,v.jsx)(i.Provider,{value:{kind:`refund`,merchantId:`amazon`,accountId:`credit`,candidates:[P[2]]},children:(0,v.jsx)(l,{...e,value:t,onChange:n})})}},z={name:`方案 A · 搜索结果平铺`,args:{loadPageAction:F},play:async({canvasElement:e})=>{await b.type(x(e).getByRole(`textbox`,{name:`搜索原支出`}),`全家`)}},B={name:`方案 A · 只有一个可选组`,args:{loadPageAction:async e=>({items:e.settled?[]:[_[0]],nextOffset:null,settledCount:0,groupCounts:{history:0,sameMerchant:1,other:0}})}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选"
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "退款 · 未选收款账户",
  args: {
    accountCurrency: undefined
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "退款 · 同商家优先 · 包含其他商家",
  args: {
    loadPageAction: loadMerchantPriorityPage
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadPageAction: loadReimbursementPage,
    merchantId: undefined,
    value: selectedCandidate
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "编辑 · 已关联原支出不在首页",
  args: {
    value: offPageCandidate
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "报销 · 多商家同名明细",
  args: {
    kind: "reimbursement",
    loadPageAction: loadMixedMerchantPage
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "退款 · 部分与全额核销候选"
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 默认收起"
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 展开后显示候选",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "已结清的支出（1 笔）"
    }));
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "退款 · 小票锁定优先于历史商家",
  args: {
    loadPageAction: async input => ({
      ...(await loadMerchantPriorityPage(input)),
      historyMerchantIds: ["amazon"]
    }),
    lockedAmounts: new Map([[selectedCandidate.id, "200"]])
  }
}`,...N.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "方案 A · 退款 · 历史 / 同商家 / 其他 / 已结清",
  args: {
    loadPageAction: loadGroupedPage
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "方案 A · 报销 · 历史与其他待报销",
  args: {
    kind: "reimbursement",
    merchantId: "amazon",
    loadPageAction: async input => {
      const page = await loadGroupedPage(input);
      return {
        ...page,
        groupCounts: {
          history: 1,
          sameMerchant: 0,
          other: 2
        }
      };
    }
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "方案 A · 入口 B + 已在小票上",
  args: {
    lockedAmounts: new Map([[groupedItems[0].id, "200"]]),
    loadPageAction: loadGroupedPage
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <TransactionOffsetEntryContext.Provider value={{
      kind: "refund",
      merchantId: "amazon",
      accountId: "credit",
      candidates: [groupedItems[2]]
    }}>
        <TransactionLinkCandidatePanel {...args} value={value} onChange={setValue} />
      </TransactionOffsetEntryContext.Provider>;
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "方案 A · 搜索结果平铺",
  args: {
    loadPageAction: loadGroupedPage
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.type(within(canvasElement).getByRole("textbox", {
      name: "搜索原支出"
    }), "全家");
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "方案 A · 只有一个可选组",
  args: {
    loadPageAction: async input => ({
      items: input.settled ? [] : [candidateItems[0]],
      nextOffset: null,
      settledCount: 0,
      groupCounts: {
        history: 0,
        sameMerchant: 1,
        other: 0
      }
    })
  }
}`,...B.parameters?.docs?.source}}},V=[`Refund`,`RefundWithoutAccount`,`RefundMerchantFirst`,`Reimbursement`,`EditOffPageSelection`,`MultipleMerchants`,`PartiallyAndFullySettled`,`SettledCollapsed`,`SettledExpanded`,`SettledSearch`,`DraftLockedFirst`,`GroupedRefund`,`GroupedReimbursement`,`GroupedEntryAndLocked`,`GroupedSearchFlat`,`GroupedSingleGroup`]}))();export{N as DraftLockedFirst,D as EditOffPageSelection,R as GroupedEntryAndLocked,I as GroupedRefund,L as GroupedReimbursement,z as GroupedSearchFlat,B as GroupedSingleGroup,O as MultipleMerchants,k as PartiallyAndFullySettled,C as Refund,T as RefundMerchantFirst,w as RefundWithoutAccount,E as Reimbursement,A as SettledCollapsed,j as SettledExpanded,M as SettledSearch,V as __namedExportsOrder,S as default};