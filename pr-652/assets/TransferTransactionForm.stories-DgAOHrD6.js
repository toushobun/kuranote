import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransferTransactionForm-DXY4g55a.js";async function r(){}var i,a,o,s,c,l,u,d,f,p,m,h,g;e((()=>{t(),i={id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},a={id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`},o={id:`00000000-0000-4000-8000-000000000047`,name:`美元账户`,currency:`USD`},s={title:`Organisms/Transactions/TransferTransactionForm`,component:n,args:{action:r,accountOptions:[i,a],ledgerName:`家庭账本`}},c={name:`默认状态（同币种两账户）`},l={name:`账户不足 2 个`,args:{accountOptions:[i]}},u={name:`无账户`,args:{accountOptions:[]}},d={name:`不同币种账户`,args:{accountOptions:[i,o]}},f={name:`带错误信息`,args:{errorMessage:`转账失败。请稍后重试。`}},p={name:`编辑状态（带初始值）`,args:{title:`编辑记账`,initialValues:{type:`transfer`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,transactionAt:`2026-06-04T01:30:05.000Z`,accountId:i.id,transferTargetAccountId:a.id,transferAmount:`5000`,note:`零花钱转账`}}},m={name:`编辑状态（相同账户禁用）`,args:{title:`编辑记账`,initialValues:{type:`transfer`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,transactionAt:`2026-06-04T01:30:05.000Z`,accountId:i.id,transferTargetAccountId:i.id,transferAmount:`1000`,note:``}}},h={name:`编辑状态（不同币种禁用）`,args:{title:`编辑记账`,accountOptions:[i,o],initialValues:{type:`transfer`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,transactionAt:`2026-06-04T01:30:05.000Z`,accountId:i.id,transferTargetAccountId:o.id,transferAmount:`2000`,note:``}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "默认状态（同币种两账户）"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "账户不足 2 个",
  args: {
    accountOptions: [jpyAccount1]
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accountOptions: []
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "不同币种账户",
  args: {
    accountOptions: [jpyAccount1, usdAccount]
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "带错误信息",
  args: {
    errorMessage: "转账失败。请稍后重试。"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
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
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}},g=[`Default`,`TooFewAccounts`,`NoAccounts`,`DifferentCurrency`,`WithError`,`Edit`,`EditSameAccount`,`EditDifferentCurrency`]}))();export{c as Default,d as DifferentCurrency,p as Edit,h as EditDifferentCurrency,m as EditSameAccount,u as NoAccounts,l as TooFewAccounts,f as WithError,g as __namedExportsOrder,s as default};