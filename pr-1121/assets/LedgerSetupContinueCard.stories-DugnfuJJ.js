import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,c as n}from"./LedgerSetupAbandonButton-TvMktqdT.js";import{n as r,t as i}from"./LedgerSetupContinueCard-Bm77EY2a.js";var a,o,s,c,l,u,d;e((()=>{t(),r(),{fn:a}=__STORYBOOK_MODULE_TEST__,o={title:`Organisms/Ledgers/LedgerSetupContinueCard`,component:i,decorators:n,args:{abandonAction:async()=>({}),onAbandoned:a(),onContinue:a(),setup:{id:`00000000-0000-4000-8000-000000000001`,name:`我们家`,step:3}}},s={name:`进行到第 3 步`},c={name:`进行到第 1 步`,args:{setup:{id:`00000000-0000-4000-8000-000000000001`,name:`我们家`,step:1}}},l={name:`账本名较长`,args:{setup:{id:`00000000-0000-4000-8000-000000000001`,name:`二〇二六年家庭日常开销与旅行共用账本`,step:5}}},u={name:`继续中`,args:{pending:!0}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "进行到第 3 步"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "进行到第 1 步",
  args: {
    setup: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "我们家",
      step: 1
    }
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "账本名较长",
  args: {
    setup: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "二〇二六年家庭日常开销与旅行共用账本",
      step: 5
    }
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "继续中",
  args: {
    pending: true
  }
}`,...u.parameters?.docs?.source}}},d=[`Default`,`FirstStep`,`LongName`,`Pending`]}))();export{s as Default,c as FirstStep,l as LongName,u as Pending,d as __namedExportsOrder,o as default};