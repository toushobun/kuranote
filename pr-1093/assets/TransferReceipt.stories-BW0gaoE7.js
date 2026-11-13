import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{R as n,z as r}from"./iframe-BjzT6tF-.js";import{i,t as a}from"./accounts-xUbHAqfQ.js";import{a as o,i as s,n as c}from"./transactionStepFlowStoryUtils-BQ1FiAx-.js";import{n as l,r as u}from"./transactionStepFlow-BdbS7D1i.js";import{n as d,t as f}from"./TransferReceipt-_4sYpk_3.js";var p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{p=t(),n(),c(),i(),u(),d(),{expect:m,userEvent:h,within:g}=__STORYBOOK_MODULE_TEST__,_={accountId:`bank`,note:`取现`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`record-1`,transferAmount:`5000`,transferTargetAccountId:`cash`,type:`transfer`},v={title:`Organisms/Transactions/TransferReceipt`,component:f,decorators:[...o,s,e=>(0,p.jsx)(r,{sx:{p:2.5,maxWidth:480},children:(0,p.jsx)(e,{})})],args:{formId:`transfer-receipt`,action:()=>{},accountOptions:l.accounts},parameters:{viewport:{defaultViewport:`mobile2`}}},y={name:`新增：刚打开`},b={name:`已填写（账户文字图标）`,args:{initialValues:{..._,accountId:`paypay`}}},x={name:`点保存后标红未完成的项目`,play:async({canvasElement:e})=>{await h.click(g(e).getByRole(`button`,{name:`保存转账`})),await m(await g(e).findByText(`请选择转出账户`)).toBeInTheDocument()}},S={name:`编辑转账`,args:{initialValues:_,sourceType:`transfer`}},C={name:`只读详情`,args:{initialValues:_,readOnly:!0}},w={name:`带网站图标的转账和账户抽屉`,args:{initialValues:_,accountOptions:l.accounts.map(e=>e.id===`bank`?{...e,icon_url:a.icon_url}:e)}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "只读详情",
  args: {
    initialValues: editValues,
    readOnly: true
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "带网站图标的转账和账户抽屉",
  args: {
    initialValues: editValues,
    accountOptions: flowFixture.accounts.map(account => account.id === "bank" ? {
      ...account,
      icon_url: accountWebsiteIconFixture.icon_url
    } : account)
  }
}`,...w.parameters?.docs?.source}}},T=[`Empty`,`Filled`,`InvalidAfterSave`,`Edit`,`ReadOnly`,`WebsiteIcon`]}))();export{S as Edit,y as Empty,b as Filled,x as InvalidAfterSave,C as ReadOnly,w as WebsiteIcon,T as __namedExportsOrder,v as default};