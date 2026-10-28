import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./transactionStepFlowStoryUtils-BCVnNHVp.js";import{n as i,r as a}from"./transactionStepFlow-BHATPliy.js";import{i as o,n as s,r as c,t as l}from"./useTransactionStepFlow-C7IzfeX-.js";import{i as u,n as d,r as f,t as p}from"./transactionItemsStep-nGPALZaj.js";function m(e){let t=s({...i,accounts:e.accountOptions,suggestions:e.suggestions,initialAccountId:e.selectedAccount?.id,initialStep:3,itemsOptions:e});return(0,h.jsx)(c,{...e,form:t.form,automaticItemIds:t.automaticItemIds,amountItemId:t.amountItemId,onAmountItemChange:t.setAmountItemId})}var h,g=e((()=>{h=t(),o(),l(),a(),m.__docgenInfo={description:``,methods:[],displayName:`TransactionItemsStepHarness`,props:{merchantHasHistory:{required:!1,tsType:{name:`boolean`},description:``},accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},selectedAccount:{required:!1,tsType:{name:`TransactionAccountOption`},description:``},suggestions:{required:!1,tsType:{name:`MerchantEntrySuggestions`},description:``},returning:{required:!1,tsType:{name:`boolean`},description:``},onConfirm:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``}}}})),_,v,y,b,x,S,C,w,T,E,D,O,k;e((()=>{r(),d(),g(),{userEvent:_,within:v}=__STORYBOOK_MODULE_TEST__,y={title:`Organisms/Transactions/TransactionItemsStep`,component:m,decorators:n,args:f},b={name:`04-没有常用明细`,args:{merchantHasHistory:!1}},x={name:`04-有记录但没有自动明细`},S={name:`04-有自动添加的明细`,args:{prefillAutomaticItems:!0}},C={name:`04-选择分类（无金额、无常用快捷）`,play:async({canvasElement:e})=>{await _.click(v(e.ownerDocument.body).getByRole(`button`,{name:`添加明细`}))}},w={name:`04-多条明细含待报销及收入`,args:{initialItems:[{categoryId:`lunch`,amount:`520`,specialStatus:`pendingReimbursement`},{categoryId:`coffee`,amount:`480`},{categoryId:`points`,amount:`50`}]}},T={name:`05-单账户付款`,args:{initialItems:p}},E={name:`05-两个账户未对上`,args:{initialItems:p,initialPayments:[{accountId:`paypay`,amount:`7000`},{accountId:`cash`,amount:`0`}]}},D={name:`05-两个账户已对上`,args:{initialItems:p,initialPayments:u}},O={name:`00B-金额键盘与快捷金额`,args:S.args,play:async({canvasElement:e})=>{await _.click(v(e.ownerDocument.body).getByRole(`button`,{name:`编辑明细 1 金额`}))}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "04-没有常用明细",
  args: {
    merchantHasHistory: false
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "04-有记录但没有自动明细"
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "04-有自动添加的明细",
  args: {
    prefillAutomaticItems: true
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "04-选择分类（无金额、无常用快捷）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "添加明细"
    }));
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "05-单账户付款",
  args: {
    initialItems: filledItems
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "05-两个账户已对上",
  args: {
    initialItems: filledItems,
    initialPayments: twoPayments
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "00B-金额键盘与快捷金额",
  args: Automatic.args,
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "编辑明细 1 金额"
    }));
  }
}`,...O.parameters?.docs?.source}}},k=[`NoHistory`,`Empty`,`Automatic`,`CategoryPicker`,`MultipleItems`,`SinglePayment`,`UnbalancedPayments`,`BalancedPayments`,`AmountKeypad`]}))();export{O as AmountKeypad,S as Automatic,D as BalancedPayments,C as CategoryPicker,x as Empty,w as MultipleItems,b as NoHistory,T as SinglePayment,E as UnbalancedPayments,k as __namedExportsOrder,y as default};