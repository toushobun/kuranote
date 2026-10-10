import{i as e}from"./preload-helper-D2yxXLVK.js";import{c as t,l as n,n as r,s as i,t as a}from"./LedgerDeletion-vjWGvBTy.js";async function o(e,t=1,r=!1){await s.click(c(e).getByRole(`button`,{name:`删除`}));let i=c(e.ownerDocument.body);return t===2&&await s.click(await i.findByRole(`button`,{name:`继续删除`})),r&&await s.type(await i.findByRole(`textbox`,{name:`账本名`}),n.ledger.name),i}var s,c,l,u,d,f,p,m,h,g;e((()=>{t(),r(),{userEvent:s,within:c}=__STORYBOOK_MODULE_TEST__,l={title:`Organisms/Ledgers/LedgerDeletion`,component:a,args:{...n,action:async()=>({})}},u={name:`删除入口`},d={name:`第一步·有成员`,play:async({canvasElement:e})=>{await o(e)}},f={name:`第一步·无成员`,args:{impact:i},play:d.play},p={name:`第二步·未输入`,play:async({canvasElement:e})=>{await o(e,2)}},m={name:`第二步·已匹配`,play:async({canvasElement:e})=>{await o(e,2,!0)}},h={name:`第二步·提交中`,args:{action:()=>new Promise(()=>{})},play:async({canvasElement:e})=>{let t=await o(e,2,!0);await s.click(t.getByRole(`button`,{name:`永久删除`}))}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "删除入口"
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "第一步·有成员",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement);
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "第一步·无成员",
  args: {
    impact: emptyLedgerDeletionImpact
  },
  play: FirstWithMembers.play
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "第二步·未输入",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement, 2);
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "第二步·已匹配",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement, 2, true);
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "第二步·提交中",
  args: {
    action: () => new Promise(() => {})
  },
  play: async ({
    canvasElement
  }) => {
    const page = await open(canvasElement, 2, true);
    await userEvent.click(page.getByRole("button", {
      name: "永久删除"
    }));
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`FirstWithMembers`,`FirstWithoutMembers`,`SecondEmpty`,`SecondMatched`,`Pending`]}))();export{u as Default,d as FirstWithMembers,f as FirstWithoutMembers,h as Pending,p as SecondEmpty,m as SecondMatched,g as __namedExportsOrder,l as default};