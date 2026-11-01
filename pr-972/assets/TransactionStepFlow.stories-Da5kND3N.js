import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,r as n}from"./AccountStep-By71Z7rX.js";import{n as r,r as i}from"./transactionStepFlow-8icpKE4Y.js";import{a,i as o,t as s}from"./transactionReceipt-C7MjOD1C.js";import{n as c,t as l}from"./TransactionStepFlow-Bg8prAXj.js";async function u(e,t){let n=m(e.ownerDocument.body);return await f.click(n.getByRole(`button`,{name:t})),n}var d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{n(),s(),i(),c(),{expect:d,userEvent:f,waitFor:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Transactions/TransactionStepFlow`,component:l,decorators:t,args:{...r,itemsOptions:o},parameters:{viewport:{defaultViewport:`mobile2`}}},g={name:`选择商家（常用不足八个）`},_={name:`快速路线（建议到达后进入小票，自动明细待输入）`,args:{suggestionsMerchantId:`seven`,suggestions:{...a,recommendedAccountIds:[`paypay`]}},play:async({canvasElement:e})=>{let t=await u(e,`7-Eleven`);await p(()=>d(t.getByRole(`button`,{name:`修改明细 1 金额：待输入`})).toBeInTheDocument()),await d(t.queryByLabelText(`金额计算器`)).not.toBeInTheDocument()}},v={name:`第一次去的商家（不选账户，进入小票）`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]}},play:async({canvasElement:e})=>{let t=await u(e,`星巴克`);await p(()=>d(t.getByText(`这家商家还没有记录`)).toBeInTheDocument())}},y={name:`快速路线（读取建议中，超时后进入小票）`,args:{suggestionsMerchantId:`coffee`},play:async({canvasElement:e})=>{await u(e,`7-Eleven`)}},b={name:`小票返回选择商家（已填内容保留）`,args:{initialMerchantId:`seven`,initialAccountId:`paypay`,itemsOptions:{...o,initialItems:[{categoryId:`lunch`,amount:`498`}]}},play:async({canvasElement:e})=>{await u(e,`返回选择商家`)}},x={name:`关闭确认`,play:async({canvasElement:e})=>{await u(e,`关闭记账`)}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "选择商家（常用不足八个）"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "快速路线（建议到达后进入小票，自动明细待输入）",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: {
      ...receiptSuggestions,
      recommendedAccountIds: ["paypay"]
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    // 进入小票后不自动弹出金额键盘，自动明细显示「待输入」。
    await waitFor(() => expect(body.getByRole("button", {
      name: "修改明细 1 金额：待输入"
    })).toBeInTheDocument());
    await expect(body.queryByLabelText("金额计算器")).not.toBeInTheDocument();
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "第一次去的商家（不选账户，进入小票）",
  args: {
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: []
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = await selectMerchant(canvasElement, "星巴克");
    await waitFor(() => expect(body.getByText("这家商家还没有记录")).toBeInTheDocument());
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "快速路线（读取建议中，超时后进入小票）",
  args: {
    suggestionsMerchantId: "coffee"
  },
  play: async ({
    canvasElement
  }) => {
    await selectMerchant(canvasElement, "7-Eleven");
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "小票返回选择商家（已填内容保留）",
  args: {
    initialMerchantId: "seven",
    initialAccountId: "paypay",
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "498"
      }]
    }
  },
  play: async ({
    canvasElement
  }) => {
    await selectMerchant(canvasElement, "返回选择商家");
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "关闭确认",
  play: async ({
    canvasElement
  }) => {
    await selectMerchant(canvasElement, "关闭记账");
  }
}`,...x.parameters?.docs?.source}}},S=[`MerchantDefault`,`QuickEntry`,`FirstVisit`,`QuickEntryLoading`,`BackToMerchant`,`CloseConfirmation`]}))();export{b as BackToMerchant,x as CloseConfirmation,v as FirstVisit,g as MerchantDefault,_ as QuickEntry,y as QuickEntryLoading,S as __namedExportsOrder,h as default};