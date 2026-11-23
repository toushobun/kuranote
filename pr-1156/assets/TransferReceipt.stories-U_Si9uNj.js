import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{R as n,z as r}from"./iframe-B03vuzlO.js";import{i,t as a}from"./accounts-DH4b54QW.js";import{a as o,i as s,n as c}from"./transactionStepFlowStoryUtils-CXoZLkzr.js";import{n as l,r as u}from"./transactionStepFlow-CBFmsXNX.js";import{n as d,t as f}from"./TransferReceipt-EqEU2WSJ.js";var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R;e((()=>{p=t(),n(),c(),i(),u(),d(),{expect:m,userEvent:h,within:g}=__STORYBOOK_MODULE_TEST__,_={accountId:`bank`,note:`取现`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`record-1`,transferAmount:`5000`,transferTargetAccountId:`cash`,type:`transfer`},v={title:`Organisms/Transactions/TransferReceipt`,component:f,decorators:[...o,s,e=>(0,p.jsx)(r,{sx:{p:2.5,maxWidth:480},children:(0,p.jsx)(e,{})})],args:{formId:`transfer-receipt`,action:()=>{},accountOptions:l.accounts},parameters:{viewport:{defaultViewport:`mobile2`}}},y={name:`新增：刚打开`},b={name:`已填写（账户文字图标）`,args:{initialValues:{..._,accountId:`paypay`}}},x={name:`点保存后标红未完成的项目`,play:async({canvasElement:e})=>{await h.click(g(e).getByRole(`button`,{name:`保存转账`})),await m(await g(e).findByText(`请选择转出账户`)).toBeInTheDocument()}},S={name:`同币种转账：带手续费`,args:{initialValues:{..._,transferFeeAmount:`220`}}},C={name:`跨币种转账：带手续费`,args:{initialValues:{..._,accountId:`cash`,transferTargetAccountId:`cny`,transferAmount:`100000`,transferTargetAmount:`4850`,transferFeeAmount:`220`}}},w={name:`转账详情：手续费只读`,args:{initialValues:{..._,transferFeeAmount:`220`},readOnly:!0}},T={name:`编辑转账`,args:{initialValues:_,sourceType:`transfer`}},E={..._,accountId:`cash`,transferTargetAccountId:`cny`,transferAmount:`100000`,transferTargetAmount:`4850`},D={name:`跨币种：双金额与汇率`,args:{initialValues:E}},O={name:`跨币种：到账金额未填点保存后`,args:{initialValues:{...E,transferTargetAmount:``}},play:async({canvasElement:e})=>{await h.click(g(e).getByRole(`button`,{name:`保存转账`})),await m(await g(e).findByText(`请输入到账金额`)).toBeInTheDocument()}},k={name:`跨币种：只读详情`,args:{initialValues:E,readOnly:!0}},A={name:`只读详情`,args:{initialValues:_,readOnly:!0}},j={name:`带网站图标的转账和账户抽屉`,args:{initialValues:_,accountOptions:l.accounts.map(e=>e.id===`bank`?{...e,icon_url:a.icon_url}:e)}},M={..._,accountId:`cny`,transferTargetAccountId:`cash`,transactionAt:`2026-11-19T12:20:10+09:00`,transferAmount:`100`,transferTargetAmount:`2050`},N=async()=>({rate:21.05,rateDate:`2026-11-19`}),P={name:`跨币种：按当天汇率预填`,args:{initialValues:{...M,transferTargetAmount:``},loadDailyRate:N},play:async({canvasElement:e})=>{let t=g(e);await h.click(await t.findByRole(`button`,{name:`恢复按当天汇率`})),await m(await t.findByText(/按当天汇率 1 CNY = 21.05 JPY/)).toBeInTheDocument()}},F={name:`跨币种：手改后显示差额`,args:{initialValues:M,loadDailyRate:N}},I={name:`跨币种：取不到汇率，手动填写`,args:{initialValues:{...M,transferTargetAmount:``},loadDailyRate:async()=>null},play:async({canvasElement:e})=>{let t=g(e);await h.click(t.getByRole(`button`,{name:`保存修改`})),await m(await t.findByText(`请输入到账金额`)).toBeInTheDocument()}},L={name:`跨币种：已保存转账只读`,args:{initialValues:M,loadDailyRate:N,readOnly:!0}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "新增：刚打开"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "已填写（账户文字图标）",
  args: {
    initialValues: {
      ...editValues,
      accountId: "paypay"
    }
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "点保存后标红未完成的项目",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "保存转账"
    }));
    await expect(await within(canvasElement).findByText("请选择转出账户")).toBeInTheDocument();
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "同币种转账：带手续费",
  args: {
    initialValues: {
      ...editValues,
      transferFeeAmount: "220"
    }
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "跨币种转账：带手续费",
  args: {
    initialValues: {
      ...editValues,
      accountId: "cash",
      transferTargetAccountId: "cny",
      transferAmount: "100000",
      transferTargetAmount: "4850",
      transferFeeAmount: "220"
    }
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "转账详情：手续费只读",
  args: {
    initialValues: {
      ...editValues,
      transferFeeAmount: "220"
    },
    readOnly: true
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "编辑转账",
  args: {
    initialValues: editValues,
    sourceType: "transfer"
  }
}`,...T.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "跨币种：双金额与汇率",
  args: {
    initialValues: crossValues
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "跨币种：到账金额未填点保存后",
  args: {
    initialValues: {
      ...crossValues,
      transferTargetAmount: ""
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "保存转账"
    }));
    await expect(await within(canvasElement).findByText("请输入到账金额")).toBeInTheDocument();
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "跨币种：只读详情",
  args: {
    initialValues: crossValues,
    readOnly: true
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "只读详情",
  args: {
    initialValues: editValues,
    readOnly: true
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "带网站图标的转账和账户抽屉",
  args: {
    initialValues: editValues,
    accountOptions: flowFixture.accounts.map(account => account.id === "bank" ? {
      ...account,
      icon_url: accountWebsiteIconFixture.icon_url
    } : account)
  }
}`,...j.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "跨币种：按当天汇率预填",
  args: {
    initialValues: {
      ...scenarioValues,
      transferTargetAmount: ""
    },
    loadDailyRate: storyDailyRate
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "恢复按当天汇率"
    }));
    await expect(await canvas.findByText(/按当天汇率 1 CNY = 21.05 JPY/)).toBeInTheDocument();
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "跨币种：手改后显示差额",
  args: {
    initialValues: scenarioValues,
    loadDailyRate: storyDailyRate
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "跨币种：取不到汇率，手动填写",
  args: {
    initialValues: {
      ...scenarioValues,
      transferTargetAmount: ""
    },
    loadDailyRate: async () => null
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "保存修改"
    }));
    await expect(await canvas.findByText("请输入到账金额")).toBeInTheDocument();
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "跨币种：已保存转账只读",
  args: {
    initialValues: scenarioValues,
    loadDailyRate: storyDailyRate,
    readOnly: true
  }
}`,...L.parameters?.docs?.source}}},R=[`Empty`,`Filled`,`InvalidAfterSave`,`SameCurrencyWithFee`,`CrossCurrencyWithFee`,`ReadOnlyWithFee`,`Edit`,`CrossCurrencyFilled`,`CrossCurrencyMissingTarget`,`CrossCurrencyReadOnly`,`ReadOnly`,`WebsiteIcon`,`DailyRatePrefilled`,`ManualRateDifference`,`DailyRateUnavailable`,`SavedTransferReadOnly`]}))();export{D as CrossCurrencyFilled,O as CrossCurrencyMissingTarget,k as CrossCurrencyReadOnly,C as CrossCurrencyWithFee,P as DailyRatePrefilled,I as DailyRateUnavailable,T as Edit,y as Empty,b as Filled,x as InvalidAfterSave,F as ManualRateDifference,A as ReadOnly,w as ReadOnlyWithFee,S as SameCurrencyWithFee,L as SavedTransferReadOnly,j as WebsiteIcon,R as __namedExportsOrder,v as default};