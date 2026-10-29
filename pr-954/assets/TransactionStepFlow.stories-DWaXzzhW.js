import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./transactionStepFlowStoryUtils-eZJ9p3Gn.js";import{n as r,r as i}from"./transactionStepFlow-DP1iBwKn.js";import{n as a,t as o}from"./TransactionStepFlow-DqCHpx2g.js";import{i as s,n as c,r as l,t as u}from"./transactionItemsStep-8KYhgmKk.js";var d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{n(),c(),i(),a(),{userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p={title:`Organisms/Transactions/TransactionStepFlow`,component:o,decorators:t,args:r,parameters:{viewport:{defaultViewport:`mobile2`}}},m={name:`商家默认（常用不足八个）`},h={name:`收支账户有推荐`,args:{initialStep:2,initialMerchantId:`seven`}},g={name:`从确认页返回修改`,args:{initialStep:4,initialMerchantId:`seven`,initialAccountId:`paypay`},play:async({canvasElement:e})=>{await d.click(f(e.ownerDocument.body).getByRole(`button`,{name:`账户`}))}},_={name:`关闭确认`,play:async({canvasElement:e})=>{await d.click(f(e.ownerDocument.body).getByRole(`button`,{name:`关闭记账`}))}},v={name:`明细步骤（自动预填）`,args:{initialStep:3,initialMerchantId:`seven`,initialAccountId:`paypay`,suggestions:l.suggestions,itemsOptions:{...l,prefillAutomaticItems:!0}}},y={name:`明细步骤（多账户付款）`,args:{...v.args,itemsOptions:{...l,initialItems:u,initialPayments:s}}},b={name:`快速路线（建议到达后直接跳到确认并弹出金额键盘）`,args:{suggestionsMerchantId:`seven`,suggestions:{...l.suggestions,recommendedAccountIds:[`paypay`]},itemsOptions:{categoryOptions:l.categoryOptions}},play:async({canvasElement:e})=>{await d.click(f(e.ownerDocument.body).getByRole(`button`,{name:`7-Eleven`}))}},x={name:`快速路线（读取建议中，超时后进入账户）`,args:{suggestionsMerchantId:`coffee`,itemsOptions:{categoryOptions:l.categoryOptions}},play:b.play},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "商家默认（常用不足八个）"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "收支账户有推荐",
  args: {
    initialStep: 2,
    initialMerchantId: "seven"
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "从确认页返回修改",
  args: {
    initialStep: 4,
    initialMerchantId: "seven",
    initialAccountId: "paypay"
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "账户"
    }));
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "关闭确认",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "关闭记账"
    }));
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "明细步骤（自动预填）",
  args: {
    initialStep: 3,
    initialMerchantId: "seven",
    initialAccountId: "paypay",
    suggestions: itemsStepFixture.suggestions,
    itemsOptions: {
      ...itemsStepFixture,
      prefillAutomaticItems: true
    }
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "明细步骤（多账户付款）",
  args: {
    ...ItemsStep.args,
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: filledItems,
      initialPayments: twoPayments
    }
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "快速路线（建议到达后直接跳到确认并弹出金额键盘）",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: {
      ...itemsStepFixture.suggestions!,
      recommendedAccountIds: ["paypay"]
    },
    itemsOptions: {
      categoryOptions: itemsStepFixture.categoryOptions
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "7-Eleven"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "快速路线（读取建议中，超时后进入账户）",
  args: {
    suggestionsMerchantId: "coffee",
    itemsOptions: {
      categoryOptions: itemsStepFixture.categoryOptions
    }
  },
  play: QuickEntry.play
}`,...x.parameters?.docs?.source}}},S=[`MerchantDefault`,`RecommendedAccounts`,`ReturnFromConfirmation`,`CloseConfirmation`,`ItemsStep`,`SharedPayments`,`QuickEntry`,`QuickEntryLoading`]}))();export{_ as CloseConfirmation,v as ItemsStep,m as MerchantDefault,b as QuickEntry,x as QuickEntryLoading,h as RecommendedAccounts,g as ReturnFromConfirmation,y as SharedPayments,S as __namedExportsOrder,p as default};