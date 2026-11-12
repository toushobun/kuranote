import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{a as i,t as a}from"./transactionMessages-C2AwAcDE.js";import{n as o,t as s}from"./transaction-DvMvMyEF.js";import{n as c,t as l}from"./TransactionItemPickerDrawer-DqA7ZAJi.js";import{a as u,i as d,n as f,o as p,r as m,s as h}from"./transactionLinkCandidateFixtures-AC-d_qUv.js";var g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F;t((()=>{g=r(),s(),_=e(n()),f(),a(),c(),{expect:v,within:y}=__STORYBOOK_MODULE_TEST__,b=[{id:`expense-gift`,name:`份子钱`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-tip`,name:`小费`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-game`,name:`游戏`,parentId:`expense-fun`,parentName:`玩耍`,type:`expense`},{id:`income-salary`,name:`工资收入`,parentId:`income-fixed`,parentName:`固定收入`,type:`income`}],x=[{categories:b.slice(0,2),id:`expense-social`,name:`人情`},{categories:b.slice(2,3),id:`expense-fun`,name:`玩耍`},{categories:b.slice(3),id:`income-fixed`,name:`固定收入`}],S={title:`Organisms/Transactions/TransactionItemPickerDrawer`,component:l,args:{merchantId:`amazon`,merchantName:`Amazon`,loadRefundPageAction:m,loadReimbursementPageAction:u,categoryGroups:x,filteredCategoryOptions:b,onCategoryToggle:()=>void 0,onClose:()=>void 0,onGroupSelect:()=>void 0,onPickerAdd:()=>!0,onRemoveItem:()=>void 0,onSpecialStatusChange:()=>void 0,open:!0,pickerAmount:`1280`,pickerCategoryId:`expense-tip`,pickerErrors:{},selectedAccountCurrency:`JPY`,selectedCategoryGroup:x[0],pickerSpecialStatus:`pendingReimbursement`,specialStatusEnabled:!0},render:function(e){let[t,n]=(0,_.useState)(e.pickerMode??`expense`),[r,i]=(0,_.useState)(e.pickerRefundCandidate??e.pickerReimbursementCandidate??null),[a,s]=(0,_.useState)(e.pickerAmount);return(0,g.jsx)(l,{...e,pickerMode:t,onPickerModeChange:e=>{n(e),i(null)},pickerRefundCandidate:r,pickerReimbursementCandidate:r,pickerAmount:a,onPickerAmountChange:s,onRefundItemChange:e=>{i(e),s(e?o(e):``)},onReimbursementItemChange:e=>{i(e),s(e?o(e):``)}})},parameters:{layout:`fullscreen`}},C={name:`选择分类`},w={name:`多账户支出：收入分类不可选`,args:{disabledCategoryType:`income`,pickerSpecialStatus:null}},T={name:`多账户收入：支出分类不可选`,args:{disabledCategoryType:`expense`,pickerCategoryId:`system-refund`,pickerMode:`refund`,pickerSpecialStatus:null}},E={name:`退款明细显示关联提示`,args:{linkNotice:`退款明细必须与收款账户币种一致，请重新选择。`,pickerCategoryId:`system-refund`,pickerMode:`refund`,pickerSpecialStatus:null},play:async({canvasElement:e})=>{await v(await y(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`退款明细必须与收款账户币种一致，请重新选择。`)}},D={name:`未选账户时选择关联候选的提示`,args:{linkNotice:i.candidateAccountRequired(`refund`),pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:x[x.length-1]},play:async({canvasElement:e})=>{await v(await y(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`请先选择账户，再选择退款明细。`)}},O={name:`退款 · 商家三笔支出 · 未选`,args:{pickerMode:`refund`}},k={name:`退款 · 回退全部`,args:{pickerMode:`refund`,loadRefundPageAction:d}},A={name:`报销 · 已选且金额已填`,args:{pickerMode:`reimbursement`,pickerReimbursementCandidate:h,pickerAmount:`3280`}},j={name:`收入`,args:{pickerMode:`income`,pickerCategoryId:`income-salary`,selectedCategoryGroup:x[2]}},M={name:`特殊状态关闭`,args:{specialStatusEnabled:!1}},N={name:`多账户 · 禁用收入退款报销`,args:{multiAccount:!0}},P={name:`编辑 · 已关联原支出不在首页`,args:{pickerMode:`refund`,pickerModeLocked:!0,editingItemId:1,pickerRefundCandidate:p,pickerAmount:`3280`}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "退款 · 商家三笔支出 · 未选",
  args: {
    pickerMode: "refund"
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "退款 · 回退全部",
  args: {
    pickerMode: "refund",
    loadRefundPageAction: loadFallbackCandidatePage
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
}`,...P.parameters?.docs?.source}}},F=[`Default`,`IncomeCategoriesDisabled`,`ExpenseCategoriesDisabled`,`RefundLinkNotice`,`RefundLinkAccountRequiredNotice`,`Refund`,`RefundFallback`,`Reimbursement`,`Income`,`SpecialStatusOff`,`MultiAccount`,`EditOffPageSelection`]}))();export{C as Default,P as EditOffPageSelection,T as ExpenseCategoriesDisabled,j as Income,w as IncomeCategoriesDisabled,N as MultiAccount,O as Refund,k as RefundFallback,D as RefundLinkAccountRequiredNotice,E as RefundLinkNotice,A as Reimbursement,M as SpecialStatusOff,F as __namedExportsOrder,S as default};