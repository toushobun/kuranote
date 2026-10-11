import{i as e}from"./preload-helper-D2yxXLVK.js";import{c as t,l as n,n as r,s as i,t as a,u as o}from"./LedgerDeletion-CeyK3MXS.js";async function s(e,t=1,r=!1){await l.click(d(e).getByRole(`button`,{name:`删除`}));let i=d(e.ownerDocument.body);if(t===2){let e=await i.findByRole(`button`,{name:`继续删除`});await u(()=>c(e).toBeEnabled()),await l.click(e)}return r&&await l.type(await i.findByRole(`textbox`,{name:`账本名`}),n.ledger.name),i}var c,l,u,d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{t(),r(),{expect:c,userEvent:l,waitFor:u,within:d}=__STORYBOOK_MODULE_TEST__,f={title:`Organisms/Ledgers/LedgerDeletion`,component:a,args:{ledger:n.ledger,action:async()=>({}),loadImpact:o()}},p={name:`删除入口`},m={name:`第一步·有成员`,play:async({canvasElement:e})=>{await s(e)}},h={name:`第一步·无成员`,args:{loadImpact:o(i)},play:m.play},g={name:`第一步·有待邀请成员`,args:{loadImpact:o({...n.impact,placeholderNames:[`爷爷`]})},play:m.play},_={name:`第一步·读取中`,args:{loadImpact:()=>new Promise(()=>{})},play:m.play},v={name:`第一步·读取失败`,args:{loadImpact:async()=>({error:`删除影响读取失败，请稍后重试。`})},play:m.play},y={name:`第二步·未输入`,play:async({canvasElement:e})=>{await s(e,2)}},b={name:`第二步·已匹配`,play:async({canvasElement:e})=>{await s(e,2,!0)}},x={name:`第二步·提交中`,args:{action:()=>new Promise(()=>{})},play:async({canvasElement:e})=>{let t=await s(e,2,!0);await l.click(t.getByRole(`button`,{name:`永久删除`}))}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "删除入口"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "第一步·有成员",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement);
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "第一步·无成员",
  args: {
    loadImpact: loadLedgerDeletionImpactWith(emptyLedgerDeletionImpact)
  },
  play: FirstWithMembers.play
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "第一步·有待邀请成员",
  args: {
    loadImpact: loadLedgerDeletionImpactWith({
      ...ledgerDeletionFixture.impact,
      placeholderNames: ["爷爷"]
    })
  },
  play: FirstWithMembers.play
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "第一步·读取中",
  args: {
    loadImpact: () => new Promise(() => {})
  },
  play: FirstWithMembers.play
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "第一步·读取失败",
  args: {
    loadImpact: async () => ({
      error: "删除影响读取失败，请稍后重试。"
    })
  },
  play: FirstWithMembers.play
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "第二步·未输入",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement, 2);
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "第二步·已匹配",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement, 2, true);
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S=[`Default`,`FirstWithMembers`,`FirstWithoutMembers`,`FirstWithPlaceholders`,`FirstLoading`,`FirstLoadFailed`,`SecondEmpty`,`SecondMatched`,`Pending`]}))();export{p as Default,v as FirstLoadFailed,_ as FirstLoading,m as FirstWithMembers,g as FirstWithPlaceholders,h as FirstWithoutMembers,x as Pending,y as SecondEmpty,b as SecondMatched,S as __namedExportsOrder,f as default};