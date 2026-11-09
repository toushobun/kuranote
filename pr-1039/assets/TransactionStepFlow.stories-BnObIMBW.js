import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,i as n,r}from"./AccountStep-Bd2ihetx.js";import{n as i,r as a}from"./transactionStepFlow-jHa4zbU7.js";import{a as o,i as s,t as c}from"./transactionReceipt-nwTPROjg.js";import{n as l,t as u}from"./TransactionStepFlow-DOdCuwSh.js";async function d(e,t){let n=h(e.ownerDocument.body);return await p.click(n.getByRole(`button`,{name:t})),n}var f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{r(),c(),a(),l(),{expect:f,userEvent:p,waitFor:m,within:h}=__STORYBOOK_MODULE_TEST__,g={title:`Organisms/Transactions/TransactionStepFlow`,component:u,decorators:t,args:{...i,itemsOptions:s},parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`选择商家（常用不足八个）`},v={name:`快速路线（建议到达后进入小票，自动明细待输入）`,args:{suggestionsMerchantId:`seven`,suggestions:{...o,recommendedAccountIds:[`paypay`]}},play:async({canvasElement:e})=>{let t=await d(e,`7-Eleven`);await m(()=>f(t.getByRole(`button`,{name:`修改明细 1 金额：待输入`})).toBeInTheDocument()),await f(t.queryByLabelText(`金额计算器`)).not.toBeInTheDocument()}},y={name:`第一次去的商家（不选账户，进入小票）`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]}},play:async({canvasElement:e})=>{let t=await d(e,`星巴克`);await m(()=>f(t.getByText(`这家商家还没有记录`)).toBeInTheDocument())}},b={name:`快速路线（读取建议中，超时后进入小票）`,args:{suggestionsMerchantId:`coffee`},play:async({canvasElement:e})=>{await d(e,`7-Eleven`)}},x={name:`小票商家抽屉（已填内容保留）`,decorators:[n],args:{itemsOptions:{...s,initialItems:[{categoryId:`lunch`,amount:`498`}],initialPayments:[{accountId:`paypay`,amount:null}]}},play:async({canvasElement:e})=>{await d(e,`7-Eleven`),await d(e,`修改商家：7-Eleven`)}},S={name:`小票关闭的公共确认`,args:v.args,play:async({canvasElement:e})=>{let t=await d(e,`7-Eleven`);await p.click(t.getByRole(`button`,{name:/^修改备注：/})),await p.type(t.getByRole(`textbox`,{name:`备注`}),`手动添加备注`),await p.click(t.getByRole(`button`,{name:`完成`})),await p.click(await t.findByRole(`button`,{name:`关闭记账`})),await f(await t.findByRole(`dialog`,{name:`尚未保存`})).toBeVisible()}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "选择商家（常用不足八个）"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "快速路线（读取建议中，超时后进入小票）",
  args: {
    suggestionsMerchantId: "coffee"
  },
  play: async ({
    canvasElement
  }) => {
    await selectMerchant(canvasElement, "7-Eleven");
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "小票商家抽屉（已填内容保留）",
  decorators: [receiptCreationStoryDecorator],
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "498"
      }],
      initialPayments: [{
        accountId: "paypay",
        amount: null
      }]
    }
  },
  play: async ({
    canvasElement
  }) => {
    await selectMerchant(canvasElement, "7-Eleven");
    await selectMerchant(canvasElement, "修改商家：7-Eleven");
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "小票关闭的公共确认",
  args: QuickEntry.args,
  play: async ({
    canvasElement
  }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    await userEvent.click(body.getByRole("button", {
      name: /^修改备注：/
    }));
    await userEvent.type(body.getByRole("textbox", {
      name: "备注"
    }), "手动添加备注");
    await userEvent.click(body.getByRole("button", {
      name: "完成"
    }));
    await userEvent.click(await body.findByRole("button", {
      name: "关闭记账"
    }));
    await expect(await body.findByRole("dialog", {
      name: "尚未保存"
    })).toBeVisible();
  }
}`,...S.parameters?.docs?.source}}},C=[`MerchantDefault`,`QuickEntry`,`FirstVisit`,`QuickEntryLoading`,`ChangeMerchant`,`CloseConfirmation`]}))();export{x as ChangeMerchant,S as CloseConfirmation,y as FirstVisit,_ as MerchantDefault,v as QuickEntry,b as QuickEntryLoading,C as __namedExportsOrder,g as default};