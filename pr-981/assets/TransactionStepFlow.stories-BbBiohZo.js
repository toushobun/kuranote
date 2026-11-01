import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{i as n,r}from"./AccountStep-DO9SCdTs.js";import{n as i,r as a}from"./transactionStepFlow-jHa4zbU7.js";import{c as o,s}from"./useReceiptMerchantPicker-Dt2rsJqX.js";import{a as c,i as l,t as u}from"./transactionReceipt-l_g-XoYA.js";import{n as d,t as f}from"./TransactionStepFlow-DrvBlt4R.js";import{n as p,t as m}from"./receiptCreation-CidvhGSQ.js";async function h(e,t){let n=b(e.ownerDocument.body);return await v.click(n.getByRole(`button`,{name:t})),n}var g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{g=t(),o(),m(),r(),u(),a(),d(),{expect:_,userEvent:v,waitFor:y,within:b}=__STORYBOOK_MODULE_TEST__,x={title:`Organisms/Transactions/TransactionStepFlow`,component:f,decorators:n,args:{...i,itemsOptions:l},parameters:{viewport:{defaultViewport:`mobile2`}}},S={name:`选择商家（常用不足八个）`},C={name:`快速路线（建议到达后进入小票，自动明细待输入）`,args:{suggestionsMerchantId:`seven`,suggestions:{...c,recommendedAccountIds:[`paypay`]}},play:async({canvasElement:e})=>{let t=await h(e,`7-Eleven`);await y(()=>_(t.getByRole(`button`,{name:`修改明细 1 金额：待输入`})).toBeInTheDocument()),await _(t.queryByLabelText(`金额计算器`)).not.toBeInTheDocument()}},w={name:`第一次去的商家（不选账户，进入小票）`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]}},play:async({canvasElement:e})=>{let t=await h(e,`星巴克`);await y(()=>_(t.getByText(`这家商家还没有记录`)).toBeInTheDocument())}},T={name:`快速路线（读取建议中，超时后进入小票）`,args:{suggestionsMerchantId:`coffee`},play:async({canvasElement:e})=>{await h(e,`7-Eleven`)}},E={name:`小票商家抽屉（已填内容保留）`,decorators:[e=>(0,g.jsx)(s,{data:p(),children:(0,g.jsx)(e,{})})],args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`498`}],initialPayments:[{accountId:`paypay`,amount:null}]}},play:async({canvasElement:e})=>{await h(e,`7-Eleven`),await h(e,`修改商家：7-Eleven`)}},D={name:`关闭确认`,play:async({canvasElement:e})=>{await h(e,`关闭记账`)}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "选择商家（常用不足八个）"
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "快速路线（读取建议中，超时后进入小票）",
  args: {
    suggestionsMerchantId: "coffee"
  },
  play: async ({
    canvasElement
  }) => {
    await selectMerchant(canvasElement, "7-Eleven");
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "小票商家抽屉（已填内容保留）",
  decorators: [Story => <ReceiptCreationProvider data={receiptCreationData()}>
        <Story />
      </ReceiptCreationProvider>],
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
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "关闭确认",
  play: async ({
    canvasElement
  }) => {
    await selectMerchant(canvasElement, "关闭记账");
  }
}`,...D.parameters?.docs?.source}}},O=[`MerchantDefault`,`QuickEntry`,`FirstVisit`,`QuickEntryLoading`,`ChangeMerchant`,`CloseConfirmation`]}))();export{E as ChangeMerchant,D as CloseConfirmation,w as FirstVisit,S as MerchantDefault,C as QuickEntry,T as QuickEntryLoading,O as __namedExportsOrder,x as default};