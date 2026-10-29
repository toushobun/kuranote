import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./transactionStepFlowStoryUtils-Dv3X4aJQ.js";import{n as r,r as i}from"./transactionStepFlow-DP1iBwKn.js";import{n as a,t as o}from"./TransactionStepFlow-DZ6WXdq7.js";import{i as s,n as c,r as l,t as u}from"./transactionItemsStep-8KYhgmKk.js";async function d(e){let t=h(e.ownerDocument.body);return await p.click(t.getByRole(`button`,{name:`7-Eleven`})),t}var f,p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{n(),c(),i(),a(),{expect:f,userEvent:p,waitFor:m,within:h}=__STORYBOOK_MODULE_TEST__,g={title:`Organisms/Transactions/TransactionStepFlow`,component:o,decorators:t,args:r,parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`商家默认（常用不足八个）`},v={name:`收支账户有推荐`,args:{initialStep:2,initialMerchantId:`seven`}},y={name:`从确认页返回修改`,args:{initialStep:4,initialMerchantId:`seven`,initialAccountId:`paypay`},play:async({canvasElement:e})=>{await p.click(h(e.ownerDocument.body).getByRole(`button`,{name:`账户`}))}},b={name:`关闭确认`,play:async({canvasElement:e})=>{await p.click(h(e.ownerDocument.body).getByRole(`button`,{name:`关闭记账`}))}},x={name:`明细步骤（自动预填）`,args:{initialStep:3,initialMerchantId:`seven`,initialAccountId:`paypay`,suggestions:l.suggestions,itemsOptions:{...l,prefillAutomaticItems:!0}}},S={name:`明细步骤（多账户付款）`,args:{...x.args,itemsOptions:{...l,initialItems:u,initialPayments:s}}},C={name:`快速路线（建议到达后直接跳到确认，自动明细待输入）`,args:{suggestionsMerchantId:`seven`,suggestions:{...l.suggestions,recommendedAccountIds:[`paypay`]},itemsOptions:{categoryOptions:l.categoryOptions}},play:async({canvasElement:e})=>{let t=await d(e);await m(()=>f(t.getByRole(`button`,{name:/^修改明细 1：/})).toHaveTextContent(`待输入`)),await f(t.queryByLabelText(`金额计算器`)).not.toBeInTheDocument()}},w={name:`快速路线（读取建议中，超时后进入账户）`,args:{suggestionsMerchantId:`coffee`,itemsOptions:{categoryOptions:l.categoryOptions}},play:async({canvasElement:e})=>{await d(e)}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "商家默认（常用不足八个）"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "收支账户有推荐",
  args: {
    initialStep: 2,
    initialMerchantId: "seven"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "关闭确认",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "关闭记账"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "明细步骤（多账户付款）",
  args: {
    ...ItemsStep.args,
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: filledItems,
      initialPayments: twoPayments
    }
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "快速路线（建议到达后直接跳到确认，自动明细待输入）",
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
    const body = await selectSevenEleven(canvasElement);
    // 跳到确认后不自动弹出金额键盘，自动明细显示「待输入」。
    await waitFor(() => expect(body.getByRole("button", {
      name: /^修改明细 1：/
    })).toHaveTextContent("待输入"));
    await expect(body.queryByLabelText("金额计算器")).not.toBeInTheDocument();
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "快速路线（读取建议中，超时后进入账户）",
  args: {
    suggestionsMerchantId: "coffee",
    itemsOptions: {
      categoryOptions: itemsStepFixture.categoryOptions
    }
  },
  play: async ({
    canvasElement
  }) => {
    await selectSevenEleven(canvasElement);
  }
}`,...w.parameters?.docs?.source}}},T=[`MerchantDefault`,`RecommendedAccounts`,`ReturnFromConfirmation`,`CloseConfirmation`,`ItemsStep`,`SharedPayments`,`QuickEntry`,`QuickEntryLoading`]}))();export{b as CloseConfirmation,x as ItemsStep,_ as MerchantDefault,C as QuickEntry,w as QuickEntryLoading,v as RecommendedAccounts,y as ReturnFromConfirmation,S as SharedPayments,T as __namedExportsOrder,g as default};