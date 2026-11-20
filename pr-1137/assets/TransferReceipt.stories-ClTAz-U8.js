import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{R as n,z as r}from"./iframe-Km2r3jlv.js";import{i,t as a}from"./accounts-xUbHAqfQ.js";import{a as o,i as s,n as c}from"./transactionStepFlowStoryUtils-Dbhqc4yJ.js";import{n as l,r as u}from"./transactionStepFlow-CBFmsXNX.js";import{n as d,t as f}from"./TransferReceipt-Bw-4nC8S.js";var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k;e((()=>{p=t(),n(),c(),i(),u(),d(),{expect:m,userEvent:h,within:g}=__STORYBOOK_MODULE_TEST__,_={accountId:`bank`,note:`取现`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`record-1`,transferAmount:`5000`,transferTargetAccountId:`cash`,type:`transfer`},v={title:`Organisms/Transactions/TransferReceipt`,component:f,decorators:[...o,s,e=>(0,p.jsx)(r,{sx:{p:2.5,maxWidth:480},children:(0,p.jsx)(e,{})})],args:{formId:`transfer-receipt`,action:()=>{},accountOptions:l.accounts},parameters:{viewport:{defaultViewport:`mobile2`}}},y={name:`新增：刚打开`},b={name:`已填写（账户文字图标）`,args:{initialValues:{..._,accountId:`paypay`}}},x={name:`点保存后标红未完成的项目`,play:async({canvasElement:e})=>{await h.click(g(e).getByRole(`button`,{name:`保存转账`})),await m(await g(e).findByText(`请选择转出账户`)).toBeInTheDocument()}},S={name:`编辑转账`,args:{initialValues:_,sourceType:`transfer`}},C={..._,accountId:`cash`,transferTargetAccountId:`cny`,transferAmount:`100000`,transferTargetAmount:`4850`},w={name:`跨币种：双金额与汇率`,args:{initialValues:C}},T={name:`跨币种：到账金额未填点保存后`,args:{initialValues:{...C,transferTargetAmount:``}},play:async({canvasElement:e})=>{await h.click(g(e).getByRole(`button`,{name:`保存转账`})),await m(await g(e).findByText(`请输入到账金额`)).toBeInTheDocument()}},E={name:`跨币种：只读详情`,args:{initialValues:C,readOnly:!0}},D={name:`只读详情`,args:{initialValues:_,readOnly:!0}},O={name:`带网站图标的转账和账户抽屉`,args:{initialValues:_,accountOptions:l.accounts.map(e=>e.id===`bank`?{...e,icon_url:a.icon_url}:e)}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
  name: "编辑转账",
  args: {
    initialValues: editValues,
    sourceType: "transfer"
  }
}`,...S.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "跨币种：双金额与汇率",
  args: {
    initialValues: crossValues
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "跨币种：只读详情",
  args: {
    initialValues: crossValues,
    readOnly: true
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "只读详情",
  args: {
    initialValues: editValues,
    readOnly: true
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "带网站图标的转账和账户抽屉",
  args: {
    initialValues: editValues,
    accountOptions: flowFixture.accounts.map(account => account.id === "bank" ? {
      ...account,
      icon_url: accountWebsiteIconFixture.icon_url
    } : account)
  }
}`,...O.parameters?.docs?.source}}},k=[`Empty`,`Filled`,`InvalidAfterSave`,`Edit`,`CrossCurrencyFilled`,`CrossCurrencyMissingTarget`,`CrossCurrencyReadOnly`,`ReadOnly`,`WebsiteIcon`]}))();export{w as CrossCurrencyFilled,T as CrossCurrencyMissingTarget,E as CrossCurrencyReadOnly,S as Edit,y as Empty,b as Filled,x as InvalidAfterSave,D as ReadOnly,O as WebsiteIcon,k as __namedExportsOrder,v as default};