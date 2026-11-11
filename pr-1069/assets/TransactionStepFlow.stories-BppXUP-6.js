import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,i as n,n as r,r as i,t as a}from"./transactionStepFlowStoryUtils-DYIogbed.js";import{n as o,r as s}from"./transactionStepFlow-jHa4zbU7.js";import{n as c,t as l}from"./TransactionStepFlow-D2rZBHGp.js";import{a as u,i as d,t as f}from"./transactionReceipt-BN12jKlD.js";async function p(e,t){let n=await i(e);return await h.click(await n.findByRole(`button`,{name:t})),await n.findByRole(`button`,{name:`修改商家：${t}`}),n}var m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{r(),f(),s(),c(),{expect:m,userEvent:h,waitFor:g}=__STORYBOOK_MODULE_TEST__,_={title:`Organisms/Transactions/TransactionStepFlow`,component:l,decorators:t,args:{...o,itemsOptions:d},parameters:{viewport:{defaultViewport:`mobile2`}}},v={name:`打开即空小票`},y={name:`快速路线（建议到达后自动带出，明细待输入）`,args:{suggestionsMerchantId:`seven`,suggestions:{...u,recommendedAccountIds:[`paypay`]}},play:async({canvasElement:e})=>{let t=await p(e,`7-Eleven`);await g(()=>m(t.getByRole(`button`,{name:`修改明细 1 金额：待输入`})).toBeInTheDocument()),await m(t.queryByLabelText(`金额计算器`)).not.toBeInTheDocument()}},b={name:`第一次去的商家（不自动选账户）`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]}},play:async({canvasElement:e})=>{let t=await p(e,`星巴克`);await g(()=>m(t.getByRole(`button`,{name:`添加付款账户`})).toBeInTheDocument())}},x={name:`快速路线（读取建议中，明细与付款区显示状态行）`,args:{suggestionsMerchantId:`coffee`},play:async({canvasElement:e})=>{await p(e,`7-Eleven`),await a(e)}},S={name:`换商家：明细读取中，已选账户照常添加`,args:{suggestionsMerchantId:`seven`,suggestions:{...u,recommendedAccountIds:[`paypay`]}},play:async({canvasElement:e})=>{let t=await p(e,`7-Eleven`);await t.findByRole(`button`,{name:`修改明细 1 金额：待输入`}),await h.click(t.getByRole(`button`,{name:`修改商家：7-Eleven`})),await h.click(await t.findByRole(`button`,{name:`LIFE超市`})),await m((await t.findByText(`正在按习惯准备明细…`)).closest(`[role="status"]`)).toBeVisible(),await m(t.queryByRole(`button`,{name:`添加明细`})).not.toBeInTheDocument(),await m(t.queryByText(`正在读取常用账户…`)).not.toBeInTheDocument(),await m(t.getByRole(`button`,{name:`添加付款账户`})).toBeInTheDocument()}},C={name:`小票商家抽屉（已填内容保留）`,decorators:[n],args:{itemsOptions:{...d,initialItems:[{categoryId:`lunch`,amount:`498`}],initialPayments:[{accountId:`paypay`,amount:null}]}},play:async({canvasElement:e})=>{let t=await p(e,`7-Eleven`);await h.click(t.getByRole(`button`,{name:`修改商家：7-Eleven`}))}},w={name:`小票关闭的公共确认`,args:y.args,play:async({canvasElement:e})=>{let t=await p(e,`7-Eleven`);await h.click(t.getByRole(`button`,{name:/^修改备注：/})),await h.type(t.getByRole(`textbox`,{name:`备注`}),`手动添加备注`),await h.click(t.getByRole(`button`,{name:`完成`})),await h.click(await t.findByRole(`button`,{name:`关闭记账`})),await m(await t.findByRole(`dialog`,{name:`尚未保存`})).toBeVisible()}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "打开即空小票"
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "快速路线（读取建议中，明细与付款区显示状态行）",
  args: {
    suggestionsMerchantId: "coffee"
  },
  play: async ({
    canvasElement
  }) => {
    await selectMerchant(canvasElement, "7-Eleven");
    await expectSuggestionLoadingRows(canvasElement);
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "换商家：明细读取中，已选账户照常添加",
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
    await body.findByRole("button", {
      name: "修改明细 1 金额：待输入"
    });
    await userEvent.click(body.getByRole("button", {
      name: "修改商家：7-Eleven"
    }));
    await userEvent.click(await body.findByRole("button", {
      name: "LIFE超市"
    }));
    const row = await body.findByText("正在按习惯准备明细…");
    await expect(row.closest('[role="status"]')).toBeVisible();
    await expect(body.queryByRole("button", {
      name: "添加明细"
    })).not.toBeInTheDocument();
    await expect(body.queryByText("正在读取常用账户…")).not.toBeInTheDocument();
    await expect(body.getByRole("button", {
      name: "添加付款账户"
    })).toBeInTheDocument();
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}},T=[`MerchantDefault`,`QuickEntry`,`FirstVisit`,`QuickEntryLoading`,`ChangeMerchantLoading`,`ChangeMerchant`,`CloseConfirmation`]}))();export{C as ChangeMerchant,S as ChangeMerchantLoading,w as CloseConfirmation,b as FirstVisit,v as MerchantDefault,y as QuickEntry,x as QuickEntryLoading,T as __namedExportsOrder,_ as default};