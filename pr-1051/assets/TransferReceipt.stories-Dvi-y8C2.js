import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{R as n,z as r}from"./iframe-DcxV-Dmw.js";import{n as i,r as a,t as o}from"./transactionStepFlowStoryUtils-HUGsd8i6.js";import{n as s,r as c}from"./transactionStepFlow-jHa4zbU7.js";import{n as l,t as u}from"./TransferReceipt-CLs8ZCVd.js";var d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{d=t(),n(),o(),c(),l(),{expect:f,userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={accountId:`bank`,note:`取现`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`record-1`,transferAmount:`5000`,transferTargetAccountId:`cash`,type:`transfer`},g={title:`Organisms/Transactions/TransferReceipt`,component:u,decorators:[...a,i,e=>(0,d.jsx)(r,{sx:{p:2.5,maxWidth:480},children:(0,d.jsx)(e,{})})],args:{formId:`transfer-receipt`,action:()=>{},accountOptions:s.accounts},parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`新增：刚打开`},v={name:`已填写（账户文字图标）`,args:{initialValues:{...h,accountId:`paypay`}}},y={name:`点保存后标红未完成的项目`,play:async({canvasElement:e})=>{await p.click(m(e).getByRole(`button`,{name:`保存转账`})),await f(await m(e).findByText(`请选择转出账户`)).toBeInTheDocument()}},b={name:`编辑转账`,args:{initialValues:h,sourceType:`transfer`}},x={name:`只读详情`,args:{initialValues:h,readOnly:!0}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "新增：刚打开"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "已填写（账户文字图标）",
  args: {
    initialValues: {
      ...editValues,
      accountId: "paypay"
    }
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "点保存后标红未完成的项目",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "保存转账"
    }));
    await expect(await within(canvasElement).findByText("请选择转出账户")).toBeInTheDocument();
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "编辑转账",
  args: {
    initialValues: editValues,
    sourceType: "transfer"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "只读详情",
  args: {
    initialValues: editValues,
    readOnly: true
  }
}`,...x.parameters?.docs?.source}}},S=[`Empty`,`Filled`,`InvalidAfterSave`,`Edit`,`ReadOnly`]}))();export{b as Edit,_ as Empty,v as Filled,y as InvalidAfterSave,x as ReadOnly,S as __namedExportsOrder,g as default};