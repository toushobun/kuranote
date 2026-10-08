import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t,i as n,n as r}from"./paths-D7uT-HPS.js";import{n as i,t as a}from"./TransferTransactionForm-f4W_e6V7.js";async function o(){}var s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{n(),i(),s={id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},c={id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`},l={id:`00000000-0000-4000-8000-000000000047`,name:`美元账户`,currency:`USD`},u={title:`Organisms/Transactions/TransferTransactionForm`,component:a,args:{action:o,accountOptions:[s,c],ledgerName:`家庭账本`}},d={name:`默认状态（同币种两账户）`},f={name:`账户不足 2 个`,args:{accountOptions:[s]}},p={name:`无账户`,args:{accountOptions:[]}},m={name:`不同币种账户`,args:{accountOptions:[s,l]}},h={name:`带错误信息`,args:{errorMessage:`转账失败。请稍后重试。`}},g={name:`编辑状态（带初始值）`,args:{title:`编辑记账`,initialValues:{type:`transfer`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,transactionAt:`2026-06-04T01:30:05.000Z`,accountId:s.id,transferTargetAccountId:c.id,transferAmount:`5000`,note:`零花钱转账`}}},_={name:`编辑状态（相同账户禁用）`,args:{title:`编辑记账`,initialValues:{type:`transfer`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,transactionAt:`2026-06-04T01:30:05.000Z`,accountId:s.id,transferTargetAccountId:s.id,transferAmount:`1000`,note:``}}},v={name:`编辑状态（不同币种禁用）`,args:{title:`编辑记账`,accountOptions:[s,l],initialValues:{type:`transfer`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,transactionAt:`2026-06-04T01:30:05.000Z`,accountId:s.id,transferTargetAccountId:l.id,transferAmount:`2000`,note:``}}},y=r(t(`transfer`)),b={name:`新建转账 · 没有账户（提示卡片）`,args:{accountOptions:[],addAccountHref:y}},x={name:`新建转账 · 只有 1 个账户（提示卡片）`,args:{accountOptions:[s],addAccountHref:y}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "默认状态（同币种两账户）"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "账户不足 2 个",
  args: {
    accountOptions: [jpyAccount1]
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accountOptions: []
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "不同币种账户",
  args: {
    accountOptions: [jpyAccount1, usdAccount]
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "带错误信息",
  args: {
    errorMessage: "转账失败。请稍后重试。"
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "编辑状态（带初始值）",
  args: {
    title: "编辑记账",
    initialValues: {
      type: "transfer",
      transactionRecordId: "00000000-0000-4000-8000-000000009001",
      transactionAt: "2026-06-04T01:30:05.000Z",
      accountId: jpyAccount1.id,
      transferTargetAccountId: jpyAccount2.id,
      transferAmount: "5000",
      note: "零花钱转账"
    }
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "编辑状态（相同账户禁用）",
  args: {
    title: "编辑记账",
    initialValues: {
      type: "transfer",
      transactionRecordId: "00000000-0000-4000-8000-000000009002",
      transactionAt: "2026-06-04T01:30:05.000Z",
      accountId: jpyAccount1.id,
      transferTargetAccountId: jpyAccount1.id,
      transferAmount: "1000",
      note: ""
    }
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "编辑状态（不同币种禁用）",
  args: {
    title: "编辑记账",
    accountOptions: [jpyAccount1, usdAccount],
    initialValues: {
      type: "transfer",
      transactionRecordId: "00000000-0000-4000-8000-000000009003",
      transactionAt: "2026-06-04T01:30:05.000Z",
      accountId: jpyAccount1.id,
      transferTargetAccountId: usdAccount.id,
      transferAmount: "2000",
      note: ""
    }
  }
}`,...v.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "新建转账 · 没有账户（提示卡片）",
  args: {
    accountOptions: [],
    addAccountHref
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "新建转账 · 只有 1 个账户（提示卡片）",
  args: {
    accountOptions: [jpyAccount1],
    addAccountHref
  }
}`,...x.parameters?.docs?.source}}},S=[`Default`,`TooFewAccounts`,`NoAccounts`,`DifferentCurrency`,`WithError`,`Edit`,`EditSameAccount`,`EditDifferentCurrency`,`SetupHintNoAccounts`,`SetupHintOneAccount`]}))();export{d as Default,m as DifferentCurrency,g as Edit,v as EditDifferentCurrency,_ as EditSameAccount,p as NoAccounts,b as SetupHintNoAccounts,x as SetupHintOneAccount,f as TooFewAccounts,h as WithError,S as __namedExportsOrder,u as default};