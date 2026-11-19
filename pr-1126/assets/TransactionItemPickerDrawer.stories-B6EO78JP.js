import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{r as i,t as a}from"./transaction-KQYSEJfm.js";import{n as o,t as s}from"./TransactionItemPickerDrawer-BMfAAqdS.js";import{c,i as l,l as u,n as d,o as f,r as p,t as m}from"./transactionLinkCandidateFixtures-BNbhOprl.js";var h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B;t((()=>{h=r(),a(),g=e(n()),d(),o(),{expect:_,within:v}=__STORYBOOK_MODULE_TEST__,y=[{id:`expense-gift`,name:`份子钱`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-tip`,name:`小费`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-game`,name:`游戏`,parentId:`expense-fun`,parentName:`玩耍`,type:`expense`},{id:`income-salary`,name:`工资收入`,parentId:`income-fixed`,parentName:`固定收入`,type:`income`}],b=[{categories:y.slice(0,2),id:`expense-social`,name:`人情`},{categories:y.slice(2,3),id:`expense-fun`,name:`玩耍`},{categories:y.slice(3),id:`income-fixed`,name:`固定收入`}],x={title:`Organisms/Transactions/TransactionItemPickerDrawer`,component:s,args:{merchantId:`amazon`,merchantName:`Amazon`,loadRefundPageAction:p,loadReimbursementPageAction:f,categoryGroups:b,filteredCategoryOptions:y,onCategoryToggle:()=>void 0,onClose:()=>void 0,onGroupSelect:()=>void 0,onPickerAdd:()=>!0,onRemoveItem:()=>void 0,onSpecialStatusChange:()=>void 0,open:!0,pickerAmount:`1280`,pickerCategoryId:`expense-tip`,pickerErrors:{},selectedAccountCurrency:`JPY`,selectedCategoryGroup:b[0],pickerSpecialStatus:`pendingReimbursement`,specialStatusEnabled:!0},render:function(e){let[t,n]=(0,g.useState)(e.pickerMode??`expense`),[r,a]=(0,g.useState)(e.pickerRefundCandidate??e.pickerReimbursementCandidate??null),[o,c]=(0,g.useState)(e.pickerAmount);return(0,h.jsx)(s,{...e,pickerMode:t,onPickerModeChange:e=>{n(e),a(null)},pickerRefundCandidate:r,pickerReimbursementCandidate:r,pickerAmount:o,onPickerAmountChange:c,onRefundItemChange:e=>{a(e),c(e?i(e):``)},onReimbursementItemChange:e=>{a(e),c(e?i(e):``)}})},parameters:{layout:`fullscreen`}},S={name:`历史商家优先 · 已添加原支出锁定`,args:{pickerMode:`refund`,loadRefundPageAction:async e=>({...await p(e),items:e.settled?[]:[c,...m.slice(0,3)],historyMerchantIds:[c.merchantId??``]}),lockedLinkAmounts:new Map([[c.id,`750`]])}},C={name:`选择分类`},w={name:`多账户支出：收入分类不可选`,args:{disabledCategoryType:`income`,pickerSpecialStatus:null}},T={name:`多账户收入：支出分类不可选`,args:{disabledCategoryType:`expense`,pickerCategoryId:`system-refund`,pickerMode:`refund`,pickerSpecialStatus:null}},E={name:`退款明细显示关联提示`,args:{linkNotice:`退款明细必须与收款账户币种一致，请重新选择。`,pickerCategoryId:`system-refund`,pickerMode:`refund`,pickerSpecialStatus:null},play:async({canvasElement:e})=>{await _(await v(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`退款明细必须与收款账户币种一致，请重新选择。`)}},D={name:`退款 · 商家三笔支出 · 未选`,args:{pickerMode:`refund`}},O={name:`退款 · 未选收款账户可先选原支出`,args:{pickerMode:`refund`,pickerAmount:``,selectedAccountCurrency:void 0}},k={name:`退款 · 回退全部`,args:{pickerMode:`refund`,loadRefundPageAction:l}},A={name:`报销 · 已选且金额已填`,args:{pickerMode:`reimbursement`,pickerReimbursementCandidate:u,pickerAmount:`3280`}},j={name:`收入`,args:{pickerMode:`income`,pickerCategoryId:`income-salary`,selectedCategoryGroup:b[2]}},M={name:`特殊状态关闭`,args:{specialStatusEnabled:!1}},N={name:`多账户 · 禁用收入退款报销`,args:{multiAccount:!0}},P={name:`编辑 · 已关联原支出不在首页`,args:{pickerMode:`refund`,pickerModeLocked:!0,editingItemId:1,pickerRefundCandidate:c,pickerAmount:`3280`}},F={name:`退款 · 部分退款自动填剩余`,args:{pickerMode:`refund`,pickerRefundCandidate:{...u,id:`partially-settled`,amount:`5000`,refundedAmount:`2000`,remainingRefundableAmount:`3000`},pickerAmount:`3000`}},I={name:`退款 · 已全额退款显示零金额`,args:{pickerMode:`refund`,pickerRefundCandidate:{...u,id:`fully-settled`,refundedAmount:`3280`,remainingRefundableAmount:`0`},pickerAmount:``}},L={...m[2],refundedAmount:`1080`,remainingRefundableAmount:`500`},R={name:`退款 · 剩余 ¥500 / 输入 ¥1,200 / 超额 ¥700`,args:{pickerMode:`refund`,pickerRefundCandidate:L,pickerAmount:`1200`,loadRefundPageAction:async e=>{let t=await p(e);return{...t,items:t.items.map(e=>e.id===L.id?L:e)}}}},z={name:`报销 · 原支出已抵完，后续计入收入`,args:{pickerMode:`reimbursement`,pickerReimbursementCandidate:{...u,remainingRefundableAmount:`0`},pickerAmount:``}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "历史商家优先 · 已添加原支出锁定",
  args: {
    pickerMode: "refund",
    loadRefundPageAction: async input => ({
      ...(await loadCandidatePage(input)),
      items: input.settled ? [] : [offPageCandidate, ...candidateItems.slice(0, 3)],
      historyMerchantIds: [offPageCandidate.merchantId ?? ""]
    }),
    lockedLinkAmounts: new Map([[offPageCandidate.id, "750"]])
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "选择分类"
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "多账户支出：收入分类不可选",
  args: {
    disabledCategoryType: "income",
    pickerSpecialStatus: null
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "多账户收入：支出分类不可选",
  args: {
    disabledCategoryType: "expense",
    pickerCategoryId: "system-refund",
    pickerMode: "refund",
    pickerSpecialStatus: null
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "退款明细显示关联提示",
  args: {
    linkNotice: "退款明细必须与收款账户币种一致，请重新选择。",
    pickerCategoryId: "system-refund",
    pickerMode: "refund",
    pickerSpecialStatus: null
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole("alert")).toHaveTextContent("退款明细必须与收款账户币种一致，请重新选择。");
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选",
  args: {
    pickerMode: "refund"
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "退款 · 未选收款账户可先选原支出",
  args: {
    pickerMode: "refund",
    pickerAmount: "",
    selectedAccountCurrency: undefined
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "退款 · 回退全部",
  args: {
    pickerMode: "refund",
    loadRefundPageAction: loadMerchantPriorityPage
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选且金额已填",
  args: {
    pickerMode: "reimbursement",
    pickerReimbursementCandidate: selectedCandidate,
    pickerAmount: "3280"
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "收入",
  args: {
    pickerMode: "income",
    pickerCategoryId: "income-salary",
    selectedCategoryGroup: categoryGroups[2]
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "特殊状态关闭",
  args: {
    specialStatusEnabled: false
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "多账户 · 禁用收入退款报销",
  args: {
    multiAccount: true
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "编辑 · 已关联原支出不在首页",
  args: {
    pickerMode: "refund",
    pickerModeLocked: true,
    editingItemId: 1,
    pickerRefundCandidate: offPageCandidate,
    pickerAmount: "3280"
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "退款 · 部分退款自动填剩余",
  args: {
    pickerMode: "refund",
    pickerRefundCandidate: {
      ...selectedCandidate,
      id: "partially-settled",
      amount: "5000",
      refundedAmount: "2000",
      remainingRefundableAmount: "3000"
    },
    pickerAmount: "3000"
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "退款 · 已全额退款显示零金额",
  args: {
    pickerMode: "refund",
    pickerRefundCandidate: {
      ...selectedCandidate,
      id: "fully-settled",
      refundedAmount: "3280",
      remainingRefundableAmount: "0"
    },
    pickerAmount: ""
  }
}`,...I.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "退款 · 剩余 ¥500 / 输入 ¥1,200 / 超额 ¥700",
  args: {
    pickerMode: "refund",
    pickerRefundCandidate: partiallyRefundedStorageBox,
    pickerAmount: "1200",
    loadRefundPageAction: async input => {
      const page = await loadCandidatePage(input);
      return {
        ...page,
        items: page.items.map(item => item.id === partiallyRefundedStorageBox.id ? partiallyRefundedStorageBox : item)
      };
    }
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "报销 · 原支出已抵完，后续计入收入",
  args: {
    pickerMode: "reimbursement",
    pickerReimbursementCandidate: {
      ...selectedCandidate,
      remainingRefundableAmount: "0"
    },
    pickerAmount: ""
  }
}`,...z.parameters?.docs?.source}}},B=[`MerchantHistoryAndLockedCandidate`,`Default`,`IncomeCategoriesDisabled`,`ExpenseCategoriesDisabled`,`RefundLinkNotice`,`Refund`,`RefundWithoutAccount`,`RefundFallback`,`Reimbursement`,`Income`,`SpecialStatusOff`,`MultiAccount`,`EditOffPageSelection`,`RefundPartiallySettled`,`RefundFullySettled`,`RefundWithSurplus1078`,`ReimbursementFullySettled1078`]}))();export{C as Default,P as EditOffPageSelection,T as ExpenseCategoriesDisabled,j as Income,w as IncomeCategoriesDisabled,S as MerchantHistoryAndLockedCandidate,N as MultiAccount,D as Refund,k as RefundFallback,I as RefundFullySettled,E as RefundLinkNotice,F as RefundPartiallySettled,R as RefundWithSurplus1078,O as RefundWithoutAccount,A as Reimbursement,z as ReimbursementFullySettled1078,M as SpecialStatusOff,B as __namedExportsOrder,x as default};