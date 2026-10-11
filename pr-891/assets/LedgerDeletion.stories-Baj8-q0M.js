import{i as e}from"./preload-helper-D2yxXLVK.js";import{W as t}from"./DefaultPropsProvider-mjs6pdIw.js";import{n,p as r,r as i}from"./iframe-Dg6_AqWh.js";import{c as a,l as o,n as s,s as c,t as l,u}from"./LedgerDeletion-DpLIIQV_.js";async function d(e,t=1,n=!1){await p.click(h(e).getByRole(`button`,{name:`删除`}));let r=h(e.ownerDocument.body);if(t===2){let e=await r.findByRole(`button`,{name:`继续删除`});await m(()=>f(e).toBeEnabled()),await p.click(e)}return n&&await p.type(await r.findByRole(`textbox`,{name:`账本名`}),o.ledger.name),r}var f,p,m,h,g,_,v,y,b,x,S,C,w,T,E;e((()=>{r(),a(),n(),s(),{expect:f,userEvent:p,waitFor:m,within:h}=__STORYBOOK_MODULE_TEST__,g={title:`Organisms/Ledgers/LedgerDeletion`,component:l,args:{ledger:o.ledger,action:async()=>({}),loadImpact:u()}},_={name:`删除入口`},v={name:`第一步·有成员`,play:async({canvasElement:e})=>{await d(e)}},y={name:`第一步·无成员`,args:{loadImpact:u(c)},play:v.play},b={name:`第一步·有待邀请成员`,args:{loadImpact:u({...o.impact,placeholderNames:[`爷爷`]})},play:v.play},x={name:`第一步·读取中`,args:{loadImpact:()=>new Promise(()=>{})},play:v.play},S={name:`第一步·读取失败`,args:{loadImpact:async()=>({error:`删除影响读取失败，请稍后重试。`})},play:v.play},C={name:`第二步·未输入`,play:async({canvasElement:e})=>{await d(e,2)}},w={name:`第二步·已匹配`,play:async({canvasElement:e})=>{await d(e,2,!0)}},T={name:`第二步·提交中`,args:{action:()=>new Promise(()=>{})},play:async({canvasElement:e})=>{let n=await d(e,2,!0);await p.click(n.getByRole(`button`,{name:`永久删除`}));let r=await n.findByRole(`button`,{name:`正在删除…`});await f(r).toBeDisabled(),await f(h(r).getByRole(`progressbar`)).toBeVisible(),await f(getComputedStyle(r).backgroundColor).toBe(t(i.palette.error.main,.5))}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "删除入口"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "第一步·有成员",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement);
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "第一步·无成员",
  args: {
    loadImpact: loadLedgerDeletionImpactWith(emptyLedgerDeletionImpact)
  },
  play: FirstWithMembers.play
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "第一步·有待邀请成员",
  args: {
    loadImpact: loadLedgerDeletionImpactWith({
      ...ledgerDeletionFixture.impact,
      placeholderNames: ["爷爷"]
    })
  },
  play: FirstWithMembers.play
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "第一步·读取中",
  args: {
    loadImpact: () => new Promise(() => {})
  },
  play: FirstWithMembers.play
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "第一步·读取失败",
  args: {
    loadImpact: async () => ({
      error: "删除影响读取失败，请稍后重试。"
    })
  },
  play: FirstWithMembers.play
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "第二步·未输入",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement, 2);
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "第二步·已匹配",
  play: async ({
    canvasElement
  }) => {
    await open(canvasElement, 2, true);
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
    // 提交中保持淡红禁用按钮并显示转圈，而不是默认灰色禁用样式。
    const pending = await page.findByRole("button", {
      name: "正在删除…"
    });
    await expect(pending).toBeDisabled();
    await expect(within(pending).getByRole("progressbar")).toBeVisible();
    await expect(getComputedStyle(pending).backgroundColor).toBe(alpha(theme.palette.error.main, 0.5));
  }
}`,...T.parameters?.docs?.source}}},E=[`Default`,`FirstWithMembers`,`FirstWithoutMembers`,`FirstWithPlaceholders`,`FirstLoading`,`FirstLoadFailed`,`SecondEmpty`,`SecondMatched`,`Pending`]}))();export{_ as Default,S as FirstLoadFailed,x as FirstLoading,v as FirstWithMembers,b as FirstWithPlaceholders,y as FirstWithoutMembers,T as Pending,C as SecondEmpty,w as SecondMatched,E as __namedExportsOrder,g as default};