import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./transactionStepFlowStoryUtils-DSG0NWs9.js";import{i as r,n as i,r as a,t as o}from"./transactionItemsStep-re3qeqfb.js";import{n as s,t as c}from"./TransactionItemsStep-BWmeDtMb.js";var l,u,d,f,p,m,h,g,_,v,y,b,x;e((()=>{n(),i(),s(),{userEvent:l,within:u}=__STORYBOOK_MODULE_TEST__,d={title:`Organisms/Transactions/TransactionItemsStep`,component:c,decorators:t,args:a},f={name:`04-没有常用明细`,args:{merchantHasHistory:!1}},p={name:`04-有记录但没有自动明细`},m={name:`04-有自动添加的明细`,args:{prefillAutomaticItems:!0}},h={name:`04-选择分类（无金额、无常用快捷）`,play:async({canvasElement:e})=>{await l.click(u(e.ownerDocument.body).getByRole(`button`,{name:`添加明细`}))}},g={name:`04-多条明细含待报销及收入`,args:{initialItems:[{categoryId:`lunch`,amount:`520`,specialStatus:`pendingReimbursement`},{categoryId:`coffee`,amount:`480`},{categoryId:`points`,amount:`50`}]}},_={name:`05-单账户付款`,args:{initialItems:o}},v={name:`05-两个账户未对上`,args:{initialItems:o,initialPayments:[{accountId:`paypay`,amount:`7000`},{accountId:`cash`,amount:`0`}]}},y={name:`05-两个账户已对上`,args:{initialItems:o,initialPayments:r}},b={name:`00B-金额键盘与快捷金额`,args:m.args,play:async({canvasElement:e})=>{await l.click(u(e.ownerDocument.body).getByRole(`button`,{name:`编辑明细 1 金额`}))}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "04-没有常用明细",
  args: {
    merchantHasHistory: false
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "04-有记录但没有自动明细"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "04-有自动添加的明细",
  args: {
    prefillAutomaticItems: true
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "04-选择分类（无金额、无常用快捷）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "添加明细"
    }));
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "04-多条明细含待报销及收入",
  args: {
    initialItems: [{
      categoryId: "lunch",
      amount: "520",
      specialStatus: "pendingReimbursement"
    }, {
      categoryId: "coffee",
      amount: "480"
    }, {
      categoryId: "points",
      amount: "50"
    }]
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "05-单账户付款",
  args: {
    initialItems: filledItems
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "05-两个账户未对上",
  args: {
    initialItems: filledItems,
    initialPayments: [{
      accountId: "paypay",
      amount: "7000"
    }, {
      accountId: "cash",
      amount: "0"
    }]
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "05-两个账户已对上",
  args: {
    initialItems: filledItems,
    initialPayments: twoPayments
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "00B-金额键盘与快捷金额",
  args: Automatic.args,
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "编辑明细 1 金额"
    }));
  }
}`,...b.parameters?.docs?.source}}},x=[`NoHistory`,`Empty`,`Automatic`,`CategoryPicker`,`MultipleItems`,`SinglePayment`,`UnbalancedPayments`,`BalancedPayments`,`AmountKeypad`]}))();export{b as AmountKeypad,m as Automatic,y as BalancedPayments,h as CategoryPicker,p as Empty,g as MultipleItems,f as NoHistory,_ as SinglePayment,v as UnbalancedPayments,x as __namedExportsOrder,d as default};