import{i as e}from"./preload-helper-D2yxXLVK.js";import{s as t,t as n}from"./transactionMessages-DVmOfzLP.js";import{n as r,t as i}from"./TransactionItemPickerDrawer-D7PrdYey.js";var a,o,s,c,l,u,d,f,p,m,h,g;e((()=>{n(),r(),{expect:a,userEvent:o,within:s}=__STORYBOOK_MODULE_TEST__,c=[{id:`expense-gift`,name:`份子钱`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-tip`,name:`小费`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-game`,name:`游戏`,parentId:`expense-fun`,parentName:`玩耍`,type:`expense`},{id:`income-salary`,name:`工资收入`,parentId:`income-fixed`,parentName:`固定收入`,type:`income`}],l=[{categories:c.slice(0,2),id:`expense-social`,name:`人情`},{categories:c.slice(2,3),id:`expense-fun`,name:`玩耍`},{categories:c.slice(3),id:`income-fixed`,name:`固定收入`}],u={title:`Organisms/Transactions/TransactionItemPickerDrawer`,component:i,args:{categoryGroups:l,filteredCategoryOptions:c,frequentCategoryIds:[`expense-game`,`expense-tip`,`income-salary`],onAmountChange:()=>void 0,onCategoryToggle:()=>void 0,onClose:()=>void 0,onGroupSelect:()=>void 0,onPickerAdd:()=>!0,onRemoveItem:()=>void 0,onSpecialStatusChange:()=>void 0,open:!0,pickerAmount:`1280`,pickerCategoryId:`expense-tip`,pickerErrors:{},selectedAccountCurrency:`JPY`,selectedCategoryGroup:l[0],pickerSpecialStatus:`pendingReimbursement`,specialStatusEnabled:!0},parameters:{layout:`fullscreen`}},d={name:`分类列表收起态`},f={name:`分类列表展开态`,play:async({canvasElement:e})=>{let t=s(e.ownerDocument.body);await o.click(await t.findByRole(`button`,{name:`选择更多分类`}))}},p={name:`多账户付款时收入分类不可选`,args:{incomeCategoriesDisabled:!0,pickerSpecialStatus:null},play:async({canvasElement:e})=>{let t=s(e.ownerDocument.body);await o.click(await t.findByRole(`button`,{name:`选择更多分类`})),await a(await t.findByRole(`button`,{name:`固定收入`})).toBeDisabled()}},m={name:`收入明细显示关联提示`,args:{linkNotice:`退款明细必须与收款账户币种一致，请重新选择。`,pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:l[l.length-1]},play:async({canvasElement:e})=>{await a(await s(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`退款明细必须与收款账户币种一致，请重新选择。`)}},h={name:`未选账户时选择关联候选的提示`,args:{linkNotice:t.candidateAccountRequired(`refund`),pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:l[l.length-1]},play:async({canvasElement:e})=>{await a(await s(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`请先选择账户，再选择退款明细。`)}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
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
  name: "多账户付款时收入分类不可选",
  args: {
    incomeCategoriesDisabled: true,
    pickerSpecialStatus: null
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "选择更多分类"
    }));
    await expect(await body.findByRole("button", {
      name: "固定收入"
    })).toBeDisabled();
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
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
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}},g=[`Collapsed`,`Expanded`,`IncomeCategoriesDisabled`,`IncomeLinkNotice`,`IncomeLinkAccountRequiredNotice`]}))();export{d as Collapsed,f as Expanded,p as IncomeCategoriesDisabled,h as IncomeLinkAccountRequiredNotice,m as IncomeLinkNotice,g as __namedExportsOrder,u as default};