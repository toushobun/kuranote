import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-BkOD3Npn.js";import{n as i,t as a}from"./ConfirmDialogProvider-BJ0U-2AS.js";import{i as o,n as s,r as c,t as l}from"./ledgerSetup-Ct1pGuUd.js";import{n as u,t as d}from"./LedgerSetupWizard-B7-ifVU1.js";function f(e){return l({draft:{...l().setup.draft,merchants:{selectedKeys:e,skipped:!1}},step:3},o)}function p(e){return{saveDraft:async()=>({progress:e}),submitBasicInfo:async()=>({progress:e})}}var m,h,g,_,v,y,b,x,S,C,w;e((()=>{m=t(),u(),i(),s(),n(),{userEvent:h,within:g}=__STORYBOOK_MODULE_TEST__,_=f(c),v={title:`Organisms/Ledgers/LedgerSetupMerchantsStep`,component:d,decorators:[e=>(0,m.jsx)(r,{children:(0,m.jsx)(a,{children:(0,m.jsx)(e,{})})})],args:{actions:p(_),defaults:{baseCurrency:`JPY`,displayColor:`amber`,displayName:`DENG SONGWEN`,ledgerName:`家庭账本`},onClose:()=>{},open:!0,progress:_},parameters:{viewport:{defaultViewport:`mobile2`}}},y={name:`默认（收起）`},b={name:`展开餐饮`,play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,{name:`餐饮`}))}},x={name:`全不选`,args:{progress:f([])}},S={name:`无模板币种`,args:{progress:l({baseCurrency:`USD`,step:3})}},C={name:`保存中`,args:{actions:{...p(_),saveDraft:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,{name:/^下一步/}))}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "默认（收起）"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "展开餐饮",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "餐饮"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "全不选",
  args: {
    progress: createMerchantsProgress([])
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "无模板币种",
  args: {
    progress: createLedgerSetupProgressFixture({
      baseCurrency: "USD",
      step: 3
    })
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    actions: {
      ...createActions(defaultProgress),
      saveDraft: () => new Promise(() => {})
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: /^下一步/
    }));
  }
}`,...C.parameters?.docs?.source}}},w=[`Default`,`ExpandRestaurant`,`SelectNone`,`WithoutTemplate`,`Saving`]}))();export{y as Default,b as ExpandRestaurant,C as Saving,x as SelectNone,S as WithoutTemplate,w as __namedExportsOrder,v as default};