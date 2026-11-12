import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{a as i,t as a}from"./transactionMessages-C2AwAcDE.js";import{n as o,t as s}from"./TransactionItemPickerDrawer-BccffptI.js";import{a as c,i as l,n as u,o as d,r as f,t as p}from"./transactionLinkCandidateFixtures-CCopLNRt.js";var m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M;t((()=>{m=r(),h=e(n()),p(),a(),o(),{expect:g,within:_}=__STORYBOOK_MODULE_TEST__,v=[{id:`expense-gift`,name:`份子钱`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-tip`,name:`小费`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-game`,name:`游戏`,parentId:`expense-fun`,parentName:`玩耍`,type:`expense`},{id:`income-salary`,name:`工资收入`,parentId:`income-fixed`,parentName:`固定收入`,type:`income`}],y=[{categories:v.slice(0,2),id:`expense-social`,name:`人情`},{categories:v.slice(2,3),id:`expense-fun`,name:`玩耍`},{categories:v.slice(3),id:`income-fixed`,name:`固定收入`}],b={title:`Organisms/Transactions/TransactionItemPickerDrawer`,component:s,args:{merchantId:`amazon`,merchantName:`Amazon`,loadRefundInitialViewAction:f,loadReimbursementInitialViewAction:c,loadRefundSearchPageAction:u,loadReimbursementSearchPageAction:u,categoryGroups:y,filteredCategoryOptions:v,onCategoryToggle:()=>void 0,onClose:()=>void 0,onGroupSelect:()=>void 0,onPickerAdd:()=>!0,onRemoveItem:()=>void 0,onSpecialStatusChange:()=>void 0,open:!0,pickerAmount:`1280`,pickerCategoryId:`expense-tip`,pickerErrors:{},selectedAccountCurrency:`JPY`,selectedCategoryGroup:y[0],pickerSpecialStatus:`pendingReimbursement`,specialStatusEnabled:!0},render:function(e){let[t,n]=(0,h.useState)(e.pickerMode??`expense`),[r,i]=(0,h.useState)(e.pickerRefundCandidate??e.pickerReimbursementCandidate??null),[a,o]=(0,h.useState)(e.pickerAmount);return(0,m.jsx)(s,{...e,pickerMode:t,onPickerModeChange:e=>{n(e),i(null)},pickerRefundCandidate:r,pickerReimbursementCandidate:r,pickerAmount:a,onPickerAmountChange:o,onRefundItemChange:e=>{i(e),o(e?.remainingRefundableAmount??``)},onReimbursementItemChange:e=>{i(e),o(e?.remainingRefundableAmount??``)}})},parameters:{layout:`fullscreen`}},x={name:`选择分类`},S={name:`多账户支出：收入分类不可选`,args:{disabledCategoryType:`income`,pickerSpecialStatus:null}},C={name:`多账户收入：支出分类不可选`,args:{disabledCategoryType:`expense`,pickerCategoryId:`system-refund`,pickerMode:`refund`,pickerSpecialStatus:null}},w={name:`退款明细显示关联提示`,args:{linkNotice:`退款明细必须与收款账户币种一致，请重新选择。`,pickerCategoryId:`system-refund`,pickerMode:`refund`,pickerSpecialStatus:null},play:async({canvasElement:e})=>{await g(await _(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`退款明细必须与收款账户币种一致，请重新选择。`)}},T={name:`未选账户时选择关联候选的提示`,args:{linkNotice:i.candidateAccountRequired(`refund`),pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:y[y.length-1]},play:async({canvasElement:e})=>{await g(await _(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`请先选择账户，再选择退款明细。`)}},E={name:`退款 · 商家三笔支出 · 未选`,args:{pickerMode:`refund`}},D={name:`退款 · 回退全部`,args:{pickerMode:`refund`,loadRefundInitialViewAction:l}},O={name:`报销 · 已选且金额已填`,args:{pickerMode:`reimbursement`,pickerReimbursementCandidate:d,pickerAmount:`3280`}},k={name:`收入`,args:{pickerMode:`income`,pickerCategoryId:`income-salary`,selectedCategoryGroup:y[2]}},A={name:`特殊状态关闭`,args:{specialStatusEnabled:!1}},j={name:`多账户 · 禁用收入退款报销`,args:{multiAccount:!0}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "选择分类"
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "多账户支出：收入分类不可选",
  args: {
    disabledCategoryType: "income",
    pickerSpecialStatus: null
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "多账户收入：支出分类不可选",
  args: {
    disabledCategoryType: "expense",
    pickerCategoryId: "system-refund",
    pickerMode: "refund",
    pickerSpecialStatus: null
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "未选账户时选择关联候选的提示",
  args: {
    linkNotice: transactionLinkMessages.candidateAccountRequired("refund"),
    pickerCategoryId: "income-salary",
    pickerSpecialStatus: null,
    selectedCategoryGroup: categoryGroups[categoryGroups.length - 1]
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole("alert")).toHaveTextContent("请先选择账户，再选择退款明细。");
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选",
  args: {
    pickerMode: "refund"
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "退款 · 回退全部",
  args: {
    pickerMode: "refund",
    loadRefundInitialViewAction: loadFallbackCandidateView
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选且金额已填",
  args: {
    pickerMode: "reimbursement",
    pickerReimbursementCandidate: selectedCandidate,
    pickerAmount: "3280"
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "收入",
  args: {
    pickerMode: "income",
    pickerCategoryId: "income-salary",
    selectedCategoryGroup: categoryGroups[2]
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "特殊状态关闭",
  args: {
    specialStatusEnabled: false
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "多账户 · 禁用收入退款报销",
  args: {
    multiAccount: true
  }
}`,...j.parameters?.docs?.source}}},M=[`Default`,`IncomeCategoriesDisabled`,`ExpenseCategoriesDisabled`,`RefundLinkNotice`,`RefundLinkAccountRequiredNotice`,`Refund`,`RefundFallback`,`Reimbursement`,`Income`,`SpecialStatusOff`,`MultiAccount`]}))();export{x as Default,C as ExpenseCategoriesDisabled,k as Income,S as IncomeCategoriesDisabled,j as MultiAccount,E as Refund,D as RefundFallback,T as RefundLinkAccountRequiredNotice,w as RefundLinkNotice,O as Reimbursement,A as SpecialStatusOff,M as __namedExportsOrder,b as default};