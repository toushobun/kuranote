import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,n,o as r,r as i,t as a}from"./accountHolders-Bb_kmsPg.js";import{i as o,n as s,r as c,t as l}from"./accounts-xUbHAqfQ.js";import{n as u,t as d}from"./AccountForm-jHAkPy9D.js";var f,p,m,h,g,_,v,y,b,x,S,C,w,T,E;e((()=>{r(),o(),u(),{userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m={component:d,title:`Organisms/Accounts/AccountForm`,args:{action:async()=>{},fetchIconAction:c,defaultCurrency:`JPY`,holderOptions:a,placeholderHolderOptions:n}},h={name:`初始状态`},g={name:`提交中`,args:{pending:!0}},_={name:`无可选持有人`,args:{holderOptions:[],placeholderHolderOptions:[]}},v={name:`编辑：以当前值填入`,args:{account:s}},y={name:`编辑：已有交易不能改币种`,args:{account:{...s,has_transactions:!0}}},b={name:`编辑：非活跃成员持有人`,args:{account:{...s,holders:[i(t)]}}},x={...s,website_url:l.website_url},S=async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`获取图标`}))},C={name:`网站图标：获取中`,args:{account:x,fetchIconAction:()=>new Promise(()=>{})},play:S},w={name:`网站图标：已获取`,args:{account:{...x,...l}}},T={name:`网站图标：获取失败`,args:{account:x,fetchIconAction:async()=>({})},play:S},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "初始状态"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "提交中",
  args: {
    pending: true
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "无可选持有人",
  args: {
    holderOptions: [],
    placeholderHolderOptions: []
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "编辑：以当前值填入",
  args: {
    account: bankAccountFixture
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "编辑：已有交易不能改币种",
  args: {
    account: {
      ...bankAccountFixture,
      has_transactions: true
    }
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "编辑：非活跃成员持有人",
  args: {
    account: {
      ...bankAccountFixture,
      holders: [createMemberAccountHolder(inactiveAccountHolderOptionFixture)]
    }
  }
}`,...b.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "网站图标：获取中",
  args: {
    account: accountWithWebsite,
    fetchIconAction: () => new Promise(() => {})
  },
  play: fetchIcon
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "网站图标：已获取",
  args: {
    account: {
      ...accountWithWebsite,
      ...accountWebsiteIconFixture
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "网站图标：获取失败",
  args: {
    account: accountWithWebsite,
    fetchIconAction: async () => ({})
  },
  play: fetchIcon
}`,...T.parameters?.docs?.source}}},E=[`Default`,`Pending`,`NoHolderOptions`,`Edit`,`EditCurrencyLocked`,`EditInactiveHolder`,`IconLoading`,`IconSuccess`,`IconError`]}))();export{h as Default,v as Edit,y as EditCurrencyLocked,b as EditInactiveHolder,T as IconError,C as IconLoading,w as IconSuccess,_ as NoHolderOptions,g as Pending,E as __namedExportsOrder,m as default};