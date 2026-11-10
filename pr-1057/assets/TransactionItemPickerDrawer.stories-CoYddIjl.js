import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,t as n}from"./transactionMessages-C2AwAcDE.js";import{n as r,t as i}from"./TransactionItemPickerDrawer-BKFetELB.js";var a,o,s,c,l,u,d,f,p,m,h;e((()=>{n(),r(),{expect:a,within:o}=__STORYBOOK_MODULE_TEST__,s=[{id:`expense-gift`,name:`份子钱`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-tip`,name:`小费`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-game`,name:`游戏`,parentId:`expense-fun`,parentName:`玩耍`,type:`expense`},{id:`income-salary`,name:`工资收入`,parentId:`income-fixed`,parentName:`固定收入`,type:`income`}],c=[{categories:s.slice(0,2),id:`expense-social`,name:`人情`},{categories:s.slice(2,3),id:`expense-fun`,name:`玩耍`},{categories:s.slice(3),id:`income-fixed`,name:`固定收入`}],l={title:`Organisms/Transactions/TransactionItemPickerDrawer`,component:i,args:{categoryGroups:c,filteredCategoryOptions:s,onCategoryToggle:()=>void 0,onClose:()=>void 0,onGroupSelect:()=>void 0,onPickerAdd:()=>!0,onRemoveItem:()=>void 0,onSpecialStatusChange:()=>void 0,open:!0,pickerAmount:`1280`,pickerCategoryId:`expense-tip`,pickerErrors:{},selectedAccountCurrency:`JPY`,selectedCategoryGroup:c[0],pickerSpecialStatus:`pendingReimbursement`,specialStatusEnabled:!0},parameters:{layout:`fullscreen`}},u={name:`选择分类`},d={name:`多账户支出：收入分类不可选`,args:{disabledCategoryType:`income`,pickerSpecialStatus:null}},f={name:`多账户收入：支出分类不可选`,args:{disabledCategoryType:`expense`,pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:c[c.length-1]}},p={name:`收入明细显示关联提示`,args:{linkNotice:`退款明细必须与收款账户币种一致，请重新选择。`,pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:c[c.length-1]},play:async({canvasElement:e})=>{await a(await o(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`退款明细必须与收款账户币种一致，请重新选择。`)}},m={name:`未选账户时选择关联候选的提示`,args:{linkNotice:t.candidateAccountRequired(`refund`),pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:c[c.length-1]},play:async({canvasElement:e})=>{await a(await o(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`请先选择账户，再选择退款明细。`)}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "选择分类"
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "多账户支出：收入分类不可选",
  args: {
    disabledCategoryType: "income",
    pickerSpecialStatus: null
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "多账户收入：支出分类不可选",
  args: {
    disabledCategoryType: "expense",
    pickerCategoryId: "income-salary",
    pickerSpecialStatus: null,
    selectedCategoryGroup: categoryGroups[categoryGroups.length - 1]
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "收入明细显示关联提示",
  args: {
    linkNotice: "退款明细必须与收款账户币种一致，请重新选择。",
    pickerCategoryId: "income-salary",
    pickerSpecialStatus: null,
    selectedCategoryGroup: categoryGroups[categoryGroups.length - 1]
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole("alert")).toHaveTextContent("退款明细必须与收款账户币种一致，请重新选择。");
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
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
}`,...m.parameters?.docs?.source}}},h=[`Default`,`IncomeCategoriesDisabled`,`ExpenseCategoriesDisabled`,`IncomeLinkNotice`,`IncomeLinkAccountRequiredNotice`]}))();export{u as Default,f as ExpenseCategoriesDisabled,d as IncomeCategoriesDisabled,m as IncomeLinkAccountRequiredNotice,p as IncomeLinkNotice,h as __namedExportsOrder,l as default};