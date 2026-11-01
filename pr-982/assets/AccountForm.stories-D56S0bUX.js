import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,n,o as r,r as i,t as a}from"./accountHolders-Bb_kmsPg.js";import{n as o,t as s}from"./accounts-DBIfIqi6.js";import{n as c,t as l}from"./AccountForm-CQfrbcOd.js";var u,d,f,p,m,h,g,_;e((()=>{r(),o(),c(),u={component:l,title:`Organisms/Accounts/AccountForm`,args:{action:async()=>{},defaultCurrency:`JPY`,holderOptions:a,placeholderHolderOptions:n}},d={name:`初始状态`},f={name:`提交中`,args:{pending:!0}},p={name:`无可选持有人`,args:{holderOptions:[],placeholderHolderOptions:[]}},m={name:`编辑：以当前值填入`,args:{account:s}},h={name:`编辑：已有交易不能改币种`,args:{account:{...s,has_transactions:!0}}},g={name:`编辑：非活跃成员持有人`,args:{account:{...s,holders:[i(t)]}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "初始状态"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "提交中",
  args: {
    pending: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "无可选持有人",
  args: {
    holderOptions: [],
    placeholderHolderOptions: []
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "编辑：以当前值填入",
  args: {
    account: bankAccountFixture
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "编辑：已有交易不能改币种",
  args: {
    account: {
      ...bankAccountFixture,
      has_transactions: true
    }
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "编辑：非活跃成员持有人",
  args: {
    account: {
      ...bankAccountFixture,
      holders: [createMemberAccountHolder(inactiveAccountHolderOptionFixture)]
    }
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`Pending`,`NoHolderOptions`,`Edit`,`EditCurrencyLocked`,`EditInactiveHolder`]}))();export{d as Default,m as Edit,h as EditCurrencyLocked,g as EditInactiveHolder,p as NoHolderOptions,f as Pending,_ as __namedExportsOrder,u as default};