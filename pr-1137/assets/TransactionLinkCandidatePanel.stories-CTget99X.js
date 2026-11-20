import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{a as i,i as a,n as o,r as s,s as c,t as l}from"./TransactionLinkCandidatePanel-Cm9Ds_Fs.js";import{a as u,c as d,i as f,l as p,n as m,o as ee,p as te,r as h,t as g,u as _}from"./transactionLinkCandidateFixtures-BsZvSKOB.js";async function v(e){await w.type(E(e).getByRole(`textbox`,{name:`搜索原支出`}),`充电器`)}async function y(e){await w.click(await E(e).findByRole(`button`,{name:`选择月份`}))}async function b(e){await v(e),await y(e);let t=E(e.ownerDocument.body);await w.click(await t.findByRole(`button`,{name:`选择 2026 年`})),await w.click(t.getByRole(`button`,{name:`选择 8 月`})),await w.click(t.getByRole(`button`,{name:`确定年月`})),await T(()=>{C(e.ownerDocument.querySelector(`[role="dialog"]`)).toBeNull()})}var x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{x=r(),S=e(n()),o(),m(),c(),s(),te(),{expect:C,userEvent:w,waitFor:T,within:E}=__STORYBOOK_MODULE_TEST__,D={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:l,args:{accountCurrency:`JPY`,kind:`refund`,merchantId:`amazon`,merchantName:`Amazon`,loadPageAction:h,onChange:()=>void 0,value:null},render:function(e){let[t,n]=(0,S.useState)(e.value),[r,i]=(0,S.useState)(e.month??`2026-11`);return(0,x.jsx)(l,{...e,month:r,onMonthChange:i,value:t,onChange:n})}},O={name:`退款 · 商家三笔支出 · 未选`},k={name:`退款 · 未选收款账户`,args:{accountCurrency:void 0}},A={name:`退款 · 同商家优先 · 包含其他商家`,args:{loadPageAction:f}},j={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,loadPageAction:ee,merchantId:void 0,value:p}},M={name:`编辑 · 已关联原支出不在首页`,args:{value:d}},N={name:`报销 · 多商家同名明细`,args:{kind:`reimbursement`,loadPageAction:u}},P={name:`退款 · 部分与全额核销候选`},F={name:`已结清 · 默认收起`},I={name:`已结清 · 展开后显示候选`,play:async({canvasElement:e})=>{let t=E(e);await w.click(await t.findByRole(`button`,{name:`已结清的支出（1 笔）`}))}},L={name:`已结清 · 搜索结果中展开`,play:async({canvasElement:e})=>{let t=E(e);await w.type(t.getByRole(`textbox`,{name:`搜索原支出`}),`外套`),await w.click(await t.findByRole(`button`,{name:`已结清的支出（1 笔）`}))}},R={name:`退款 · 小票锁定优先于历史商家`,args:{loadPageAction:async e=>({...await f(e),historyMerchantIds:[`amazon`]}),lockedAmounts:new Map([[p.id,`200`]])}},z=[{...g[0],merchantId:`lawson`,merchantName:`罗森`},{...g[1],merchantId:`amazon`,merchantName:`Amazon`},{...g[2],merchantId:`family`,merchantName:`全家`,transactionAt:`2026-11-05T09:00:00Z`},{...g[3],merchantId:`amazon`,merchantName:`Amazon`,transactionAt:`2026-11-04T09:00:00Z`}],B=async e=>{let t=z.filter(t=>a(t,e.currency,e.query??``)&&_(t.transactionAt,e.month??null)&&(e.settled?Number(t.remainingRefundableAmount)<=0:Number(t.remainingRefundableAmount)>0)),n=e.offset??0;return{items:t.slice(n,n+20),nextOffset:n+20<t.length?n+20:null,settledCount:z.filter(t=>a(t,e.currency,e.query??``)&&_(t.transactionAt,e.month??null)&&Number(t.remainingRefundableAmount)<=0).length,historyMerchantIds:[`lawson`],...n===0?{groupCounts:e.month&&e.month!==`2026-11`?{history:0,sameMerchant:0,other:0,partial:0}:{history:1,sameMerchant:1,other:0,partial:1}}:{}}},V={name:`退款 · 同商家 / 常退商家 / 部分结清 / 已结清`,args:{loadPageAction:B}},H={name:`方案 A · 报销 · 历史与其他待报销`,args:{kind:`reimbursement`,merchantId:`amazon`,loadPageAction:async e=>({...await B(e),groupCounts:{history:1,sameMerchant:0,other:1,partial:1}})}},U={name:`方案 A · 入口 B + 已在小票上`,args:{lockedAmounts:new Map([[z[0].id,`200`]]),loadPageAction:B},render:function(e){let[t,n]=(0,S.useState)(e.value),[r,a]=(0,S.useState)(e.month??`2026-11`);return(0,x.jsx)(i.Provider,{value:{kind:`refund`,merchantId:`amazon`,accountId:`credit`,candidates:[z[2]]},children:(0,x.jsx)(l,{...e,month:r,onMonthChange:a,value:t,onChange:n})})}},W={name:`方案 A · 搜索结果平铺`,args:{loadPageAction:B},play:async({canvasElement:e})=>{await w.type(E(e).getByRole(`textbox`,{name:`搜索原支出`}),`全家`)}},G={name:`方案 A · 只有一个可选组`,args:{loadPageAction:async e=>({items:e.settled?[]:[g[0]],nextOffset:null,settledCount:0,groupCounts:{history:0,sameMerchant:1,other:0,partial:0}})}},K={name:`月份 · 平时按本月分组`,args:{loadPageAction:B}},q={name:`月份滚轮 · 平时`,play:async({canvasElement:e})=>{await y(e)}},J={name:`月份 · 搜索全部月份`,play:async({canvasElement:e})=>{await v(e)}},Y={name:`月份滚轮 · 搜索全部月份`,play:async({canvasElement:e})=>{await v(e),await y(e)}},X={name:`月份 · 搜索时指定月份`,play:async({canvasElement:e})=>{await b(e)}},Z={name:`月份滚轮 · 搜索时指定月份`,play:async({canvasElement:e})=>{await b(e),await y(e);let t=E(e.ownerDocument.body);await t.findByRole(`button`,{name:`选择 2026 年`}),await t.findByRole(`button`,{name:`选择 8 月`})}},Q={name:`月份 · 空月份`,args:{month:`2026-02`,loadPageAction:async()=>({items:[],nextOffset:null,settledCount:0,groupCounts:{history:0,sameMerchant:0,other:0,partial:0}})}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选"
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "退款 · 未选收款账户",
  args: {
    accountCurrency: undefined
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "退款 · 同商家优先 · 包含其他商家",
  args: {
    loadPageAction: loadMerchantPriorityPage
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadPageAction: loadReimbursementPage,
    merchantId: undefined,
    value: selectedCandidate
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "编辑 · 已关联原支出不在首页",
  args: {
    value: offPageCandidate
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "报销 · 多商家同名明细",
  args: {
    kind: "reimbursement",
    loadPageAction: loadMixedMerchantPage
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "退款 · 部分与全额核销候选"
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 默认收起"
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "已结清 · 展开后显示候选",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "已结清的支出（1 笔）"
    }));
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "退款 · 小票锁定优先于历史商家",
  args: {
    loadPageAction: async input => ({
      ...(await loadMerchantPriorityPage(input)),
      historyMerchantIds: ["amazon"]
    }),
    lockedAmounts: new Map([[selectedCandidate.id, "200"]])
  }
}`,...R.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "退款 · 同商家 / 常退商家 / 部分结清 / 已结清",
  args: {
    loadPageAction: loadGroupedPage
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
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
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
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
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
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
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
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
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "月份 · 平时按本月分组",
  args: {
    loadPageAction: loadGroupedPage
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "月份滚轮 · 平时",
  play: async ({
    canvasElement
  }) => {
    await openCandidateMonthPicker(canvasElement);
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "月份 · 搜索全部月份",
  play: async ({
    canvasElement
  }) => {
    await enterMonthSearch(canvasElement);
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "月份滚轮 · 搜索全部月份",
  play: async ({
    canvasElement
  }) => {
    await enterMonthSearch(canvasElement);
    await openCandidateMonthPicker(canvasElement);
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "月份 · 搜索时指定月份",
  play: async ({
    canvasElement
  }) => {
    await selectSearchMonth(canvasElement);
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "月份滚轮 · 搜索时指定月份",
  play: async ({
    canvasElement
  }) => {
    await selectSearchMonth(canvasElement);
    await openCandidateMonthPicker(canvasElement);
    const dialog = within(canvasElement.ownerDocument.body);
    await dialog.findByRole("button", {
      name: "选择 2026 年"
    });
    await dialog.findByRole("button", {
      name: "选择 8 月"
    });
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$=[`Refund`,`RefundWithoutAccount`,`RefundMerchantFirst`,`Reimbursement`,`EditOffPageSelection`,`MultipleMerchants`,`PartiallyAndFullySettled`,`SettledCollapsed`,`SettledExpanded`,`SettledSearch`,`DraftLockedFirst`,`GroupedRefund`,`GroupedReimbursement`,`GroupedEntryAndLocked`,`GroupedSearchFlat`,`GroupedSingleGroup`,`NormalMonth`,`NormalMonthPickerOpen`,`SearchAllMonths`,`SearchAllMonthsPickerOpen`,`SearchSelectedMonth`,`SearchSelectedMonthPickerOpen`,`EmptyMonth`]}))();export{R as DraftLockedFirst,M as EditOffPageSelection,Q as EmptyMonth,U as GroupedEntryAndLocked,V as GroupedRefund,H as GroupedReimbursement,W as GroupedSearchFlat,G as GroupedSingleGroup,N as MultipleMerchants,K as NormalMonth,q as NormalMonthPickerOpen,P as PartiallyAndFullySettled,O as Refund,A as RefundMerchantFirst,k as RefundWithoutAccount,j as Reimbursement,J as SearchAllMonths,Y as SearchAllMonthsPickerOpen,X as SearchSelectedMonth,Z as SearchSelectedMonthPickerOpen,F as SettledCollapsed,I as SettledExpanded,L as SettledSearch,$ as __namedExportsOrder,D as default};