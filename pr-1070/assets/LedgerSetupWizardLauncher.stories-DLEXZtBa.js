import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{F as n,I as r}from"./iframe-D3QJkHnh.js";import{s as i,t as a}from"./ledgerSetupMessages-DEWn6pIb.js";import{a as o,c as s,o as c,r as l}from"./LedgerSetupAbandonButton-BvNPT_dQ.js";import{i as u,n as d,r as f,t as p}from"./useLedgerSetupWizardLauncher-Al8eFwyf.js";function m(){let e=d(y);return(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(r,{onClick:()=>e.openWizard(`create`),children:`创建账本`}),(0,g.jsx)(f,{launcher:e})]})}async function h(e){return await _.click(v(e).getByRole(`button`,{name:`创建账本`})),v(e.ownerDocument.body).findByRole(`button`,{name:i.restart})}var g,_,v,y,b,x,S,C;e((()=>{g=t(),n(),a(),o(),u(),p(),{userEvent:_,within:v}=__STORYBOOK_MODULE_TEST__,y=l(c),b={title:`Organisms/Ledgers/LedgerSetupWizardLauncher`,component:m,decorators:s},x={name:`已有草稿（从创建入口打开）`,play:async({canvasElement:e})=>{await h(e)}},S={name:`重新创建确认中`,play:async({canvasElement:e})=>{await _.click(await h(e))}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "已有草稿（从创建入口打开）",
  play: async ({
    canvasElement
  }) => {
    await openDraft(canvasElement);
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "重新创建确认中",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(await openDraft(canvasElement));
  }
}`,...S.parameters?.docs?.source}}},C=[`ExistingDraft`,`RestartConfirmation`]}))();export{x as ExistingDraft,S as RestartConfirmation,C as __namedExportsOrder,b as default};