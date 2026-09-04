import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionItemPickerDrawer-BsvT-Vt5.js";var r,i,a,o,s,c,l,u;e((()=>{t(),{userEvent:r,within:i}=__STORYBOOK_MODULE_TEST__,a=[{id:`expense-gift`,name:`份子钱`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-tip`,name:`小费`,parentId:`expense-social`,parentName:`人情`,type:`expense`},{id:`expense-game`,name:`游戏`,parentId:`expense-fun`,parentName:`玩耍`,type:`expense`},{id:`income-salary`,name:`工资收入`,parentId:`income-fixed`,parentName:`固定收入`,type:`income`}],o=[{categories:a.slice(0,2),id:`expense-social`,name:`人情`},{categories:a.slice(2,3),id:`expense-fun`,name:`玩耍`},{categories:a.slice(3),id:`income-fixed`,name:`固定收入`}],s={title:`Organisms/Transactions/TransactionItemPickerDrawer`,component:n,args:{categoryGroups:o,filteredCategoryOptions:a,frequentCategoryIds:[`expense-game`,`expense-tip`,`income-salary`],onAmountChange:()=>void 0,onCategoryToggle:()=>void 0,onClose:()=>void 0,onGroupSelect:()=>void 0,onPickerAdd:()=>!0,onRemoveItem:()=>void 0,onSpecialStatusChange:()=>void 0,open:!0,pickerAmount:`1280`,pickerCategoryId:`expense-tip`,pickerErrors:{},selectedAccountCurrency:`JPY`,selectedCategoryGroup:o[0],pickerSpecialStatus:`pendingReimbursement`,specialStatusEnabled:!0},parameters:{layout:`fullscreen`}},c={name:`分类列表收起态`},l={name:`分类列表展开态`,play:async({canvasElement:e})=>{let t=i(e.ownerDocument.body);await r.click(await t.findByRole(`button`,{name:`选择更多分类`}))}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "分类列表收起态"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "分类列表展开态",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "选择更多分类"
    }));
  }
}`,...l.parameters?.docs?.source}}},u=[`Collapsed`,`Expanded`]}))();export{c as Collapsed,l as Expanded,u as __namedExportsOrder,s as default};