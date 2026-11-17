import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{a as i,i as a,n as o,r as s,s as c,t as l}from"./TransactionLinkCandidatePanel-BvgPvJhN.js";import{a as u,c as d,i as f,l as p,n as m,o as h,p as g,r as _,t as v,u as y}from"./transactionLinkCandidateFixtures-BNbhOprl.js";var b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q;t((()=>{b=r(),x=e(n()),o(),m(),c(),s(),g(),{userEvent:S,within:C}=__STORYBOOK_MODULE_TEST__,w={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:l,args:{accountCurrency:`JPY`,kind:`refund`,merchantId:`amazon`,merchantName:`Amazon`,loadPageAction:_,onChange:()=>void 0,value:null},render:function(e){let[t,n]=(0,x.useState)(e.value),[r,i]=(0,x.useState)(e.month??`2026-11`);return(0,b.jsx)(l,{...e,month:r,onMonthChange:i,value:t,onChange:n})}},T={name:`退款 · 商家三笔支出 · 未选`},E={name:`退款 · 未选收款账户`,args:{accountCurrency:void 0}},D={name:`退款 · 同商家优先 · 包含其他商家`,args:{loadPageAction:f}},O={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,loadPageAction:h,merchantId:void 0,value:p}},k={name:`编辑 · 已关联原支出不在首页`,args:{value:d}},A={name:`报销 · 多商家同名明细`,args:{kind:`reimbursement`,loadPageAction:u}},j={name:`退款 · 部分与全额核销候选`},M={name:`已结清 · 默认收起`},N={name:`已结清 · 展开后显示候选`,play:async({canvasElement:e})=>{let t=C(e);await S.click(await t.findByRole(`button`,{name:`已结清的支出（1 笔）`}))}},P={name:`已结清 · 搜索结果中展开`,play:async({canvasElement:e})=>{let t=C(e);await S.type(t.getByRole(`textbox`,{name:`搜索原支出`}),`外套`),await S.click(await t.findByRole(`button`,{name:`已结清的支出（1 笔）`}))}},F={name:`退款 · 小票锁定优先于历史商家`,args:{loadPageAction:async e=>({...await f(e),historyMerchantIds:[`amazon`]}),lockedAmounts:new Map([[p.id,`200`]])}},I=[{...v[0],merchantId:`lawson`,merchantName:`罗森`},{...v[1],merchantId:`amazon`,merchantName:`Amazon`},{...v[2],merchantId:`family`,merchantName:`全家`,transactionAt:`2026-11-05T09:00:00Z`},{...v[3],merchantId:`amazon`,merchantName:`Amazon`,transactionAt:`2026-11-04T09:00:00Z`}],L=async e=>{let t=I.filter(t=>a(t,e.currency,e.query??``)&&y(t.transactionAt,e.month??null)&&(e.settled?Number(t.remainingRefundableAmount)<=0:Number(t.remainingRefundableAmount)>0)),n=e.offset??0;return{items:t.slice(n,n+20),nextOffset:n+20<t.length?n+20:null,settledCount:I.filter(t=>a(t,e.currency,e.query??``)&&y(t.transactionAt,e.month??null)&&Number(t.remainingRefundableAmount)<=0).length,historyMerchantIds:[`lawson`],...n===0?{groupCounts:e.month&&e.month!==`2026-11`?{history:0,sameMerchant:0,other:0,partial:0}:{history:1,sameMerchant:1,other:0,partial:1}}:{}}},R={name:`退款 · 同商家 / 常退商家 / 部分结清 / 已结清`,args:{loadPageAction:L}},z={name:`方案 A · 报销 · 历史与其他待报销`,args:{kind:`reimbursement`,merchantId:`amazon`,loadPageAction:async e=>({...await L(e),groupCounts:{history:1,sameMerchant:0,other:1,partial:1}})}},B={name:`方案 A · 入口 B + 已在小票上`,args:{lockedAmounts:new Map([[I[0].id,`200`]]),loadPageAction:L},render:function(e){let[t,n]=(0,x.useState)(e.value),[r,a]=(0,x.useState)(e.month??`2026-11`);return(0,b.jsx)(i.Provider,{value:{kind:`refund`,merchantId:`amazon`,accountId:`credit`,candidates:[I[2]]},children:(0,b.jsx)(l,{...e,month:r,onMonthChange:a,value:t,onChange:n})})}},V={name:`方案 A · 搜索结果平铺`,args:{loadPageAction:L},play:async({canvasElement:e})=>{await S.type(C(e).getByRole(`textbox`,{name:`搜索原支出`}),`全家`)}},H={name:`方案 A · 只有一个可选组`,args:{loadPageAction:async e=>({items:e.settled?[]:[v[0]],nextOffset:null,settledCount:0,groupCounts:{history:0,sameMerchant:1,other:0,partial:0}})}},U={name:`月份 · 平时按本月分组`,args:{loadPageAction:L}},W={name:`月份 · 搜索全部月份`,play:async({canvasElement:e})=>{await S.type(C(e).getByRole(`textbox`,{name:`搜索原支出`}),`充电器`)}},G={name:`月份 · 搜索时指定月份`,play:async({canvasElement:e})=>{let t=C(e);await S.type(t.getByRole(`textbox`,{name:`搜索原支出`}),`充电器`),await S.click(t.getByRole(`button`,{name:`选择月份`}));let n=C(e.ownerDocument.body);await S.click(await n.findByRole(`button`,{name:`选择 8 月`})),await S.click(n.getByRole(`button`,{name:`确定年月`}))}},K={name:`月份 · 空月份`,args:{month:`2026-02`,loadPageAction:async()=>({items:[],nextOffset:null,settledCount:0,groupCounts:{history:0,sameMerchant:0,other:0,partial:0}})}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选"
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "退款 · 未选收款账户",
  args: {
    accountCurrency: undefined
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "退款 · 同商家优先 · 包含其他商家",
  args: {
    loadPageAction: loadMerchantPriorityPage
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadPageAction: loadReimbursementPage,
    merchantId: undefined,
    value: selectedCandidate
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "编辑 · 已关联原支出不在首页",
  args: {
    value: offPageCandidate
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "报销 · 多商家同名明细",
  args: {
    kind: "reimbursement",
    loadPageAction: loadMixedMerchantPage
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "退款 · 部分与全额核销候选"
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 默认收起"
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 展开后显示候选",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "已结清的支出（1 笔）"
    }));
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "退款 · 小票锁定优先于历史商家",
  args: {
    loadPageAction: async input => ({
      ...(await loadMerchantPriorityPage(input)),
      historyMerchantIds: ["amazon"]
    }),
    lockedAmounts: new Map([[selectedCandidate.id, "200"]])
  }
}`,...F.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "退款 · 同商家 / 常退商家 / 部分结清 / 已结清",
  args: {
    loadPageAction: loadGroupedPage
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
          other: 1,
          partial: 1
        }
      };
    }
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "方案 A · 入口 B + 已在小票上",
  args: {
    lockedAmounts: new Map([[groupedItems[0].id, "200"]]),
    loadPageAction: loadGroupedPage
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    const [month, setMonth] = useState(args.month ?? "2026-11");
    return <TransactionOffsetEntryContext.Provider value={{
      kind: "refund",
      merchantId: "amazon",
      accountId: "credit",
      candidates: [groupedItems[2]]
    }}>
        <TransactionLinkCandidatePanel {...args} month={month} onMonthChange={setMonth} value={value} onChange={setValue} />
      </TransactionOffsetEntryContext.Provider>;
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "方案 A · 只有一个可选组",
  args: {
    loadPageAction: async input => ({
      items: input.settled ? [] : [candidateItems[0]],
      nextOffset: null,
      settledCount: 0,
      groupCounts: {
        history: 0,
        sameMerchant: 1,
        other: 0,
        partial: 0
      }
    })
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "月份 · 平时按本月分组",
  args: {
    loadPageAction: loadGroupedPage
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "月份 · 搜索全部月份",
  play: async ({
    canvasElement
  }) => {
    await userEvent.type(within(canvasElement).getByRole("textbox", {
      name: "搜索原支出"
    }), "充电器");
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "月份 · 搜索时指定月份",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", {
      name: "搜索原支出"
    }), "充电器");
    await userEvent.click(canvas.getByRole("button", {
      name: "选择月份"
    }));
    const dialog = within(canvasElement.ownerDocument.body);
    await userEvent.click(await dialog.findByRole("button", {
      name: "选择 8 月"
    }));
    await userEvent.click(dialog.getByRole("button", {
      name: "确定年月"
    }));
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "月份 · 空月份",
  args: {
    month: "2026-02",
    loadPageAction: async () => ({
      items: [],
      nextOffset: null,
      settledCount: 0,
      groupCounts: {
        history: 0,
        sameMerchant: 0,
        other: 0,
        partial: 0
      }
    })
  }
}`,...K.parameters?.docs?.source}}},q=[`Refund`,`RefundWithoutAccount`,`RefundMerchantFirst`,`Reimbursement`,`EditOffPageSelection`,`MultipleMerchants`,`PartiallyAndFullySettled`,`SettledCollapsed`,`SettledExpanded`,`SettledSearch`,`DraftLockedFirst`,`GroupedRefund`,`GroupedReimbursement`,`GroupedEntryAndLocked`,`GroupedSearchFlat`,`GroupedSingleGroup`,`NormalMonth`,`SearchAllMonths`,`SearchSelectedMonth`,`EmptyMonth`]}))();export{F as DraftLockedFirst,k as EditOffPageSelection,K as EmptyMonth,B as GroupedEntryAndLocked,R as GroupedRefund,z as GroupedReimbursement,V as GroupedSearchFlat,H as GroupedSingleGroup,A as MultipleMerchants,U as NormalMonth,j as PartiallyAndFullySettled,T as Refund,D as RefundMerchantFirst,E as RefundWithoutAccount,O as Reimbursement,W as SearchAllMonths,G as SearchSelectedMonth,M as SettledCollapsed,N as SettledExpanded,P as SettledSearch,q as __namedExportsOrder,w as default};