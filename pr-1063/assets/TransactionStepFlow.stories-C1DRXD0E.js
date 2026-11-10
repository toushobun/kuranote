import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,n,r,t as i}from"./transactionStepFlowStoryUtils-DV9sVuQL.js";import{n as a,r as o}from"./transactionStepFlow-jHa4zbU7.js";import{n as s,t as c}from"./TransactionStepFlow-_2iBC2Uq.js";import{a as l,i as u,t as d}from"./transactionReceipt-BN12jKlD.js";async function f(e,t){let r=await n(e);return await m.click(await r.findByRole(`button`,{name:t})),await r.findByRole(`button`,{name:`修改商家：${t}`}),r}var p,m,h,g,_,v,y,b,x,S,C;e((()=>{i(),d(),o(),s(),{expect:p,userEvent:m,waitFor:h}=__STORYBOOK_MODULE_TEST__,g={title:`Organisms/Transactions/TransactionStepFlow`,component:c,decorators:t,args:{...a,itemsOptions:u},parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`打开即空小票`},v={name:`快速路线（建议到达后自动带出，明细待输入）`,args:{suggestionsMerchantId:`seven`,suggestions:{...l,recommendedAccountIds:[`paypay`]}},play:async({canvasElement:e})=>{let t=await f(e,`7-Eleven`);await h(()=>p(t.getByRole(`button`,{name:`修改明细 1 金额：待输入`})).toBeInTheDocument()),await p(t.queryByLabelText(`金额计算器`)).not.toBeInTheDocument()}},y={name:`第一次去的商家（不自动选账户）`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]}},play:async({canvasElement:e})=>{let t=await f(e,`星巴克`);await h(()=>p(t.getByRole(`button`,{name:`添加付款账户`})).toBeInTheDocument())}},b={name:`快速路线（读取建议中，头像显示加载）`,args:{suggestionsMerchantId:`coffee`},play:async({canvasElement:e})=>{await p(await(await f(e,`7-Eleven`)).findByRole(`progressbar`,{name:`正在读取 7-Eleven 的记录`})).toBeVisible()}},x={name:`小票商家抽屉（已填内容保留）`,decorators:[r],args:{itemsOptions:{...u,initialItems:[{categoryId:`lunch`,amount:`498`}],initialPayments:[{accountId:`paypay`,amount:null}]}},play:async({canvasElement:e})=>{let t=await f(e,`7-Eleven`);await m.click(t.getByRole(`button`,{name:`修改商家：7-Eleven`}))}},S={name:`小票关闭的公共确认`,args:v.args,play:async({canvasElement:e})=>{let t=await f(e,`7-Eleven`);await m.click(t.getByRole(`button`,{name:/^修改备注：/})),await m.type(t.getByRole(`textbox`,{name:`备注`}),`手动添加备注`),await m.click(t.getByRole(`button`,{name:`完成`})),await m.click(await t.findByRole(`button`,{name:`关闭记账`})),await p(await t.findByRole(`dialog`,{name:`尚未保存`})).toBeVisible()}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "打开即空小票"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "快速路线（建议到达后自动带出，明细待输入）",
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
  name: "第一次去的商家（不自动选账户）",
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
    await waitFor(() => expect(body.getByRole("button", {
      name: "添加付款账户"
    })).toBeInTheDocument());
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "快速路线（读取建议中，头像显示加载）",
  args: {
    suggestionsMerchantId: "coffee"
  },
  play: async ({
    canvasElement
  }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    await expect(await body.findByRole("progressbar", {
      name: "正在读取 7-Eleven 的记录"
    })).toBeVisible();
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
    const body = await selectMerchant(canvasElement, "7-Eleven");
    await userEvent.click(body.getByRole("button", {
      name: "修改商家：7-Eleven"
    }));
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