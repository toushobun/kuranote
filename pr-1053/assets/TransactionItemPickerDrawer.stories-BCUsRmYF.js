import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,t as n}from"./transactionMessages-C2AwAcDE.js";import{n as r,t as i}from"./TransactionItemPickerDrawer-iB92qECb.js";var a,o,s,c,l,u,d,f,p,m,h,g,_,v;e((()=>{n(),r(),{expect:a,userEvent:o,within:s}=__STORYBOOK_MODULE_TEST__,c=[{id:`expense-gift`,name:`份子钱`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-tip`,name:`小费`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-game`,name:`游戏`,parentId:`expense-fun`,parentName:`玩耍`,type:`expense`},{id:`income-salary`,name:`工资收入`,parentId:`income-fixed`,parentName:`固定收入`,type:`income`}],l=[{categories:c.slice(0,2),id:`expense-social`,name:`人情`},{categories:c.slice(2,3),id:`expense-fun`,name:`玩耍`},{categories:c.slice(3),id:`income-fixed`,name:`固定收入`}],u={title:`Organisms/Transactions/TransactionItemPickerDrawer`,component:i,args:{categoryGroups:l,filteredCategoryOptions:c,frequentCategoryIds:[`expense-game`,`expense-tip`,`income-salary`],onAmountChange:()=>void 0,onCategoryToggle:()=>void 0,onClose:()=>void 0,onGroupSelect:()=>void 0,onPickerAdd:()=>!0,onRemoveItem:()=>void 0,onSpecialStatusChange:()=>void 0,open:!0,pickerAmount:`1280`,pickerCategoryId:`expense-tip`,pickerErrors:{},selectedAccountCurrency:`JPY`,selectedCategoryGroup:l[0],pickerSpecialStatus:`pendingReimbursement`,specialStatusEnabled:!0},parameters:{layout:`fullscreen`}},d={name:`分类列表收起态`},f={name:`分类列表展开态`,play:async({canvasElement:e})=>{let t=s(e.ownerDocument.body);await o.click(await t.findByRole(`button`,{name:`选择更多分类`}))}},p={...f,name:`多账户支出：收入分类不可选`,args:{disabledCategoryType:`income`,pickerSpecialStatus:null}},m={...f,name:`多账户收入：支出分类不可选`,args:{disabledCategoryType:`expense`,pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:l[l.length-1]}},h={name:`收入明细显示关联提示`,args:{linkNotice:`退款明细必须与收款账户币种一致，请重新选择。`,pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:l[l.length-1]},play:async({canvasElement:e})=>{await a(await s(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`退款明细必须与收款账户币种一致，请重新选择。`)}},g={name:`未选账户时选择关联候选的提示`,args:{linkNotice:t.candidateAccountRequired(`refund`),pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:l[l.length-1]},play:async({canvasElement:e})=>{await a(await s(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`请先选择账户，再选择退款明细。`)}},_={name:`分步流程：只选分类`,args:{showAmountInput:!1,showFrequentCategories:!1,inWizard:!0}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "分类列表收起态"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "分类列表展开态",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "选择更多分类"
    }));
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  ...Expanded,
  name: "多账户支出：收入分类不可选",
  args: {
    disabledCategoryType: "income",
    pickerSpecialStatus: null
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  ...Expanded,
  name: "多账户收入：支出分类不可选",
  args: {
    disabledCategoryType: "expense",
    pickerCategoryId: "income-salary",
    pickerSpecialStatus: null,
    selectedCategoryGroup: categoryGroups[categoryGroups.length - 1]
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "分步流程：只选分类",
  args: {
    showAmountInput: false,
    showFrequentCategories: false,
    inWizard: true
  }
}`,..._.parameters?.docs?.source}}},v=[`Collapsed`,`Expanded`,`IncomeCategoriesDisabled`,`ExpenseCategoriesDisabled`,`IncomeLinkNotice`,`IncomeLinkAccountRequiredNotice`,`CategoryOnly`]}))();export{_ as CategoryOnly,d as Collapsed,f as Expanded,m as ExpenseCategoriesDisabled,p as IncomeCategoriesDisabled,g as IncomeLinkAccountRequiredNotice,h as IncomeLinkNotice,v as __namedExportsOrder,u as default};