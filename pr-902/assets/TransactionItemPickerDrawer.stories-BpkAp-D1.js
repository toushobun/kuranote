import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionItemPickerDrawer-QQomyj0S.js";var r,i,a,o,s,c,l,u,d,f;e((()=>{t(),{expect:r,userEvent:i,within:a}=__STORYBOOK_MODULE_TEST__,o=[{id:`expense-gift`,name:`份子钱`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-tip`,name:`小费`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-game`,name:`游戏`,parentId:`expense-fun`,parentName:`玩耍`,type:`expense`},{id:`income-salary`,name:`工资收入`,parentId:`income-fixed`,parentName:`固定收入`,type:`income`}],s=[{categories:o.slice(0,2),id:`expense-social`,name:`人情`},{categories:o.slice(2,3),id:`expense-fun`,name:`玩耍`},{categories:o.slice(3),id:`income-fixed`,name:`固定收入`}],c={title:`Organisms/Transactions/TransactionItemPickerDrawer`,component:n,args:{categoryGroups:s,filteredCategoryOptions:o,frequentCategoryIds:[`expense-game`,`expense-tip`,`income-salary`],onAmountChange:()=>void 0,onCategoryToggle:()=>void 0,onClose:()=>void 0,onGroupSelect:()=>void 0,onPickerAdd:()=>!0,onRemoveItem:()=>void 0,onSpecialStatusChange:()=>void 0,open:!0,pickerAmount:`1280`,pickerCategoryId:`expense-tip`,pickerErrors:{},selectedAccountCurrency:`JPY`,selectedCategoryGroup:s[0],pickerSpecialStatus:`pendingReimbursement`,specialStatusEnabled:!0},parameters:{layout:`fullscreen`}},l={name:`分类列表收起态`},u={name:`分类列表展开态`,play:async({canvasElement:e})=>{let t=a(e.ownerDocument.body);await i.click(await t.findByRole(`button`,{name:`选择更多分类`}))}},d={name:`收入明细显示关联提示`,args:{linkNotice:`退款明细必须与收款账户币种一致，请重新选择。`,pickerCategoryId:`income-salary`,pickerSpecialStatus:null,selectedCategoryGroup:s[s.length-1]},play:async({canvasElement:e})=>{await r(await a(e.ownerDocument.body).findByRole(`alert`)).toHaveTextContent(`退款明细必须与收款账户币种一致，请重新选择。`)}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "分类列表收起态"
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "分类列表展开态",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "选择更多分类"
    }));
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
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
}`,...d.parameters?.docs?.source}}},f=[`Collapsed`,`Expanded`,`IncomeLinkNotice`]}))();export{l as Collapsed,u as Expanded,d as IncomeLinkNotice,f as __namedExportsOrder,c as default};