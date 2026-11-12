import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,i as n,n as r,r as i,t as a}from"./transactionStepFlowStoryUtils-COn9_IxA.js";import{n as o,r as s}from"./transactionStepFlow-jHa4zbU7.js";import{n as c,t as l}from"./TransactionStepFlow-CSH60iCQ.js";import{a as u,i as d,t as f}from"./transactionReceipt-BN12jKlD.js";async function p(e,t,n){let r=await i(e,n);return await _.click(await r.findByRole(`button`,{name:t})),await r.findByRole(`button`,{name:`修改商家：${t}`}),r}async function m(e){let t=await p(e,`7-Eleven`);return await t.findByRole(`button`,{name:`修改明细 1 金额：待输入`}),t}async function h(e){await _.click(e.getByRole(`button`,{name:/^修改备注：/})),await _.type(e.getByRole(`textbox`,{name:`备注`}),`手动添加备注`),await _.click(e.getByRole(`button`,{name:`完成`}))}var g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{r(),f(),s(),c(),{expect:g,userEvent:_,waitFor:v}=__STORYBOOK_MODULE_TEST__,y={title:`Organisms/Transactions/TransactionStepFlow`,component:l,decorators:t,args:{...o,itemsOptions:d},parameters:{viewport:{defaultViewport:`mobile2`}}},b={name:`打开即空小票`},x={name:`快速路线（建议到达后自动带出，明细待输入）`,args:{suggestionsMerchantId:`seven`,suggestions:{...u,recommendedAccountIds:[`paypay`]}},play:async({canvasElement:e})=>{let t=await p(e,`7-Eleven`);await v(()=>g(t.getByRole(`button`,{name:`修改明细 1 金额：待输入`})).toBeInTheDocument()),await g(t.queryByLabelText(`金额计算器`)).not.toBeInTheDocument()}},S={name:`第一次去的商家（不自动选账户）`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]}},play:async({canvasElement:e})=>{let t=await p(e,`星巴克`);await v(()=>g(t.getByRole(`button`,{name:`添加付款账户`})).toBeInTheDocument())}},C={name:`快速路线（读取建议中，明细与付款区显示状态行）`,args:{suggestionsMerchantId:`coffee`},play:async({canvasElement:e})=>{await p(e,`7-Eleven`),await a(e)}},w={name:`换商家：清空自动内容后读取明细和付款账户`,args:x.args,play:async({canvasElement:e})=>{let t=await m(e);await p(e,`LIFE超市`,`7-Eleven`),await a(e),await g(t.queryByRole(`button`,{name:`编辑明细 1`})).not.toBeInTheDocument(),await g(t.queryByRole(`button`,{name:`更换支付账户 1`})).not.toBeInTheDocument()}},T={name:`动过小票后换商家不读取`,args:x.args,play:async({canvasElement:e})=>{let t=await m(e);await h(t),await p(e,`LIFE超市`,`7-Eleven`),await g(t.getByRole(`button`,{name:`添加明细`})).toBeVisible(),await g(t.getByRole(`button`,{name:`添加付款账户`})).toBeVisible(),await g(t.getByRole(`button`,{name:`编辑明细 1`})).toBeVisible(),await g(t.getByText(`PayPay`,{exact:!0})).toBeVisible(),await g(t.getByRole(`button`,{name:`修改备注：手动添加备注`})).toBeVisible()}},E={name:`小票商家抽屉（已填内容保留）`,decorators:[n],args:{itemsOptions:{...d,initialItems:[{categoryId:`lunch`,amount:`498`}],initialPayments:[{accountId:`paypay`,amount:null}]}},play:async({canvasElement:e})=>{let t=await p(e,`7-Eleven`);await _.click(t.getByRole(`button`,{name:`修改商家：7-Eleven`}))}},D={name:`小票关闭的公共确认`,args:x.args,play:async({canvasElement:e})=>{let t=await p(e,`7-Eleven`);await h(t),await _.click(await t.findByRole(`button`,{name:`关闭记账`})),await g(await t.findByRole(`dialog`,{name:`尚未保存`})).toBeVisible()}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "打开即空小票"
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "换商家：清空自动内容后读取明细和付款账户",
  args: QuickEntry.args,
  play: async ({
    canvasElement
  }) => {
    const body = await selectMerchantWithSuggestions(canvasElement);
    await selectMerchant(canvasElement, "LIFE超市", "7-Eleven");
    await expectSuggestionLoadingRows(canvasElement);
    await expect(body.queryByRole("button", {
      name: "编辑明细 1"
    })).not.toBeInTheDocument();
    await expect(body.queryByRole("button", {
      name: "更换支付账户 1"
    })).not.toBeInTheDocument();
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "动过小票后换商家不读取",
  args: QuickEntry.args,
  play: async ({
    canvasElement
  }) => {
    const body = await selectMerchantWithSuggestions(canvasElement);
    await addReceiptNote(body);
    await selectMerchant(canvasElement, "LIFE超市", "7-Eleven");
    await expect(body.getByRole("button", {
      name: "添加明细"
    })).toBeVisible();
    await expect(body.getByRole("button", {
      name: "添加付款账户"
    })).toBeVisible();
    await expect(body.getByRole("button", {
      name: "编辑明细 1"
    })).toBeVisible();
    await expect(body.getByText("PayPay", {
      exact: true
    })).toBeVisible();
    await expect(body.getByRole("button", {
      name: "修改备注：手动添加备注"
    })).toBeVisible();
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "小票关闭的公共确认",
  args: QuickEntry.args,
  play: async ({
    canvasElement
  }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    await addReceiptNote(body);
    await userEvent.click(await body.findByRole("button", {
      name: "关闭记账"
    }));
    await expect(await body.findByRole("dialog", {
      name: "尚未保存"
    })).toBeVisible();
  }
}`,...D.parameters?.docs?.source}}},O=[`MerchantDefault`,`QuickEntry`,`FirstVisit`,`QuickEntryLoading`,`ChangeMerchantLoading`,`ChangeMerchantAfterEdit`,`ChangeMerchant`,`CloseConfirmation`]}))();export{E as ChangeMerchant,T as ChangeMerchantAfterEdit,w as ChangeMerchantLoading,D as CloseConfirmation,S as FirstVisit,b as MerchantDefault,x as QuickEntry,C as QuickEntryLoading,O as __namedExportsOrder,y as default};